import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { parse } from '@adobe/css-tools';
import { createEmphasize } from 'emphasize';
import xml from 'highlight.js/lib/languages/xml';
import typescript from 'highlight.js/lib/languages/typescript';
import { defaultSheet, supportedProps, themes } from './config.js';
import { asArray, foreach, memo, reduce } from '../util.js';
import { ansi } from '../ansi.js';

const { entries } = Object;

/** @param {import('repl').ReplOptions} */
export const initHighlighter = ({ theme, sheet: config }) => {
  const emphasize = createEmphasize();
  emphasize.register('typescript', typescript);
  emphasize.register('xml', xml); // needed for jsx support for some reason
  const sheet = initSheet({ ...defaultSheet, ...parseTheme(theme, config) });
  const colorize = memo((code) => emphasize.highlight('tsx', code, sheet).value);
  return { colorize };
};

/**
 * @param {import('repl').ReplOptions['sheet']}
 * @returns {import('emphasize').Sheet}
 */
const initSheet = ({ default: [fallback] = [], ...rest }) => {
  const instance = fallback?.startsWith('#') ? ansi.hex(fallback) : ansi;
  return reduce(entries(rest), {}, (sheet, [prop, values]) => {
    sheet[prop] = reduce(asArray(values), instance, (acc, style) => (
      style.startsWith?.('#') ?
        acc.hex(style) :
        style.startsWith?.('rgb') ?
        acc.rgb(...(style.match(/\b\d+\b/g) || [])) :
        acc[style]
    ));
  });
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
  const { rules } = parse(css)?.stylesheet || {};
  return reduce(rules, config, (acc, { selectors, declarations }) => {
    if (!selectors || !declarations) return;

    const values = reduce(declarations, [], (cur, { property, value }) => {
      if (property in config) return;
      if (!supportedProps.includes(property)) return;
      property === 'font-weight' && (value = +value > 400 ? 'bold' : 'dim');
      cur.push(value);
    });

    values.length && foreach(selectors, (selector) => {
      const cur = selector.replace(/\.hljs-?/g, '') || 'default';
      (acc[cur] = asArray(acc[cur])).push(...values);
    });
  });
};
