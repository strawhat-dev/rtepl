export const toUnix = (p) => p?.replace(/\\/g, '/').replace(/(?<!^)\/+/g, '/');

export const unixify = (fn) => {
  return (...args) => {
    for (let i = 0; i < args.length; ++i) {
      typeof args[i] === 'string' && (args[i] = toUnix(args[i]));
    }

    let ret = fn(...args);
    typeof ret === 'string' && (ret = toUnix(ret));
    return ret;
  };
};

export const isValidExt = (ext = '', { ignore = [], maxLength = 7 } = {}) => (
  ext &&
  ext.length <= maxLength &&
  !ignore.some((val) => (val?.[0] === '.' || (val = `.${ext}`), val === ext))
);
