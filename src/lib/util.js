import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import os from 'node:os';
import chalk from 'chalk';
import { $ } from 'execa';
import findCacheDir from 'find-cache-dir';
import { execOptions } from './config.js';

/**
 * @template {object} T
 * @template {Record<string, any>} Props
 * @param {T} target
 * @param {Readonly<Props>} props
 * @returns {T & Props}
 */
export const extend = (target, props) => {
  props ?? ([target, props] = [{}, target]);
  for (const key of Object.keys(props)) {
    const value = props[key];
    Object.defineProperty(target, key, { value });
  }

  return target;
};

/** @param {import('repl').REPLServer} repl */
export const withHistory = (repl) => {
  try {
    const cwd = dirname(fileURLToPath(import.meta.url));
    const dir = findCacheDir({ cwd, name: 'rtepl', create: true });
    dir && repl.setupHistory(`${dir}/.node_repl_history`, () => {});
  } catch (_) {}

  return repl;
};

/** @param {import('repl').REPLServer} repl */
export const withExec = (repl) => {
  const exec = $(execOptions);
  return async (...args) => {
    const cmd = exec(...args);
    cmd.on('spawn', () => repl.clearBufferedCommand());
    cmd.on('close', () => repl.displayPrompt(true));
    const ret = await cmd;
    ret.exitCode && repl.setErrorPrompt();
    return ret;
  };
};

export const displayEnvironmentInfo = () => {
  let osInfo = os.version();

  // os.version() on macOS too verbose
  if (process.platform === 'darwin') {
    osInfo = `${process.platform} v${os.release()}`;
  }

  console.log(chalk.green(`
  node ${process.version}
  ${osInfo} ${os.machine()}
  ${os.cpus().pop().model}
`));
};

export const re = (raw, ...subs) => {
  let pattern = String.raw({ raw }, ...subs.map(escapeRegexStr));
  const flags = (pattern.match(RE_FLAG_PATTERN) || [''])[0].slice(1);
  flags && (pattern = pattern.replace(RE_FLAG_PATTERN, ''));
  return new RegExp(pattern, flags);
};

const RE_FLAG_PATTERN = /[/]\b(?!\w*(\w)\w*\1)[dgimsuy]+\b$/;
const escapeRegexStr = (s) => {
  return s?.toString().replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d');
};
