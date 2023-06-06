import { v4 as uuid } from 'uuid';

/**
 * subtree for `({ prop: alias })`
 * where `prop` & `alias` are `key.name` & `value.name` respectively
 * @param {import('meriyah').ESTree.Identifier} key
 * @param {import('meriyah').ESTree.Identifier} value
 */
export const initProp = (key, value) => ({
  key,
  value,
  type: 'Property',
  kind: 'init',
  method: false,
  computed: false,
  shorthand: key.name === value.name,
});

/**
 * subtree for `res?.default || res`
 */
export const resolvedChain = Object.freeze({
  type: 'LogicalExpression',
  left: {
    type: 'ChainExpression',
    expression: {
      type: 'MemberExpression',
      object: { type: 'Identifier', name: 'res' },
      property: { type: 'Identifier', name: 'default' },
      optional: true,
      computed: false,
    },
  },
  operator: '||',
  right: { type: 'Identifier', name: 'res' },
});

/**
 * custom dynamic import subtree
 */
export const dynamicImport = (value, { name, assignment, properties } = {}) => ({
  type: 'VariableDeclaration',
  kind: 'var',
  declarations: [
    {
      type: 'VariableDeclarator',
      id: properties ? { type: 'ObjectPattern', properties } : { type: 'Identifier', name },
      init: {
        type: 'AwaitExpression',
        argument: {
          type: 'CallExpression',
          callee: {
            type: 'MemberExpression',
            computed: false,
            object: { type: 'ImportExpression', source: { type: 'Literal', value } },
            property: { type: 'Identifier', name: 'then' },
          },
          arguments: [
            {
              async: false,
              expression: true,
              type: 'ArrowFunctionExpression',
              params: [{ type: 'Identifier', name: 'res' }],
              body: {
                type: 'AssignmentExpression',
                left: {
                  computed: true,
                  type: 'MemberExpression',
                  object: { type: 'Identifier', name: 'globalThis' },
                  property: { type: 'Literal', value: name || uuid() },
                },
                operator: '=',
                right: assignment || resolvedChain,
              },
            },
          ],
        },
      },
    },
  ],
});
