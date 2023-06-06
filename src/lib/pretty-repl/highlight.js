import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { parse } from 'css';
import { Chalk } from 'chalk';
import { emphasize } from 'emphasize/lib/core.js';
import typescript from 'highlight.js/lib/languages/typescript';
import { defaultSheet, supportedProps, themes } from './config.js';

/** @param {import('repl').ReplOptions} */
export const initHighlighter = ({ output, theme, sheet: config }) => {
  const chalk = new Chalk({ level: output.isTTY ? 3 : 0 });
  const sheet = initSheet(chalk, { ...defaultSheet, ...parseTheme(theme, config) });
  emphasize.registerLanguage('typescript', typescript);
  const highlighter = (code) => emphasize.highlight('ts', code, sheet).value;
  highlighter.underline = output.isTTY && chalk.underline;
  return highlighter;
};

/**
 * @param {import('chalk').ChalkInstance} chalk
 * @param {import('repl').ReplOptions['theme']} config
 */
const initSheet = (chalk, { default: fallback, ...rest }) => {
  fallback && (chalk = fallback.startsWith?.('#') ? chalk.hex(fallback) : chalk[fallback] || chalk);
  return Object.entries(rest).reduce((sheet, [prop, values]) => {
    Array.isArray(values) || (values = [values]);
    sheet[prop] = values.reduce((instance, style) => {
      if (style.startsWith('#')) return instance.hex(style);
      return instance[style] || instance;
    }, chalk);

    return sheet;
  }, {});
};

/**
 * @param {import('repl').ReplOptions['theme']} theme
 * @param {import('repl').ReplOptions['sheet']} config
 */
const parseTheme = (theme, config = {}) => {
  if (!themes.has(theme)) return config;
  const require = createRequire(import.meta.url);
  const css = readFileSync(require.resolve(`highlight.js/styles/${theme}.css`), 'utf-8');
  const { rules } = parse(css).stylesheet;
  return rules.reduce((acc, { selectors, declarations }) => {
    const values = declarations
      .filter(({ property }) => supportedProps.includes(property))
      .map(({ property, value }) => (property === 'font-weight' && +value > 400 ? 'bold' : value));

    // prettier-ignore
    values.length && selectors.forEach((hljsSelector) => {
      const selector = hljsSelector.replace(/[.]hljs-?/g, '') || 'default';
      if (!Array.isArray(acc[selector])) {
        acc[selector] = typeof acc[selector] === 'string' ? [acc[selector]] : [];
      }

      acc[selector].push(...values);
    });

    return acc;
  }, config);
};
