import { isatty } from 'node:tty';

isatty(1) && (process.env.FORCE_COLOR = '3');

export * from 'ansis';

export const ansi = await import('ansis').then(({ Ansis }) => new Ansis());
