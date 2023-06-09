import { parse } from 'meriyah';
import { generate } from 'astring';
import { esbuild, getImportDeclaration, shouldSkipParsing, staticImportReducer } from './util.js';

/** @type {import('meriyah').Options} */
const parserOptions = {
  jsx: true,
  next: true,
  module: true,
  specDeviation: true,
};

/**
 * @param {Parameters<import('repl').REPLEval>} args
 * @param {import('repl').ReplOptions['extensions']} extensions
 */
export const transpile = async (args, extensions) => {
  const { typescript, ...opts } = { ...extensions };
  if (typescript) args[0] = await esbuild(args[0], args[2]);
  if (shouldSkipParsing(args[0], opts)) return args;
  try {
    const ast = parse(args[0], parserOptions);
    const body = ast.body;
    for (let i = 0; i < body.length; ++i) {
      const statement = body[i];
      const transformStatement = statementDispatch[statement?.type];
      transformStatement && (body[i] = transformStatement(statement, opts));
    }

    args[0] = generate(ast);
  } catch (_) {}

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
    const subtreeProps = specifiers?.reduce(staticImportReducer, {});
    return getImportDeclaration(source?.value, subtreeProps, cdn);
  },
  VariableDeclaration(statement, { cdn, redeclarations }) {
    const [declaration] = statement['declarations'] || [];
    if (redeclarations) statement['kind'] = 'var';
    if (!cdn || !declaration) return statement;
    const { id, init } = declaration;
    const { name, expressions } = init?.callee ?? {};
    let { object, property } = expressions?.[1] ?? {};
    const transpiledName = `${object?.name}.${property?.name}`;
    if (name === 'require' || transpiledName === 'global.require') {
      // common.js require -> resolved dynamic import
      const [{ value }] = init.arguments;
      return getImportDeclaration(value, id);
    }

    const { argument } = init ?? {};
    ({ object } = argument?.callee ?? {});
    if ([argument?.type, object?.type].some((t) => t === 'ImportExpression')) {
      // dynamic import -> resolved dynamic import
      const { value } = { ...argument?.source, ...object?.source };
      return getImportDeclaration(value, id);
    }

    return statement;
  },
};
