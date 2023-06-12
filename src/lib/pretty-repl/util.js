import ANSIRegex from 'ansi-regex';

export const ansiRegex = ANSIRegex();

/** Regex that matches ANSI escape sequences only at the beginning of a string. */
const STARTING_ANSI_RE = new RegExp(`^(${ansiRegex.source})`);
const BRACKET_PAIRS = ['()', '[]', '{}', '$}'];
const QUOTE_PAIRS = ["''", '""', '``'];

/**
 * Count the number of Unicode codepoints in a string,
 * i.e. [...str].length without the intermediate Array instance. \
 * {@link https://github.com/mongodb-js/pretty-repl/blob/main/lib/pretty-repl.js#L44}
 */
export const characterCount = (str) => {
  let count = 0;
  for (let i = 0; i < str.length; ++i) {
    (str.charCodeAt(i) < 0xd800 || str.charCodeAt(i) >= 0xdc00) && ++count;
  }

  return count;
};

/**
 * Compute the length of the longest common prefix of `before`
 * and `after`, taking ANSI escape sequences into account. \
 * {@link https://github.com/mongodb-js/pretty-repl/blob/main/lib/pretty-repl.js#L22}
 * @example
 * computeCommonPrefixLength('abcd', 'abab') === 2
 * computeCommonPrefixLength('ab\x1b[3m', 'ab\x1b[5m') === 2 // (not 4)
 */
export const computeCommonPrefixLength = (before, after) => {
  let i = 0;
  while (i < Math.min(before.length, after.length) && before[i] === after[i]) {
    // Add length of ANSI escape sequence found in both strings if matching.
    const match = before.substr(i).match(STARTING_ANSI_RE);
    if (match?.index === 0) {
      if (i !== after.indexOf(match[0], i)) break;
      i += match[0].length;
    } else ++i;
  }

  return i;
};

/**
 * Helper function that converts functions into memoized
 * versions of themselves with a fixed-size LRU cache. \
 * {@link https://github.com/mongodb-js/pretty-repl/blob/main/lib/memoize-string-transformer.js}
 */
export const memoizeTransformer = (maxSize, fn) => {
  const cache = new Map();
  /** @param {string} s */
  return function (str) {
    if (cache.has(str)) return cache.get(str);
    const ret = fn.call(this, str);
    cache.set(str, ret);
    if (cache.size > maxSize) {
      const [[oldestKey]] = cache;
      cache.delete(oldestKey);
    }

    return ret;
  };
};

/**
 * Find all matching brackets inside a string. \
 * {@link https://github.com/mongodb-js/pretty-repl/blob/main/lib/find-all-matching-brackets.js}
 */
export const matchingBrackets = (str, ignoreMismatches) => {
  // 'stack' maintains a list of all currently open brackets,
  // 'matches' a list of all closed brackets (i.e. the return value).
  const [stack, matches] = [[], []];
  for (let i = 0; i < str.length; ++i) {
    const kind = str[i];
    const parent = stack.at(-1) ?? null;
    const { kind: current } = parent || { kind: '' };
    switch (current) {
      case '':
      case '(':
      case '[':
      case '{':
      case '$':
        switch (kind) {
          case '(':
          case '[':
          case '{':
          case "'":
          case '"':
          case '`':
            stack.push({ kind, parent, start: i, end: -1 });
            break;
          case ')':
          case ']':
          case '}':
            for (let j = stack.length - 1; j >= 0; --j) {
              const entry = stack[j];
              if (BRACKET_PAIRS.includes(`${entry.kind}${kind}`)) {
                stack.splice(j); // Unwind the stack in any case.
                (!ignoreMismatches || j === stack.length - 1) && matches.push({ ...entry, end: i });
                break;
              }
            }

            break;
        }

        break;
      case "'":
      case '"':
      case '`':
        switch (kind) {
          case "'":
          case '"':
          case '`':
          case '$': {
            let count; // Count number of preceding '\' characters
            for (count = 0; count < i && str[i - 1 - count] === '\\'; count++);
            if (count % 2 === 1) break; // This is an escaped character, so we can ignore it.
            if (QUOTE_PAIRS.includes(`${current}${kind}`)) matches.push({ ...stack.pop(), end: i });
            else if (current === '`' && str.slice(i, i + 2) === '${') {
              stack.push({ kind, parent, start: i++, end: -1 });
            }

            break;
          }
        }

        break;
    }
  }

  return matches;
};
