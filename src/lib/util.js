import os from 'node:os';
import { $ } from 'execa';
import { green } from './ansi.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { execaOptions } from './config.js';
import findCacheDir from 'find-cache-dir';

const { isArray } = Array;
const { keys, defineProperty } = Object;

/**
 * @template {object} T
 * @template {Record<string, any>} Props
 * @param {T} target
 * @param {Readonly<Props>} props
 * @returns {T & Props}
 */
export const define = (target, props) => {
  props || ([target, props] = [{}, target]);
  for (const key of keys(props)) {
    const value = props[key];
    defineProperty(target, key, { value });
  }

  return target;
};

export const entries = (obj) => {
  if (!obj) return [];
  const ret = keys(obj);
  const len = ret.length;
  for (let i = 0; i < len; ++i) ret[i] = [ret[i], obj[ret[i]]];
  return ret;
};

export const asArray = (x) => isArray(x) ? x : x == null ? [] : [x];

export const foreach = (arr, callback) => {
  if (!arr) return [];
  const len = arr.length;
  for (let i = 0; i < len; ++i) callback(arr[i], i);
};

export const reduce = (...args) => {
  if (args.length < 3) return (res) => reduce(res, ...args);
  const [arr, init = {}, resolve] = args;
  return arr.reduce((acc, x, i) => resolve(acc, x, i) ?? acc, init) ?? init;
};

/** @param {import('repl').REPLServer} repl */
export const initExeca = (repl, shell = 'bash') => {
  const execa = $({ ...execaOptions, shell });
  const displayPromptOnClose = (code) => {
    code && repl.setErrorPrompt();
    repl.displayPrompt(true);
  };

  return async (...args) => {
    const proc = execa(...args);
    proc.on('spawn', repl.clearBufferedCommand);
    proc.on('close', displayPromptOnClose);
    return proc;
  };
};

/** @param {import('repl').REPLServer} repl */
export const initHistory = (repl) => {
  try {
    const cwd = dirname(fileURLToPath(import.meta.url));
    const dir = findCacheDir({ cwd, name: 'rtepl', create: true });
    dir && repl.setupHistory(join(dir, '.node_repl_history'), () => {});
  } catch (_) {}

  return repl;
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

export const resolve_global_module = (key, defaultImport, namedImport) => {
  const mod = global[key];
  defaultImport && (global[defaultImport] = mod.default ?? mod);
  return namedImport in mod ? mod : mod.default;
};
