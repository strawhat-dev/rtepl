import REPL from 'node:repl';
import stripAnsi from 'strip-ansi';
import { initHighlighter } from './highlight.js';
import {
  ansiRegex,
  characterCount,
  computeCommonPrefixLength,
  matchingBrackets,
  memoizeTransformer,
} from './util.js';

// Every open/close pair that should be matched against its counterpart for highlighting.
const BRACKETS = '()[]{}\'"`$';

// https://github.com/mongodb-js/pretty-repl/blob/master/lib/pretty-repl.js
class REPLServer extends REPL.REPLServer {
  /** @param {import('node:repl').ReplOptions} options */
  constructor(options = {}) {
    const { colorize, chalk } = initHighlighter(options);
    const promptChar = options.prompt || '> ';
    const $prompt = { default: chalk.green(promptChar), error: chalk.red(promptChar) };
    options.prompt = $prompt.default;
    super(options);

    /** @type {keyof $prompt} */
    this.state = 'default';
    this.$prompt = $prompt;
    this.colorize = colorize;
    this.underline = chalk.underline;
    this.highlightBracketPosition = -1;
    this.lineBeforeInsert = undefined;

    this._doColorize = memoizeTransformer(100, function(str) {
      return this.colorize(str);
    });

    this._findAllMatchingBracketsIgnoreMismatches = memoizeTransformer(1000, function(str) {
      return matchingBrackets(str, true);
    });

    this._findAllMatchingBracketsIncludeMismatches = memoizeTransformer(1000, function(str) {
      return matchingBrackets(str, false);
    });

    this._stripCompleteJSStructures = memoizeTransformer(1000, function(str) {
      // Remove substructures of the JS input string `str` in order to simplify it,
      // by removing matching pairs of quotes and parentheses/brackets.
      // Specifically, remove all but the last, non-nested pair of (), because ()
      // can affect whether the previous word is seen as a keyword.
      // E.g.: When input is `function() {`, do not replace the ().
      //       When input is `{ foo(); }`, do replace the `()`, then afterwards the `{ ... }`.
      const brackets = this._findAllMatchingBracketsIgnoreMismatches(str);
      const { kind, parent } = brackets.at(-1) ?? {};
      kind === '(' && parent?.end === -1 && brackets.pop();

      // Remove brackets in reverse order, so that their indices remain valid.
      for (let i = brackets.length - 1; i >= 0; --i) {
        const { parent } = brackets[i];
        if (parent?.end === -1) {
          str = `${str.substr(0, brackets[i].start)}${str.substr(brackets[i].end + 1)}`;
        }
      }

      return str;
    });
  }

  applyPromptState() {
    super.setPrompt(this.$prompt[this.state]);
  }

  setDefaultPrompt() {
    if (this.state !== 'default') {
      this.state = 'default';
      this.applyPromptState();
    }
  }

  setErrorPrompt() {
    if (this.state !== 'error') {
      this.state = 'error';
      this.applyPromptState();
    }
  }

  // If the cursor is moved onto or off a bracket,
  // refresh the whole line so that we can mark the matching bracket.
  _moveCursor(dx) {
    const cursorWasOnBracket = BRACKETS.includes(this.line[this.cursor]);
    super._moveCursor(dx);
    const cursorIsOnBracket = BRACKETS.includes(this.line[this.cursor]);
    (cursorWasOnBracket || cursorIsOnBracket) && this._refreshLine();
  }

  // When refreshinng the whole line, find matching brackets and keep the position
  // of the matching one in mind (if there is any).
  // prettier-ignore
  _refreshLine() {
    try {
      this.underline && BRACKETS.includes(this.line[this.cursor]) &&
      (this.highlightBracketPosition = this._findMatchingBracket(this.line, this.cursor));
      return super._refreshLine();
    } finally { this.highlightBracketPosition = -1; }
  }

