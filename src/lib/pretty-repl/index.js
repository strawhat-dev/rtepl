import repl from 'node:repl';
import termsize from 'terminal-size';
import stringWidth from 'fast-string-width';
import { inspectDefaults } from './config.js';
import { define, isDefined, memoize, reduce } from '../util.js';
import { ansiRegex, computeCommonPrefixLength, matchingBrackets } from './util.js';
import { initHighlighter } from './highlight.js';
import { setupPreview } from './preview.js';
import { ansi } from '../ansi.js';

const { assign, defineProperties } = Object;

// Every open/close pair that should be matched against its counterpart for highlighting.
const BRACKETS = '()[]{}\'"`$';

/** @param {import('rtepl').ReplOptions} options */
export const start = (options) => new REPLServer(options);

// https://github.com/mongodb-js/pretty-repl/blob/master/lib/pretty-repl.js
export class REPLServer extends repl.REPLServer {
  /** @param {import('rtepl').ReplOptions} options */
  constructor(options = {}) {
    super(assign(options, { preview: false }));
    super.removeHistoryDuplicates = true;
    super.tabSize = 4;
    this.rows = termsize().rows;
    this.promptRow = undefined;
    this.promptStatus = 'default';
    this.lineBeforeInsert = undefined;
    this.highlightBracketPosition = -1;

    assign(this.writer.options, {
      ...inspectDefaults,
      breakLength: Math.floor(termsize().columns * 0.90),
    });

    defineProperties(
      define(setupPreview(this), initHighlighter(options)),
      { context: { enumerable: false }, history: { enumerable: false } }
    );

    this.setErrorPrompt = () => void assign(this, { promptStatus: 'error' });
    this.setDefaultPrompt = () => void assign(this, { promptStatus: 'default' });
    this.findAllMatchingBracketsIgnoreMismatches = memoize((str) => matchingBrackets(str, true));
    this.findAllMatchingBracketsIncludeMismatches = memoize((str) => matchingBrackets(str, false));
    this.computeCommonPrefixLength = memoize(computeCommonPrefixLength);
    this.strlen = memoize((str) => stringWidth(String(str)));

    this.findMatchingBracket = memoize((line, position) => {
      // Find the matching bracket opposite of the one at position.
      const brackets = this.findAllMatchingBracketsIncludeMismatches(line);
      for (const { start, end } of brackets) {
        if (start === position) return end;
        if (end === position) return start;
      }

      return -1;
    });

    this.stripCompleteJSStructures = memoize((str) => {
      // Remove substructures of the JS input string `str` in order to simplify it,
      // by removing matching pairs of quotes and parentheses/brackets.
      // Specifically, remove all but the last, non-nested pair of (), because ()
      // can affect whether the previous word is seen as a keyword.
      // E.g.: When input is `function() {`, do not replace the ().
      //       When input is `{ foo(); }`, do replace the `()`, then afterwards the `{ ... }`.
      const brackets = this.findAllMatchingBracketsIgnoreMismatches(str);
      const { kind, parent } = brackets.at(-1) || {};
      kind === '(' && parent?.end === -1 && brackets.pop();

      // Remove brackets in reverse order, so that their indices remain valid.
      for (let i = brackets.length - 1; i >= 0; --i) {
        const { parent } = brackets[i];
        parent?.end === -1 && (str = [
          str.substr(0, brackets[i].start),
          str.substr(brackets[i].end + 1),
        ].join(''));
      }

      return str;
    });
  }

  /** @param {any[]} values */
  formatColumns = (values) => {
    const cells = values.filter(isDefined).map(ansi.green);
    const width = Math.max(...cells.map(this.strlen)) + 3;
    const cols = Math.floor(this.columns / width) || 1;
    const rows = Math.ceil(cells.length / cols) || 1;
    if (cols === 1 || rows < 3) return this._writeToOutput(' ' + cells.join('\n '));
    const padCell = (cell) => cell + Array(width - this.strlen(cell) + 1).join(' ');
    this._writeToOutput(
      reduce(cells.map(padCell), Array(rows).fill(' '), (acc, cur, i) => {
        acc[i % acc.length] += cur;
      }).join('\n')
    );
  };

  get columns() {
    const { rows, columns } = termsize();
    const breakLength = Math.floor(columns * 0.90);
    assign(assign(this, { rows }).writer.options, { breakLength });
    return columns;
  }

  pause = () => {
    super.clearBufferedCommand();
    super.pause();
  };

  resume = () => {
    super.resume();
    this.displayPrompt(true);
  };

  prompt = (preserveCursor) => {
    const prompt = this.getPrompt();
    prompt.includes('...') || super.setPrompt(prompt);
    super.prompt(preserveCursor);
  };

  displayPrompt = (preserveCursor) => {
    const prompt = this.getPrompt();
    prompt.includes('...') || super.setPrompt(prompt);
    super.displayPrompt(preserveCursor);
  };

  getPrompt = () => {
    this.promptRow = this.row;
    const prompt = ansi.strip(super.getPrompt());
    const state = (this.promptStatus ||= 'default');
    const highlight = ansi[{ default: 'green', error: 'red' }[state]];
    return highlight(prompt);
  };

  getPreviewPos = () => {
    const displayPos = this._getDisplayPos(`${this.getPrompt()}${this.line}`);
    const cursorPos = this.line.length !== this.cursor ? this.getCursorPos() : displayPos;
    return { displayPos, cursorPos };
  };

  isCursorAtInputEnd = () => {
    const { cursorPos, displayPos } = this.getPreviewPos();
    return cursorPos.rows === displayPos.rows && cursorPos.cols === displayPos.cols;
  };

