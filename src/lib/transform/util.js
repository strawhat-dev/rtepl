import { createRequire, isBuiltin } from 'node:module';
import { transform } from '@esbuild-kit/core-utils';
import {
  dynamicImportDeclaration,
  initProp,
  resolvedImportDeclaration,
} from './abstract-syntax-tree.js';

// https://github.com/esbuild-kit/tsx/blob/develop/src/patch-repl.ts
/** @type {Parameters<typeof transform>[2]} */
const tsconfig = {
  minify: false,
  loader: 'tsx',
  format: 'esm',
  jsx: 'automatic',
  target: 'node16',
  platform: 'neutral',
  define: { require: 'global.require' },
  tsconfigRaw: { compilerOptions: { preserveValueImports: true } },
};

/**  @param {Parameters<import('repl').REPLEval>} */
export const esbuild = async (code, file) => {
  ({ code } = await transform(code, file, tsconfig).catch(() => ({ code })));
  return code;
};

/**
 * @param {string} code
 * @param {import('repl').ReplOptions['extensions']} opts
 */
// prettier-ignore
export const shouldSkipParsing = (code, opts) => (
  !/\b(let|const|import|require)\b/.test(code) || // naive check
  !Object.values(opts).some((enabled) => enabled)
);

/**
 * @param {string} moduleName
 * @param {object} props
 */
export const getImportDeclaration = (moduleName, props, cdn = true) => {
  let resolved = global.rtepl_cdn_imports?.get(moduleName);
  if (resolved) {
    if (global[resolved]) return resolvedImportDeclaration(resolved, props);
    else global.rtepl_cdn_imports.delete(moduleName);
  }

  resolved = resolveModule(moduleName, cdn);
  return dynamicImportDeclaration(resolved, props);
};

/**
 * @param {{
 *   name?: string,
 *   properties?: ReturnType<typeof initProp>[],
 *   assignment: import('meriyah').ESTree.LogicalExpression,
 * }} acc
 *
 * @param {import('meriyah').ESTree.ImportClause}
 */
// prettier-ignore
export const staticImportReducer = (acc, { type, local, imported }) => ({
  ImportSpecifier() {
    acc['properties'] ??= [];
    acc.properties.push(initProp(imported.name, local.name));
    return acc;
  },
  ImportDefaultSpecifier() {
    acc['name'] = local.name;
    return acc;
  },
  ImportNamespaceSpecifier() {
    if (acc['name']) {
      // move global assignment of already used default import
      // to destructured property import, i.e. `({ default: name } = ...)`
      acc['properties'] ??= [];
      acc.properties.push(initProp('default', acc.name));
    }

    // replace the name and value to be assigned
    // from the default import to the namespace import
    acc['name'] = local.name;
    return acc;
  },
}[type]?.());

/**
 * @param {string} moduleName
 * @param {boolean} cdn
 */
const resolveModule = (moduleName, cdn) => {
  if (
    !cdn || // option disabled by user
    isBuiltin(moduleName) || // node.js builtins
    moduleName.startsWith('.') || // relative imports
    moduleName.startsWith('https:') // network imports
  ) {
    return moduleName;
  }

  let resolved = `https://cdn.jsdelivr.net/npm/${moduleName}/+esm`;
  try {
    const require = createRequire(`${process.cwd()}/index.js`);
    if (require.resolve(moduleName)) resolved = moduleName;
  } catch (_) {}

  if (resolved !== moduleName) {
    global['rtepl_cdn_imports'] ??= new Map();
    global.rtepl_cdn_imports.set(moduleName, resolved);
    clog`{dim.italic.green automatically resolving "${moduleName}" using network import...}`;
  }

  return resolved;
};