  _writeToOutput(stringToWrite) {
    // Skip false-y values, and if we print only whitespace or have
    // not yet been fully initialized, just write to output directly.
    if (!stringToWrite) return;
    if (stringToWrite.match(/^\s+$/) || !this.colorize) {
      this.output.write(stringToWrite);
      return;
    }

    // prettier-ignore
    const appendableString = (
      this.lineBeforeInsert !== undefined &&
      `${this.lineBeforeInsert}${stringToWrite}` === this.line
    );

    // In this case, the method is being called from _insertString,
    // which appends a string to the end of the current line.
    if (appendableString) this._writeAppendedString(stringToWrite);
    else if (stringToWrite.startsWith(this._prompt)) this._writeFullLine(stringToWrite);
    else super._writeToOutput(stringToWrite); // fallback to native REPL implementation
  }

  _writeAppendedString(stringToWrite) {
    // First, we simplify whatever existing line structure is present in a
    // way that preserves highlighting of any subsequent part of the code.
    // The goal here is to reduce the amount of code that needs to be highlighted,
    // because this typically runs once for each character that is entered.
    const simplified = this._stripCompleteJSStructures(this.lineBeforeInsert);
    // Colorize the 'before' state.
    const before = this._doColorize(simplified);
    // Colorize the 'after' state, using the same simplification (this works because
    // `lineBeforeInsert + stringToWrite === line` implies that
    // `simplified       + stringToWrite` is a valid simplification of `line`,
    // and the former is a precondition for this method to be called).
    const after = this._doColorize(simplified + stringToWrite);
    // Find the first character or escape sequence that differs in `before` and `after`.
    const commonPrefixLength = computeCommonPrefixLength(before, after);
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
      ansiStatements = ansiStatements.filter(
        (sequence, i) => i > lastForegroundColorReset || !sequence.match(/^\x1b\[3\d.*m$/)
      );
    }

    // In order to get from `before` to `after`, we have to reduce the `before` state
    // back to the common prefix of the two. Do that by counting all the
    // non-escape-sequence characters in what comes after the common prefix
    // in `before`.
    const backtrackLength = characterCount(stripAnsi(before.slice(commonPrefixLength)));
    // Put it all together: Backtrack from `before` to the common prefix, apply
    // all the escape sequences that were present before, and then apply the
    // new output from `after`.
    this.output.write(
      `${'\b'.repeat(backtrackLength)}${ansiStatements.join('')}${after.slice(commonPrefixLength)}`
    );
  }

  _writeFullLine(stringToWrite) {
    // If the output starts with the prompt (which is when this method is called),
    // it's reasonable to assume that we're printing a full line (which happens
    // relatively frequently with the Node.js REPL).
    // In those cases, we split the string into prompt and non-prompt parts,
    // and colorize the full non-prompt part.
    stringToWrite = stringToWrite.substring(this._prompt.length);
    if (this.highlightBracketPosition !== -1) {
      // If there is a matching bracket, we mark it in the string before
      // highlighting using BOM characters (because it seems safe to assume
      // that they are ignored by highlighting) so that we can remember where
      // the bracket was.
      stringToWrite = this._doColorize(
        `${stringToWrite.substring(0, this.highlightBracketPosition)}\ufeff${
          stringToWrite[this.highlightBracketPosition]
        }\ufeff${stringToWrite.substring(this.highlightBracketPosition + 1)}`
      );

      // Then remove the BOM characters again and colorize the bracket in between.
      stringToWrite = stringToWrite.replace(
        /\ufeff(.+)\ufeff/,
        (_, bracket) => this.underline(bracket)
      );
    } else stringToWrite = this._doColorize(stringToWrite);

    this.output.write(`${this._prompt}${stringToWrite}`);
  }

  // prettier-ignore
  _insertString(c) {
    this.lineBeforeInsert = this.line;
    try { return super._insertString(c); }
    finally { this.lineBeforeInsert = undefined; }
  }

  // Find the matching bracket opposite of the one at `position`.
  _findMatchingBracket(line, position) {
    const brackets = this._findAllMatchingBracketsIncludeMismatches(line);
    for (const { start, end } of brackets) {
      if (start === position) return end;
      if (end === position) return start;
    }

    return -1;
  }
}

export const defaultREPL = REPL;
export default { REPLServer, start: (options) => new REPLServer(options) };
