import json from 'jsonfile';
import isBuiltinModule from 'is-builtin-module';
import { transform } from '@esbuild-kit/core-utils';
import { initProp } from './abstract-syntax-tree.js';

// https://github.com/esbuild-kit/tsx/blob/develop/src/patch-repl.ts
/** @type {Parameters<typeof transform>[2]} */
const tsconfig = {
  minify: false,
  loader: 'ts',
  format: 'esm',
  target: 'esnext',
  platform: 'node',
  define: { require: 'global.require' },
  tsconfigRaw: { compilerOptions: { preserveValueImports: true } },
};

/**  @param {Parameters<import('repl').REPLEval>} */
export const esbuild = async ([code, _, file]) => {
  ({ code } = await transform(code, file, tsconfig).catch(() => ({ code })));
  return code;
};

/**
 * @param {string} name
 * @param {import('repl').ReplOptions['extensions']}
 */
export const resolveModule = (name, { cdn }) => {
  if (!cdn || isBuiltinModule(name)) return name;
  const [mod, submod] = name.split('/');
  const packageJSON = json.readFileSync('package.json', { throws: false });
  const { dependencies, devDependencies } = { ...packageJSON };
  const modules = Object.keys({ ...dependencies, ...devDependencies });
  if (modules.includes(mod) || modules.includes(`${mod}/${submod}`)) return name;
  return `https://cdn.jsdelivr.net/npm/${name}/+esm`;
};

/**
 * @param {{
 *   name?: string,
 *   assignment: typeof resolvedChain,
 *   properties: ReturnType<typeof initProp>[]
 * }} acc
 *
 * @param {import('meriyah').ESTree.ImportClause}
 */
// prettier-ignore
export const staticImportReducer = (acc, { type, local, imported }) => ({
 ImportSpecifier: () => (acc.properties.push(initProp(imported, local)), acc),
 ImportDefaultSpecifier: () => ((acc.name = local.name), acc),
 ImportNamespaceSpecifier() {
   if (acc.name) {
     // move global assignment of already used default import
     // to destructured property import, i.e. `({ default: name } = ...)`
     acc.properties.push(
       initProp({ type: 'Identifier', name: 'default' }, { type: 'Identifier', name: acc.name })
     );

     // replace the name and value to be assigned
     // from the default import to the namespace import
     acc.name = local.name;
     acc.assignment = acc.assignment.right;
     return acc;
   }
 },
}[type]?.());
