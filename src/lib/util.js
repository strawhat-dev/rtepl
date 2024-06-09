const { isArray } = Array;

const { keys, fromEntries, defineProperty, getPrototypeOf, getOwnPropertyNames } = Object;

export const isDefined = (x) => x != null && !Number.isNaN(x);

/** @type {<T>(x: T) => T} */
export const id = (x) => x;

/** @type {<T extends ((...args: readonly any[]) => any)>(fn: T) => T} */
export const memoize = await import('memoize-one').then((memo) => memo.default);

/** @type {<T extends readonly any[]>(x: T) => T} */
export const asArray = (x) => isArray(x) ? x : isDefined(x) ? [x] : [];

/** @param {string} x @param {number} i */
export const splitIndex = (x, i) => /** @type {const} */ ([x?.slice(0, i), x?.slice(i)]);

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

/**
 * @template T
 * @param {Readonly<T>} obj
 * @returns {(keyof T)[]}
 */
export const getprops = (obj) => {
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

/**
 * case-insensitive string methods wrapper
 * @param {string} str
 */
export const istr = (str) => {
  if (!str) return;
  str = str.toLowerCase();
  return /** @type {const} */ ({
    includes: (search) => str.includes(search?.toLowerCase()),
    startsWith: (search) => str.startsWith(search?.toLowerCase()),
    endsWith: (search) => str.endsWith(search?.toLowerCase()),
  });
};

/**
 * @template {string} SubString
 * @param {string} str
 * @param {SubString} substr
 * @returns {[string, SubString | '', string]}
 */
export const splitSubstr = (str, substr) => {
  if (str == null) return ['', '', ''];
  const start = str.toLowerCase().indexOf(substr.toLowerCase?.());
  if (!~start) return [str, '', ''];
  const end = start + substr.length;
  const left = str.slice(0, start);
  const mid = str.slice(start, end);
  const right = str.slice(end);
  return [left, mid, right];
};

/**
 * @template {object} T
 * @param {[T, (item: T extends any[] ? T[number] : keyof T) => any]} args
 * @returns {T}
 */
export const sorted = (...args) => {
  if (!args.length) return (x) => sorted(x, id);
  if (args.length === 1 && typeof args[0] === 'function') return (x) => sorted(x, args[0]);
  const [obj, sortkey] = args;
  const compare = compareWithKey(sortkey);
  if (obj?.[Symbol.iterator]) return [...obj].sort(compare);
  return fromEntries(entries(obj).sort(([a], [b]) => compare(a, b)));
};

const sortOptions = /** @type {const} */ (['en-US', { usage: 'sort', numeric: true }]);

const compareWithKey = (sortkey = id) => (a, b) => {
  [a, b] = [sortkey(a), sortkey(b)];
  if (typeof a === 'string') return a.localeCompare(b, ...sortOptions);
  if (typeof b === 'string') return -b.localeCompare(a, ...sortOptions);
  return a < b ? -1 : a > b ? 1 : 0;
};
