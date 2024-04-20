import { isUnresolvableImport } from './util.js';

/**
 * subtree for `({ prop: alias })`.
 * @param {string} prop
 * @param {string} alias
 * @returns {import('meriyah').ESTree.Property}
 */
export const initProp = (prop, alias) => ({
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
export const initImportDeclaration = ({ name, id, cdn = true }) => {
  const { properties = [] } = id;
  const value = properties[0]?.key?.name;
  const declarator = { type: 'VariableDeclarator', id: { type: 'ObjectPattern', properties } };
  const ret = { kind: 'var', type: 'VariableDeclaration', declarations: [declarator] };
  const remote = isUnresolvableImport(name, cdn);
  const source = remote ? `https://cdn.jsdelivr.net/npm/${name}/+esm` : name;

  // already resolved from previous network import
  if (remote && source in global) {
    declarator.init = {
      type: 'CallExpression',
      callee: { type: 'Identifier', name: '$resolve_global_module' },
      arguments: [
        { type: 'Literal', value: source },
        { type: 'Literal', value: id.name },
        { type: 'Literal', value },
      ],
    };

    return ret;
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
        operator: '??',
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

  return ret;
};
