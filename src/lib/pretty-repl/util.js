import ANSIRegex from 'ansi-regex';

const QUOTE_PAIRS = ["''", '""', '``'];
const BRACKET_PAIRS = ['()', '[]', '{}', '$}'];

export const ansiRegex = ANSIRegex();

/**
 * Count the number of Unicode codepoints in a string,
 * i.e. [...str].length without the intermediate Array instance.
 */
export const characterCount = (str) => {
  let i, c;
  for (i = 0, c = 0; i < str.length; ++i) {
    if (str.charCodeAt(i) >= 0xd800 && str.charCodeAt(i) < 0xdc00) continue;
    ++c;
  }

  return c;
};

/**
 * Compute the length of the longest common prefix of 'before' and 'after',
 * taking ANSI escape sequences into account.
 * - ex:
 *   - 'abcd', 'abab' -> 2
 *   - 'ab\x1b[3m', 'ab\x1b[5m' -> 2 (not 4)
 */
export const computeCommonPrefixLength = (before, after) => {
  let i = 0;
  while (i < Math.min(before.length, after.length) && before[i] === after[i]) {
    // Regex that matches ANSI escape sequences only at the beginning of a string.
    const pattern = new RegExp(`^(${ansiRegex.source})`);
    const match = before.substr(i).match(pattern);
    if (match && !match.index) {
      if (i === after.indexOf(match[0], i)) {
        i += match[0].length; // Add length of matching ANSI escape sequence found in both strings.
      } else break; // Non-matching ANSI escape sequence; treat as entirely different from here.
    } else ++i;
  }

  return i;
};

/**
 * Helper function that converts functions into memoized
 * versions of themselves with a fixed-size LRU cache.
 */
export const memoizeTransformer = (cacheSize, fn) => {
  const cache = new Map();
  return function (str) {
    if (cache.has(str)) return cache.get(str);
    const result = fn.call(this, str);
    cache.set(str, result);
    if (cache.size > cacheSize) {
      const [[oldestKey]] = cache;
      cache.delete(oldestKey);
    }

    return result;
  };
};

/**
 * Find all matching brackets inside a string.
 */
export const matchingBrackets = (str, ignoreMismatches) => {
  // 'stack' maintains a list of all currently open brackets,
  // 'matches' a list of all closed brackets (i.e. the return value).
  const stack = [];
  const matches = [];
  for (let i = 0; i < str.length; ++i) {
    const current = stack.length > 0 ? stack.at(-1) : null;
    const currentKind = current ? current.kind : '';
    switch (currentKind) {
      case '':
      case '(':
      case '[':
      case '{':
      case '$':
        switch (str[i]) {
          case '(':
          case '[':
          case '{':
          case "'":
          case '"':
          case '`':
            stack.push({ start: i, end: -1, kind: str[i], parent: current });
            break;
          case ')':
          case ']':
          case '}':
            for (let j = stack.length - 1; j >= 0; --j) {
              const entry = stack[j];
              if (BRACKET_PAIRS.includes(`${entry.kind}${str[i]}`)) {
                const isProperMatch = j === stack.length - 1;
                stack.splice(j); // Unwind the stack in any case.
                if (!ignoreMismatches || isProperMatch) {
                  entry.end = i;
                  matches.push(entry);
                }

                break;
              }
            }

            break;
        }

        break;
      case "'":
      case '"':
      case '`':
        switch (str[i]) {
          case "'":
          case '"':
          case '`':
          case '$': {
            let j; // Count number of preceding \ characters
            for (j = 0; j < i && str[i - j - 1] == '\\'; j++);
            if (j % 2 === 1) break; // This is an escaped character, so we can ignore it.
            if (QUOTE_PAIRS.includes(`${currentKind}${str[i]}`)) {
              const entry = stack.pop();
              entry.end = i;
              matches.push(entry);
            } else if (str[i] === '$' && str[i + 1] === '{' && currentKind === '`') {
              stack.push({ start: i++, end: -1, kind: '$', parent: current });
            }

            break;
          }
        }

        break;
    }
  }

  return matches;
};
