import { isUnresolvableImport } from './util.js';
import { reduce } from '../util.js';

const { assign } = Object;

/** @satisfies {import('acorn-walk').SimpleVisitors<{}>} */
export const nodeDispatch = /** @type {const} */ ({
  ExpressionStatement(node) {
    const { expression, ...rest } = node;
    const { type, tag: object = {} } = expression ?? {};
    if (`${object.name}${object.type}${type}` !== '$IdentifierTaggedTemplateExpression') return;
    const property = { type: 'Identifier', name: 'run' };
    const tag = { type: 'MemberExpression', object, property };
    return assign(node, { ...rest, expression: { ...expression, type, tag } });
  },
  VariableDeclaration(node) {
    node.kind = 'var';
    if (!node.declarations?.length) return;
    const [{ id, init }] = node.declarations;
    const { type, source } = { ...init?.argument, ...init?.argument?.callee?.object };
    // dynamic import -> resolved dynamic import
    if (type === 'ImportExpression') {
      const { value: name } = source;
      return assign(node, initImportDeclaration({ name, id }));
    }

    const { name, expressions } = init?.callee ?? {};
    const { object, property } = expressions?.[1] ?? {};
    const transpiledName = [object?.name, property?.name].join('.');
    // common.js require -> resolved dynamic import
    if (name === 'require' || transpiledName === 'global.require') {
      const [{ value: name }] = init.arguments;
      return assign(node, initImportDeclaration({ name, id }));
    }
  },
  ImportDeclaration(node) {
    const { specifiers, source: { value: name } } = node;
    const id = reduce(specifiers, { type: 'Identifier' }, (acc, { type, local, imported }) => {
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
    });

    return assign(node, initImportDeclaration({ name, id }));
  },
});

/**
 * subtree for `({ prop: alias })`
 * @param {string} prop
 * @param {string} alias
 * @returns {import('meriyah').ESTree.Property}
 */
const initProp = (prop, alias) => ({
  type: 'Property',
  kind: 'init',
  method: false,
  computed: false,
  shorthand: prop === alias,
  key: { type: 'Identifier', name: prop },
  value: { type: 'Identifier', name: alias },
});

/**
 * subtree for assigning resolved imports in the `repl` context
 * @param {{
 *   name: string;
 *   id: import('meriyah').ESTree.ObjectPattern;
 *   cdn?: boolean;
 * }}
 *
 * @returns {import('meriyah').ESTree.VariableDeclaration}
 */
const initImportDeclaration = ({ name, id }) => {
  const { properties = [] } = id;
  const value = properties[0]?.key?.name;
  const declarator = { type: 'VariableDeclarator', id: { type: 'ObjectPattern', properties } };
  const ast = { kind: 'var', type: 'VariableDeclaration', declarations: [declarator] };
  const remote = isUnresolvableImport(name);
  const source = remote ? `https://cdn.jsdelivr.net/npm/${name}/+esm` : name;

  // already resolved from previous network import
  if (remote && source in global) {
    declarator.init = {
      type: 'CallExpression',
      callee: { type: 'Identifier', name: 'resolve_dynamic_module' },
      arguments: [
        { type: 'Literal', value: source },
        { type: 'Literal', value: id.name },
        { type: 'Literal', value },
      ],
    };

    return ast;
  }

  const body = [
    {
      type: 'ExpressionStatement',
      expression: {
        type: 'AssignmentExpression',
        left: {
          type: 'MemberExpression',
          object: { type: 'Identifier', name: 'global' },
          property: { type: 'Literal', value: source },
          computed: true,
        },
        operator: '=',
        right: { type: 'Identifier', name: 'res' },
      },
    },
  ];

  id.name && body.push({
    type: 'ExpressionStatement',
    expression: {
      type: 'AssignmentExpression',
      left: {
        type: 'MemberExpression',
        object: { type: 'Identifier', name: 'global' },
        property: { type: 'Literal', value: id.name },
        computed: true,
      },
      operator: '=',
      right: {
        type: 'LogicalExpression',
        left: {
          type: 'MemberExpression',
          object: { type: 'Identifier', name: 'res' },
          property: { type: 'Identifier', name: 'default' },
        },
        operator: '||',
        right: { type: 'Identifier', name: 'res' },
      },
    },
  });

  value && body.push({
    type: 'ExpressionStatement',
    expression: {
      type: 'LogicalExpression',
      left: {
        type: 'BinaryExpression',
        left: { type: 'Literal', value },
        operator: 'in',
        right: { type: 'Identifier', name: 'res' },
      },
      operator: '||',
      right: {
        type: 'AssignmentExpression',
        left: { type: 'Identifier', name: 'res' },
        operator: '=',
        right: {
          type: 'MemberExpression',
          object: { type: 'Identifier', name: 'res' },
          property: { type: 'Identifier', name: 'default' },
        },
      },
    },
  });

  body.push({
    type: 'ReturnStatement',
    argument: { type: 'Identifier', name: 'res' },
  });

  declarator.init = {
    type: 'AwaitExpression',
    argument: {
      type: 'CallExpression',
      callee: {
        type: 'MemberExpression',
        object: { type: 'ImportExpression', source: { type: 'Literal', value: source } },
        property: { type: 'Identifier', name: 'then' },
      },
      arguments: [
        {
          type: 'ArrowFunctionExpression',
          body: { type: 'BlockStatement', body },
          params: [{ type: 'Identifier', name: 'res' }],
        },
      ],
    },
  };

  return ast;
};
