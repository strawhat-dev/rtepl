import { parse } from 'meriyah';
import { generate } from 'astring';
import { esbuild, shouldSkipParsing } from './util.js';
import { initImportDeclaration, initProp } from './abstract-syntax-tree.js';

const { assign } = Object;

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
export const transpileREPL = async (args, extensions) => {
  const { typescript, ...opts } = { ...extensions };
  if (typescript) args[0] = await esbuild(args[0], args[2]);
  if (shouldSkipParsing(args[0], opts)) return args;
  try {
    const ast = parse(args[0], parserOptions);
    for (let i = 0; i < ast.body?.length; ++i) {
      const statement = ast.body[i];
      const transformStatement = statementDispatch[statement?.type];
      transformStatement && (ast.body[i] = transformStatement(statement, opts));
    }

    args[0] = generate(ast);
  } catch (_) {}

  return args;
};

const statementDispatch = /** @type {const} */ ({
  /** @param {import('meriyah').ESTree.ExpressionStatement} statement */
  ExpressionStatement(statement) {
    const { type, tag } = statement.expression;
    if (!(type === 'TaggedTemplateExpression' && tag?.name === '$')) return statement;
    const argument = { type: 'AwaitExpression', argument: statement.expression };
    const expression = { type: 'UnaryExpression', operator: 'void', prefix: true, argument };
    return assign(statement, { expression });
  },
  /** @param {import('meriyah').ESTree.VariableDeclaration} declaration */
  VariableDeclaration(declaration, { cdn, redeclarations }) {
    if (redeclarations) declaration.kind = 'var';
    if (!cdn || !declaration.declarations?.length) return declaration;
    const [{ id, init }] = declaration.declarations;
    const { type, source } = { ...init?.argument, ...init?.argument?.callee?.object };
    // dynamic import -> resolved dynamic import
    if (type === 'ImportExpression') {
      const { value: name } = source;
      return initImportDeclaration({ name, id });
    }

    const { name, expressions } = init?.callee ?? {};
    const { object, property } = expressions?.[1] ?? {};
    const transpiledName = `${object?.name}.${property?.name}`;
    // common.js require -> resolved dynamic import
    if (name === 'require' || transpiledName === 'global.require') {
      const [{ value: name }] = init.arguments;
      return initImportDeclaration({ name, id });
    }

    return declaration;
  },
  /** @param {import('meriyah').ESTree.ImportDeclaration} declaration */
  ImportDeclaration(declaration, { cdn, staticImports }) {
    if (!staticImports) return declaration;
    const { specifiers, source: { value: name } } = declaration;
    const id = specifiers.reduce((acc, { type, local, imported }) => {
      if (type === 'ImportDefaultSpecifier') acc.name = local.name;
      else if (type === 'ImportSpecifier') {
        acc.type = 'ObjectPattern';
        acc.properties ??= [];
        acc.properties.push(initProp(imported.name, local.name));
      } else if (type === 'ImportNamespaceSpecifier') {
        if (acc.name) {
          // move global assignment of already used default import
          // to destructured property import, i.e. `({ default: name } = ...)`
          acc.type = 'ObjectPattern';
          acc.properties ??= [];
          acc.properties.push(initProp('default', acc.name));
        }

        // replace the name and value to be assigned
        // from the default import to the namespace import
        acc.name = local.name;
      }

      return acc;
    }, { type: 'Identifier' });

    return initImportDeclaration({ name, id, cdn });
  },
});
