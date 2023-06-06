/* eslint-disable no-empty */
import { parse } from 'meriyah';
import { generate } from 'astring';
import { esbuild, resolveModule, staticImportReducer } from './util.js';
import { dynamicImport, resolvedChain } from './abstract-syntax-tree.js';

/** @type {import('repl').ReplOptions['extensions']} */
const extensionDefaults = {
  cdn: true,
  typescript: true,
  staticImports: true,
  redeclarations: true,
};

/**
 * @param {Parameters<import('repl').REPLEval>} args
 * @param {import('repl').ReplOptions['extensions']} extensions
 */
export const transpile = async (args, extensions) => {
  const { typescript, ...opts } = { ...extensionDefaults, ...extensions };
  typescript && (args[0] = await esbuild(args));
  if (!Object.values(opts).some((enabled) => enabled)) return args;
  try {
    const ast = parse(args[0], { module: true, next: true });
    const { body } = ast;
    for (let i = 0; i < body.length; ++i) {
      const { type } = body[i];
      const handleStatement = statementDispatch[type];
      handleStatement && (body[i] = handleStatement(body[i], opts));
    }

    args[0] = generate(ast);
  } catch {}

  return args;
};

/**
 * @typedef {import('meriyah').ESTree.Statement} Statement
 * @typedef {import('meriyah').ESTree.ImportDeclaration} ImportDeclaration
 * @typedef {import('meriyah').ESTree.VariableDeclaration} VariableDeclaration
 * @typedef {import('repl').ReplOptions['extensions']} Opts
 * @type {{
 *   ImportDeclaration(statement: ImportDeclaration, opts: Opts): Statement
 *   VariableDeclaration(statement: VariableDeclaration, opts: Opts): Statement
 * }}
 */
const statementDispatch = {
  ImportDeclaration(statement, { cdn, staticImports }) {
    if (!staticImports) return statement;
    const { source, specifiers } = statement;
    const { name, assignment, properties } = specifiers.reduce(staticImportReducer, {
      name: undefined,
      assignment: resolvedChain,
      properties: [],
    });

    const { value } = source;
    const resolved = resolveModule(value, { cdn });
    return dynamicImport(resolved, { name, assignment, properties });
  },
  VariableDeclaration(statement, { cdn, redeclarations }) {
    if (redeclarations) statement.kind = 'var';
    if (!cdn) return statement;

    const [declaration] = statement.declarations;

    // common.js require => resolved dynamic import
    const expr = { ...declaration?.init?.callee?.expressions?.[1] };
    if (`${expr?.object?.name}.${expr?.property?.name}` === 'global.require') {
      const { name, properties } = declaration.id;
      const { value } = declaration.init.arguments[0];
      const resolved = resolveModule(value, { cdn });
      return dynamicImport(resolved, { name, properties });
    }

    // dynamic import => resolved dynamic import
    const { object } = declaration?.init?.argument?.callee ?? {};
    if (object?.type === 'ImportExpression') {
      const { value } = object.source;
      object.source.value = resolveModule(value, { cdn });
    }

    return statement;
  },
};
