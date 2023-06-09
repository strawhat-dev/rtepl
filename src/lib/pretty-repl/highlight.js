import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { Chalk } from 'chalk';
import { parse } from '@adobe/css-tools';
import { emphasize } from 'emphasize/lib/core.js';
import xml from 'highlight.js/lib/languages/xml';
import typescript from 'highlight.js/lib/languages/typescript';
import { defaultSheet, supportedProps, themes } from './config.js';

/** @param {import('repl').ReplOptions} */
export const initHighlighter = ({ output, theme, sheet: config }) => {
  const chalk = new Chalk({ level: output.isTTY ? 3 : 0 });
  const sheet = initSheet(chalk, { ...defaultSheet, ...parseTheme(theme, config) });
  emphasize.registerLanguage('typescript', typescript);
  emphasize.registerLanguage('xml', xml); // needed for jsx support
  const highlighter = (code) => emphasize.highlight('tsx', code, sheet).value;
  highlighter.underline = output.isTTY && chalk.underline;
  return highlighter;
};

/**
 * @param {import('chalk').ChalkInstance} chalk
 * @param {import('repl').ReplOptions['sheet']}
 * @returns {import('emphasize').Sheet}
 */
//prettier-ignore
const initSheet = (chalk, { default: fallback, ...rest }) => (
  (chalk = fallback?.startsWith?.('#') ? chalk.hex(fallback) : chalk[fallback] || chalk),
  Object.entries(rest).reduce((sheet, [prop, values]) => {
    Array.isArray(values) || (values = [values]);
    sheet[prop] = values.reduce((instance, style) =>
      style.startsWith('#') ? instance.hex(style) : instance[style] || instance,
      chalk
    );

    return sheet;
  }, {})
);

/**
 * @param {import('repl').ReplOptions['theme']} theme
 * @param {import('repl').ReplOptions['sheet']} config
 */
const parseTheme = (theme, config = {}) => {
  if (!themes.has(theme)) return config;
  const { resolve } = createRequire(import.meta.url);
  const css = readFileSync(resolve(`highlight.js/styles/${theme}.css`), 'utf-8');
  const { rules } = parse(css)?.stylesheet ?? {};
  return rules?.reduce((acc, { selectors, declarations }) => {
    if (!selectors || !declarations) return acc;
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
