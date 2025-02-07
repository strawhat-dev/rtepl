import escapes from 'ansi-escapes';
import { isatty } from 'node:tty';
import { define } from './util.js';

isatty(1) && (process.env.FORCE_COLOR = '3');

export const ansi = await import('ansis').then(({ Ansis }) => define(new Ansis(), escapes));
