import os from 'node:os';
import { $ } from 'execa';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import findCacheDir from 'find-cache-dir';
import { execOptions } from './config.js';
import { green } from './ansi.js';

const { keys, defineProperty } = Object;

export const asArray = (x) => Array.isArray(x) ? x : x == null ? [] : [x];

export const reduce = (...args) => {
  if (args.length < 3) return (res) => reduce(res, ...args);
  const [arr, init = {}, resolve] = args;
  return arr.reduce((acc, x, i) => resolve(acc, x, i) ?? acc, init) ?? init;
};

export const foreach = (arr, callback) => {
  if (!arr) return [];
  const len = arr.length;
  for (let i = 0; i < len; ++i) callback(arr[i], i);
};

export const entries = (obj) => {
  if (!obj) return [];
  const ret = keys(obj);
  const len = ret.length;
  for (let i = 0; i < len; ++i) ret[i] = [ret[i], obj[ret[i]]];
  return ret;
};

/**
 * @template {object} T
 * @template {Record<string, any>} Props
 * @param {T} target
 * @param {Readonly<Props>} props
 * @returns {T & Props}
 */
export const define = (target, props) => {
  props ?? ([target, props] = [{}, target]);
  for (const key of keys(props)) {
    const value = props[key];
    defineProperty(target, key, { value });
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
export const replExec = (repl) => {
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

  console.log(green`
  node ${process.version}
  ${osInfo} ${os.machine()}
  ${os.cpus().pop().model}
  `);
};
