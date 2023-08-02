import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { parse } from '@adobe/css-tools';
import { Chalk } from 'chalk';
import { makeTaggedTemplate } from 'chalk-template';
import { emphasize } from 'emphasize/lib/core.js';
import xml from 'highlight.js/lib/languages/xml';
import typescript from 'highlight.js/lib/languages/typescript';
import { defaultSheet, supportedProps, themes } from './config.js';
import { extend } from '../util.js';

/** @param {import('repl').ReplOptions} */
export const initHighlighter = ({ output, theme, sheet: config }) => {
  const chalk = new Chalk(output?.isTTY ? { level: 3 } : {});
  const chalkTemplate = makeTaggedTemplate(chalk);
  emphasize.registerLanguage('typescript', typescript);
  emphasize.registerLanguage('xml', xml); // needed for jsx support for some reason
  const sheet = initSheet(chalk, { ...defaultSheet, ...parseTheme(theme, config) });
  const colorize = (code) => emphasize.highlight('tsx', code, sheet).value;
  extend(global, {
    $log: extend((...args) => console.log(chalkTemplate(...args)), {
      highlight: (code) => console.log(colorize(code)),
    }),
  });

  return { colorize, chalk };
};

/**
 * @param {import('chalk').ChalkInstance} chalk
 * @param {import('repl').ReplOptions['sheet']}
 * @returns {import('emphasize').Sheet}
 */
const initSheet = (chalk, { default: [fallback] = [], ...rest }) => {
  const instance = fallback?.startsWith('#') ? chalk.hex(fallback) : chalk;
  return Object.entries(rest).reduce((sheet, [prop, values]) => {
    sheet[prop] = (Array.isArray(values) ? values : [values]).reduce(
      (acc, style) => (style.startsWith?.('#') ? acc.hex(style) : acc[style] || acc),
      instance
    );

    return sheet;
  }, {});
};

/**
 * @param {import('repl').ReplOptions['theme']} theme
 * @param {import('repl').ReplOptions['sheet']} config
 * @returns {import('repl').ReplOptions['sheet']}
 */
const parseTheme = (theme, config = {}) => {
  if (!themes.has(theme)) return config;
  const { resolve } = createRequire(import.meta.url);
  const css = readFileSync(resolve(`highlight.js/styles/${theme}.css`), 'utf-8');
  const { rules } = parse(css)?.stylesheet ?? {};
  return rules?.reduce((acc, { selectors, declarations }) => {
    if (!selectors || !declarations) return acc;
    const values = declarations.reduce((cur, { property, value }) => {
      if (supportedProps.includes(property)) {
        property === 'font-weight' && +value > 400 && (value = 'bold');
        cur.push(value);
      }

      return cur;
    }, []);

    (values.length ? selectors : []).forEach((selector) => {
      const cur = selector.replace(/[.]hljs-?/g, '') || 'default';
      Array.isArray(acc[cur]) || (acc[cur] = typeof acc[cur] === 'string' ? [acc[cur]] : []);
      acc[cur].push(...values);
    });

    return acc;
  }, config);
};
