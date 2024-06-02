import { clearLine, clearScreenDown } from 'node:readline';
import { define, sorted, splitIndex } from '../util.js';
import { ansi } from '../ansi.js';

const getCursorPos = await import('get-cursor-position').then(
  ({ default: { sync } }) => () => sync().row
);

/**
 * {@link https://github.com/nodejs/node/blob/main/lib/internal/repl/utils.js#L143}
 * @param {import('rtepl').REPLServer} repl
 */
export const setupPreview = (repl) => {
  let escaped = null;
  let completionPreview = null;
  let previewCompletionCounter = 0;
  let insertCompletionPreview = true;
  const bufferSymbol = getOwnPropertySymbols(repl).find((s) => s.description === 'bufferedCommand');
  const defaultClearLine = repl.clearLine.bind(repl);

  repl.clearLine = () => {
    insertCompletionPreview = false;
    defaultClearLine();
    insertCompletionPreview = true;
  };

  /**
   * {@link https://github.com/nodejs/node/blob/main/lib/internal/repl/utils.js#L225}
   * @param {import('node:readline').Key} key
   */
  const showPreview = (key = {}) => {
    const { line, isCompletionEnabled } = repl;
    const completeKey = ['tab', 'right'].includes(key.name);
    if (
      !line.includes('.') || !isCompletionEnabled || repl[bufferSymbol] ||
      repl.input.isPaused() || (completeKey && !repl.isCursorAtInputEnd()) ||
      ['return', 'enter', 'escape', 'space', 'up', 'left', 'down'].includes(key.name)
    ) return key.name === 'tab' && repl._insertString('  ');

    const count = ++previewCompletionCounter;
    repl.completer(line, (err, [results, current]) => {
      if (err || !results?.length) return;
      const maxLines = Math.floor((repl.rows - getCursorPos()) * 0.9);
      const partial = (x) => (x ?? '').slice(current.length).trim();
      const completions = sorted(
        results.filter((x) => x.includes(current) && partial(x)),
        (x) => partial(x).replace(/^([^a-z$])/i, 'zz$1')
      );

      const [top, ...rest] = completions.slice(0, maxLines);
      let suffix = partial(top);
      if (count !== previewCompletionCounter || !(suffix || rest.length)) return;
      suffix ||= partial(rest.pop());
      rest.length || rest.unshift(current + suffix);
      if (insertCompletionPreview && completeKey) return repl._insertString(suffix);
      completionPreview = dim(suffix) + '\n' + rest.map((item) => {
        const [match, nonmatch] = splitIndex(item, current.length);
        return cyan`${bold(match)}${dim(nonmatch)}`;
      }).join('\n');

      process.stdout.write(cursorSavePosition);
      repl._writeToOutput(completionPreview);
      process.stdout.write(cursorRestorePosition);
    });
  };

  /** @param {import('node:readline').Key} key */
  const clearPreview = (key) => {
    if (completionPreview !== null) {
      // Prevent cursor moves if not necessary!
      let pos, rows;
      const move = repl.line.length !== repl.cursor;
      if (move) {
        pos = repl.getPreviewPos();
        process.stdout.write(cursorTo(pos.displayPos.cols));
        rows = pos.displayPos.rows - pos.cursorPos.rows;
        process.stdout.write(cursorMove(0, rows));
      }

      const newPos = repl._getDisplayPos(`${repl.getPrompt()}${repl.line}${completionPreview}`);

      // Minimize work for the terminal. It is enough to clear the right part of
      // the current line in case the preview is visible on a single line.
      newPos.rows === 0 || (pos && pos.displayPos.rows === newPos.rows) ?
        clearLine(repl.output, 1) :
        clearScreenDown(repl.output);

      if (move) {
        process.stdout.write(cursorTo(pos.cursorPos.cols));
        process.stdout.write(cursorMove(0, -rows));
      }

      if (!key.ctrl && !key.shift) {
        if (key.name === 'escape') escaped === null && key.meta && (escaped = repl.line);
        else if (
          !key.meta && ['enter', 'return'].includes(key.name) &&
          escaped !== repl.line && repl.isCursorAtInputEnd()
        ) repl._insertString(completionPreview);
      }

      completionPreview = null;
    }

    escaped === repl.line || (escaped = null);
  };

  return define(repl, { showPreview, clearPreview });
};

const { getOwnPropertySymbols } = Object;

const {
  dim,
  bold,
  cyan,
  cursorTo,
  cursorMove,
  cursorSavePosition,
  cursorRestorePosition,
} = ansi;