  /** @param {import('node:readline').Key} key */
  _ttyWrite = (data, key = {}) => {
    this.clearPreview(key);

    if (key.meta && key.name === 'return') {
      return this._insertString('\n');
    }

    if (key.ctrl && key.name === 'v') {
      const text = this.clipboard.read().replaceAll('\r', '');
      return this._insertString(text.trim());
    }

    key.name === 'tab' || super._ttyWrite(data, key);
    this.showPreview(key);
  };

  _ttyWriteTitle = (str) => {
    if (str = ansi.strip(str.trim())) {
      process.stdout.write(`\x1b]2;${str}\x1b\\`);
    }
  };

  // prettier-ignore
  _insertString = (str) => {
    this.lineBeforeInsert = this.line;
    try { return super._insertString(str); }
    finally { this.lineBeforeInsert = undefined; }
  };

  // If the cursor is moved onto or off a bracket,
  // refresh the whole line so that we can mark the matching bracket.
  _moveCursor = (dx) => {
    const cursorWasOnBracket = BRACKETS.includes(this.line[this.cursor]);
    super._moveCursor(dx);
    const cursorIsOnBracket = BRACKETS.includes(this.line[this.cursor]);
    (cursorWasOnBracket || cursorIsOnBracket) && this._refreshLine();
  };

  // When refreshinng the whole line, find matching brackets and keep the position
  // of the matching one in mind (if there is any).
  _refreshLine = () => {
    try {
      BRACKETS.includes(this.line[this.cursor]) && (
        this.highlightBracketPosition = this.findMatchingBracket(this.line, this.cursor)
      );
      super._refreshLine();
    } finally {
      this.highlightBracketPosition = -1;
    }
  };

  /** @returns {void} */
  _writeToOutput = (str) => {
    // Skip false-y values, and if we print only whitespace or have
    // not yet been fully initialized, just write to output directly.
    if (!this.colorize || !str?.trim?.()) return void this.output.write(str);

    // In this case, the method is being called from _insertString,
    // which appends a string to the end of the current line.
    `${this.lineBeforeInsert ?? +this.line}${str}` === this.line ?
      this._writeAppendedString(str) :
      str.startsWith(this.getPrompt()) ?
      this._writeFullLine(str) :
      super._writeToOutput(str);
  };

  _writeAppendedString = (str) => {
    // First, we simplify whatever existing line structure is present in a
    // way that preserves highlighting of any subsequent part of the code.
    // The goal here is to reduce the amount of code that needs to be highlighted,
    // because this typically runs once for each character that is entered.
    const simplified = this.stripCompleteJSStructures(this.lineBeforeInsert);
    // Colorize the 'before' state.
    const before = this.colorize(simplified);
    // Colorize the 'after' state, using the same simplification (this works because
    // `lineBeforeInsert + str === line` implies that
    // `simplified       + str` is a valid simplification of `line`,
    // and the former is a precondition for this method to be called).
    const after = this.colorize(simplified + str);
    // Find the first character or escape sequence that differs in `before` and `after`.
    const commonPrefixLength = this.computeCommonPrefixLength(before, after);
    // Gather all escape sequences that occur in the *common* part of the string.
    // Applying them all one after another puts the terminal into the state of the
    // highlighting at the divergence point.
    // (This makes the assumption that those escape sequences only affect formatting,
    // not e.g. cursor position, which seem like a reasonable assumption to make
    // for the output from a syntax highlighter).
    let ansiStatements = before.slice(0, commonPrefixLength).match(ansiRegex) || [];
    // Filter out any foreground color settings before the last reset (\x1b[39m).
    // This helps reduce the amount of useless clutter we write a bit, and in
    // particular helps the mongosh test suite not ReDOS itself when verifying
    // output coloring.
    const lastForegroundColorReset = ansiStatements.lastIndexOf('\x1b[39m');
    if (lastForegroundColorReset !== -1) {
      ansiStatements = ansiStatements.filter((sequence, i) =>
        i > lastForegroundColorReset || !/^\x1b\[3\d.*m$/.test(sequence)
      );
    }

    // In order to get from `before` to `after`, we have to reduce the `before` state
    // back to the common prefix of the two. Do that by counting all the
    // non-escape-sequence characters in what comes after the common prefix
    // in `before`.
    const backtrackLength = this.strlen(before.slice(commonPrefixLength));
    // Put it all together: Backtrack from `before` to the common prefix, apply
    // all the escape sequences that were present before, and then apply the
    // new output from `after`.
    this.output.write([
      '\b'.repeat(backtrackLength),
      ansiStatements.join(''),
      after.slice(commonPrefixLength),
    ].join(''));
  };

  _writeFullLine = (str) => {
    const prompt = this.getPrompt();
    str = str.substring(prompt.length);
    // If the output starts with the prompt (which is when this method is called),
    // it's reasonable to assume that we're printing a full line (which happens
    // relatively frequently with the Node.js REPL).
    // In those cases, we split the string into prompt and non-prompt parts,
    // and colorize the full non-prompt part.
    if (this.highlightBracketPosition !== -1) {
      // If there is a matching bracket, we mark it in the string before
      // highlighting using BOM characters (because it seems safe to assume
      // that they are ignored by highlighting) so that we can remember where
      // the bracket was. Then remove the BOM characters again and colorize the bracket in between.

      str = this.colorize([
        str.substring(0, this.highlightBracketPosition),
        str[this.highlightBracketPosition],
        str.substring(this.highlightBracketPosition + 1),
      ].join('\ufeff')).replace(/\ufeff(.+)\ufeff/, (_, bracket) => ansi.underline(bracket));
    } else str = this.colorize(str);
    this.output.write(prompt + str);
  };
}

export default { start, REPLServer };
