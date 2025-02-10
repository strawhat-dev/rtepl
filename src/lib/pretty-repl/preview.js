import rl from 'node:readline';
import { ansi } from '../ansi.js';
import { istr, memo, sorted, splitIndex, splitSubstr } from '../util.js';

const distance = await import('fastest-levenshtein').then(
  ({ distance }) => memo(distance)
);

const getCursorPos = await import('get-cursor-position').then(
  ({ default: { sync } }) => () => sync().row
);

/**
 * {@link https://github.com/nodejs/node/blob/main/lib/internal/repl/utils.js#L143}
 * @param {import('rtepl').REPLServer} repl
 */
export const setupPreview = (repl) => {
  let escaped = null;
  let inputPreview = null;
  let completionPreview = null;
  let previewCompletionCounter = 0;
  let insertCompletionPreview = true;
  const tabSpace = ' '.repeat(repl.tabSize);
  const bufferSymbol = getOwnPropertySymbols(repl).find((s) => s.description === 'bufferedCommand');

  /**
   * {@link https://github.com/nodejs/node/blob/main/lib/internal/repl/utils.js#L174}
   * @param {import('node:readline').Key} key
   */
  const clearPreview = (key) => {
    if (inputPreview != null) {
      const cursorPos = repl.getCursorPos();
      const displayPos = repl._getDisplayPos(`${repl.getPrompt()}${repl.line}`);
      const rows = displayPos.rows - cursorPos.rows + 1;
      process.stderr.write(cursorMove(0, rows));
      rl.clearLine(repl.output);
      process.stderr.write(cursorMove(0, -rows));
      inputPreview = null;
    }
    if (completionPreview != null) {
      // Prevent cursor moves if not necessary!
      const move = repl.line.length !== repl.cursor;
      let rows, cursorPos, displayPos;
      if (move) {
        cursorPos = repl.getCursorPos();
        displayPos = repl._getDisplayPos(`${repl.getPrompt()}${repl.line}`);
        process.stderr.write(cursorTo(displayPos.cols));
        rows = displayPos.rows - cursorPos.rows;
        process.stderr.write(cursorMove(0, rows));
      }

      const newPos = repl._getDisplayPos(`${repl.getPrompt()}${repl.line}${completionPreview}`);

      // Minimize work for the terminal. It is enough to clear the right part of
      // the current line in case the preview is visible on a single line.
      if (newPos.rows === 0 || (displayPos?.rows === newPos.rows)) rl.clearLine(repl.output, 1);
      else rl.clearScreenDown(repl.output);

      if (move) {
        process.stderr.write(cursorTo(cursorPos.cols));
        process.stderr.write(cursorMove(0, -rows));
      }

      if (
        key.meta && !key.ctrl && !key.shift &&
        escaped == null && key.name === 'escape'
      ) escaped = repl.line;

      completionPreview = null;
    }

    escaped === repl.line || (escaped = null);
  };

  /**
   * {@link https://github.com/nodejs/node/blob/main/lib/internal/repl/utils.js#L225}
   * @param {import('node:readline').Key} key
   */
  const showPreview = async (key = {}) => {
    if (
      inputPreview != null || completionPreview != null || repl[bufferSymbol] ||
      !repl.line.trim() || repl.input.isPaused() || !repl.isCompletionEnabled ||
      ['return', 'enter', 'escape', 'space', 'up', 'down'].includes(key.name)
    ) return key.name === 'tab' && repl._insertString(tabSpace);

    const count = ++previewCompletionCounter;
    const curWordBack = repl.line.slice(0, repl.cursor).split(' ').pop();
    const [partialLine, current] = splitIndex(
      repl.line,
      repl.line.indexOf('.', repl.cursor - curWordBack.length) + 1
    );

    const completer = await new Promise((resolve) =>
      repl.completer(repl.line, (_, [results, input]) => resolve({ results, input }))
    );

    const completion = await new Promise((resolve) => {
      if (!curWordBack.includes('.')) return resolve({});
      return repl.completer(partialLine, (err, [results, input]) => {
        const useDefaultComplete = !results.length && completer.results.length;
        useDefaultComplete && results.push(...completer.results) && (input = completer.input);
        if (err || !results.length) return resolve({});
        const maxLines = Math.floor((repl.rows - getCursorPos()) * 0.8);
        const complete = (x) => (x ?? '').slice(input.length).trim();
        const completions = sorted(
          results.filter((comp) => {
            useDefaultComplete || (comp = complete(comp));
            if (comp === current) return;
            return istr(comp)?.includes(current);
          }).slice(0, maxLines),
          (comp) => {
            comp = complete(comp);
            if (!current) return comp.replace(/^([^a-z$])/i, 'zz$1');
            const dLength = comp.length - current.length;
            const prefixBonus = istr(comp)?.startsWith(current) * dLength;
            return distance(comp, current) - prefixBonus;
          }
        );

        if (!completions.length) return resolve({});
        if (key.name === 'tab') {
          return resolve({ useDefaultComplete, insert: complete(completions[0]) });
        }

        const preview = '\n' + completions.map((x) => {
          const [first, rest] = splitIndex(x, input?.length);
          const item = bold(first) + splitSubstr(rest, current).map(
            (section, i) => section ? (i % 2 ? bold : dim)(section) : ''
          ).join('');

          return cyan(item);
        }).join('\n');

        return resolve({ preview });
      });
    });

    if (count !== previewCompletionCounter) return;
    if (
      !completion.insert &&
      repl.cursor >= repl.line.length &&
      !['left', 'backspace'].includes(key.name) &&
      (inputPreview = repl.history.find((x) => x.startsWith(repl.line))?.slice(repl.line.length))
    ) {
      assign(
        completion,
        { preview: [dim(inputPreview), completion.preview?.trim()].filter(Boolean).join('\n') },
        key.sequence === '\x1B[C' && { insert: inputPreview, useDefaultComplete: true }
      );
    }

    if (completion.insert) {
      if (!insertCompletionPreview) return;
      repl.cursor >= repl.line.length || repl._ttyWrite(null, { name: 'f', meta: true });
      completion.useDefaultComplete || !current || repl._ttyWrite(null, { name: 'w', ctrl: true });
      return repl._insertString(completion.insert);
    }

    if (completion.preview) {
      process.stderr.write(cursorSavePosition);
      repl._writeToOutput(completionPreview = completion.preview);
      process.stderr.write(cursorRestorePosition);
    }
  };

  // -------------------------------------------------------------------------//
  // Replace multiple interface functions. This is required to fully support  //
  // previews without changing readlines behavior.                            //
  // -------------------------------------------------------------------------//
  const defaultClearLine = repl.clearLine.bind(repl);
  const defaultRefreshLine = repl._refreshLine.bind(repl);
  const defaultMoveCursor = repl._moveCursor.bind(repl);
  const defaultTTYWrite = repl._ttyWrite.bind(repl);

  // This is the only function that interferes with the completion insertion.
  // Monkey patch it to prevent inserting the completion when it shouldn't be.
  const clearLine = () => {
    insertCompletionPreview = false;
    defaultClearLine();
    insertCompletionPreview = true;
  };

  // Refresh prints the whole screen again and the preview will be removed
  // during that procedure. Print the preview again. This also makes sure
  // the preview is always correct after resizing the terminal window.
  const _refreshLine = () => {
    inputPreview = null;
    defaultRefreshLine();
    process.nextTick(showPreview);
  };

  // Insert the longest common suffix of the current input in case the user
  // moves to the right while already being at the current input end.
  const _moveCursor = (dx) => {
    const { cursor } = repl;
    defaultMoveCursor(dx);
    if (
      insertCompletionPreview &&
      cursor + dx > repl.line.length &&
      typeof repl.completer === 'function'
    ) process.nextTick(showPreview);
  };

  /** @param {import('node:readline').Key} key */
  const _ttyWrite = (data, key = {}) => {
    if (key.meta && key.name === 'return') {
      return repl._insertString('\n');
    }

    if (key.ctrl && key.name === 'v') {
      const text = repl.context.clipboard.read();
      return repl._insertString(ansi.strip(text));
    }

    if (key.ctrl && key.name === 'z') {
      return defaultTTYWrite(null, { sequence: '\u001f' });
    }

    clearPreview(key);
    key.name === 'tab' || defaultTTYWrite(data, key);
    process.nextTick(() => showPreview(key));
  };

  return assign(repl, { _ttyWrite, _moveCursor, _refreshLine, clearLine });
};

const { assign, getOwnPropertySymbols } = Object;

const {
  dim,
  bold,
  cyan,
  cursorTo,
  cursorMove,
  cursorSavePosition,
  cursorRestorePosition,
} = ansi;
