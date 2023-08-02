import path from 'node:path';

import { re } from '../util.js';
import { isValidExt, toUnix, unixify } from './util.js';

export { toUnix };
export const sep = '/';
export const delimiter = path.delimiter;
export const basename = unixify(path.basename);
export const dirname = unixify(path.dirname);
export const extname = unixify(path.extname);
export const format = unixify(path.format);
export const isAbsolute = unixify(path.isAbsolute);
export const join = unixify(path.join);
export const relative = unixify(path.relative);
export const resolve = unixify(path.resolve);
export const toNamespacedPath = unixify(path.toNamespacedPath);

export const parse = (p) => {
  const ret = path.parse(toUnix(p));
  const [root] = ret.dir.split(sep);
  root.endsWith(':') && (ret.root ||= `${root}/`);
  return ret;
};

export const normalize = (p) => {
  p = toUnix(p);
  let ret = toUnix(path.normalize(p));
  if (p.startsWith('./') && !ret.startsWith('./') && !ret.startsWith('..')) {
    ret = `./${ret}`;
  } else if (p.startsWith('//') && !ret.startsWith('//')) {
    ret = `${p.startsWith('//./') ? '//.' : '/'}${ret}`;
  }

  return ret.replace(/(?<!:)(?<=.+)\/$/, '');
};

export const trimExt = (p, opts) => {
  const ext = extname(p);
  if (!isValidExt(ext, opts)) return p;
  return p.replace(re`${ext}$`, '');
};

export const addExt = (p, ext) => {
  if (!ext) return p;
  ext[0] === '.' || (ext = `.${ext}`);
  p.endsWith(ext) || (p = `${p}${ext}`);
  return p;
};

export const defaultExt = (p, ext, opts) => (
  isValidExt(p, opts) ? extname(p) : addExt(p, ext)
);

export const changeExt = (p, ext, opts) => (
  ext[0] === '.' || (ext = `.${ext}`), `${trimExt(p, opts)}${ext}`
);

export const removeExt = (p, ext) => {
  if (!ext) return p;
  ext[0] === '.' || (ext = `.${ext}`);
  if (extname(p) === ext) return trimExt(p, { maxLength: ext.length });
  return p;
};

const $path = {
  addExt,
  basename,
  changeExt,
  defaultExt,
  delimiter,
  dirname,
  extname,
  format,
  isAbsolute,
  join,
  normalize,
  parse,
  relative,
  removeExt,
  resolve,
  sep,
  toNamespacedPath,
  toUnix,
  trimExt,
};

$path['win32'] = $path;
$path['posix'] = $path;
export const win32 = $path;
export const posix = $path;
export default $path;
