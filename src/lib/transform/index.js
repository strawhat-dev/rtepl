/* eslint-disable no-empty */
import { parse } from 'meriyah';
import { generate } from 'astring';
import { esbuild, resolveModule, staticImportReducer } from './util.js';
import { dynamicImport, resolvedChain } from './abstract-syntax-tree.js';

/**
 * @param {Parameters<import('repl').REPLEval>} args
 * @param {import('repl').ReplOptions['extensions']} extensions
 */
export const transpile = async (args, extensions) => {
  const { typescript, ...opts } = { ...extensions };
  typescript && (args[0] = await esbuild(args[0], args[2]));
  if (!Object.values(opts).some((enabled) => enabled)) return args;
  try {
    const ast = parse(args[0], { module: true, next: true });
    const { body } = ast;
    for (let i = 0; i < body.length; ++i) {
      const statement = body[i];
      const handleStatement = statementDispatch[statement?.type];
      handleStatement && (body[i] = handleStatement(statement, opts));
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

    return dynamicImport(resolveModule(source.value, { cdn }), { name, assignment, properties });
  },
  VariableDeclaration(statement, { cdn, redeclarations }) {
    if (redeclarations) statement['kind'] = 'var';
    const [declaration] = statement['declarations'] || [];
    if (!cdn || !declaration) return statement;

    // common.js require => resolved dynamic import
    const { object, property } = declaration.init?.callee?.expressions?.[1] || {};
    if (`${object?.name}.${property?.name}` === 'global.require') {
      const { name, properties } = declaration.id || {};
      const { value } = declaration.init.arguments?.[0] || {};
      if (value) return dynamicImport(resolveModule(value), { name, properties });
    }

    // dynamic import => resolved dynamic import
    const { callee } = declaration.init?.argument || {};
    if (callee?.object?.type === 'ImportExpression') {
      const { value } = callee.object.source || {};
      value && (callee.object.source['value'] = resolveModule(value));
    }

    return statement;
  },
};
