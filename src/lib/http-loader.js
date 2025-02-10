/**
 * https://nodejs.org/api/module.html#loadurl-context-nextload
 * @type {import('node:module').LoadHook}
 */
export async function load(url, ctx, defaultLoad) {
  if (!/^https?:\/\//.test(url)) return defaultLoad(url, ctx);
  const res = await fetch(url);
  if (!res.ok) return httpError(res.status);
  const source = await res.text();
  const format = parseJSON(source) ? 'json' : 'module';
  return { source, format, shortCircuit: true };
}

// prettier-ignore
const parseJSON = (text) => { try { return JSON.parse(text); } catch {} };

const httpError = (code) => Promise.reject(new Error(`The requested URL returned error: ${code}`));
