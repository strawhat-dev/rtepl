import { $ } from 'execa';
import which from 'which';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import findCacheDir from 'find-cache-dir';
import { execaOptions } from './config.js';

const { isArray } = Array;
const {
  keys,
  fromEntries,
  defineProperty,
  getPrototypeOf,
  getOwnPropertyNames,
} = Object;

const clipboard = await import('clipboardy').then((cb) => ({
  read: cb.default.readSync,
  write: cb.default.write,
}));

export const isDefined = (x) => x != null && !Number.isNaN(x);

/** @type {<T>(x: T) => T} */
export const id = (x) => x;

/** @type {<T extends ((...args: readonly any[]) => any)>(fn: T) => T} */
export const memoize = await import('memoize-one').then((module) => module.default);

/** @type {<T extends readonly any[]>(x: T) => T} */
export const asArray = (x) => isArray(x) ? x : isDefined(x) ? [x] : [];

/** @param {string} x @param {number} i */
export const splitIndex = (x, i) => /** @type {const} */ ([x.slice(0, i), x.slice(i)]);

export const reduce = (arr, ...args) => {
  const [init = {}, reducer] = args;
  !isArray(arr) && arr[Symbol.iterator] && (arr = [...arr]);
  if (!arr?.length) return init;
  return arr.reduce((acc, x, i) => reducer(acc, x, i) ?? acc, init) ?? init;
};

/**
 * @template T
 * @param {readonly T[]} arr
 * @param {(cur: T) => void} callback
 */
export const foreach = (arr, callback) => {
  const len = arr?.length;
  for (let i = 0; i < len; ++i) callback(arr[i]);
  return arr;
};

/**
 * @template {object} T
 * @template {Record<string, unknown>} Props
 * @param {T} target
 * @param {Readonly<Props>} props
 * @returns {T & Props}
 */
export const define = (target, props) => {
  props || ([target, props] = [{}, target]);
  for (const key of keys(props)) defineProperty(target, key, { value: props[key] });
  return target;
};

/**
 * @template {object} T
 * @param {T} obj
 * @returns {[keyof T, T[keyof T]][]}
 */
export const entries = (obj) => {
  if (!obj) return [];
  const ret = keys(obj);
  const len = ret.length;
  for (let i = 0; i < len; ++i) ret[i] = [ret[i], obj[ret[i]]];
  return ret;
};

export const sorted = (...args) => {
  if (!args.length) return (res) => sorted(res, id);
  if (args.length === 1 && typeof args[0] === 'function') return (res) => sorted(res, args[0]);
  const [obj, sortkey = id] = args;
  const sortOptions = ['en-US', { usage: 'sort', numeric: true }];
  const compareFn = (a, b) => {
    [a, b] = [sortkey(a), sortkey(b)];
    if (typeof a === 'string') return a.localeCompare(b, ...sortOptions);
    if (typeof b === 'string') return -b.localeCompare(a, ...sortOptions);
    return a < b ? -1 : a > b ? 1 : 0;
  };

  if (obj?.[Symbol.iterator]) return [...obj].sort(compareFn);
  return fromEntries(entries(obj).sort(([a], [b]) => compareFn(a, b)));
};

/**
 * @template T
 * @param {Readonly<T>} obj
 * @returns {(keyof T)[]}
 */
export const props = (obj) => {
  if (obj == null) return [];
  const set = new Set();
  let cur = getOwnPropertyNames(obj);
  do for (let i = 0; i < cur.length; ++i) set.add(cur[i]); while (
    (obj = getPrototypeOf(obj)) &&
    obj !== Object.prototype &&
    (cur = getOwnPropertyNames(obj))
  );

  return sorted(set, (prop) => prop.replace(/^([^a-z$])/i, 'zz$1'));
};

/** @param {import('rtepl').REPLServer} repl */
export const setupREPL = (repl) => {
  try {
    const cwd = dirname(fileURLToPath(import.meta.url));
    const dir = findCacheDir({ cwd, name: 'rtepl', create: true });
    dir && repl.setupHistory(join(dir, '.node_repl_history'), id);
  } catch (_) {}

  define(repl.context, { resolve_dynamic_module });
  return define(repl, { clipboard });
};

/** @param {import('rtepl').REPLServer} repl */
export const initExeca = (repl, shell = 'bash') => {
  shell = which.sync(shell, { nothrow: true });
  const execa = $({ ...execaOptions, shell });
  return define(execa({ stdio: 'pipe' }), {
    repl,
    /** @param {[TemplateStringsArray, ...any[]]} args */
    async run(...args) {
      repl.clearBufferedCommand();
      return new Promise((resolve) => {
        const proc = execa({ stdio: 'inherit', forceKillAfterDelay: 100 })(...args);
        repl.on('SIGINT', () => proc.kill('SIGKILL'));
        proc.once('exit', repl.resume);
        return resolve(proc);
      });
    },
  });
};

const resolve_dynamic_module = (key, defaultImport, namedImport) => {
  const mod = global[key];
  defaultImport && (global[defaultImport] = mod.default || mod);
  return namedImport in mod ? mod : mod.default;
};
