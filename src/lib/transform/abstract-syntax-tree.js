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
 *   id: import('meriyah').ESTree.Identifier;
 *   cdn?: boolean;
 * }}
 *
 * @returns {import('meriyah').ESTree.VariableDeclaration}
 */
export const getImportDeclaration = ({ name, id, cdn = true }) => {
  let assignedName;
  let resolved = name;
  let body = {
    type: 'LogicalExpression',
    left: {
      type: 'ChainExpression',
      expression: getPropertyExpression({ name: 'res', prop: 'default' }),
    },
    operator: '||',
    right: { type: 'Identifier', name: 'res' },
  };

  if (id.name && id.properties) {
    // allow both destructured properties and default/namespaced imports to be assigned at once,
    // by returning the assignment to the global namespace, making the import readily available
    ({ name: assignedName, ...id } = id);
    body = {
      type: 'AssignmentExpression',
      left: getPropertyExpression({ prop: assignedName }),
      operator: '=',
      right: body,
    };
  }

  // prettier-ignore
  if (isUnresolvableImport(name, cdn)) {
    resolved = `https://cdn.jsdelivr.net/npm/${name}/+esm`;
    const init = getPropertyExpression({ prop: resolved });
    if (global[resolved]) { // already imported previously and available
      const declarator = { type: 'VariableDeclarator', id, init };
      assignedName && (declarator.init = {
        type: 'AssignmentExpression',
        left: { type: 'Identifier', name: assignedName },
        operator: '=',
        right: init,
      });

      // skip building dynamic import subtree and assign directly from global cache instead.
      return { type: 'VariableDeclaration', kind: 'var', declarations: [declarator] };
    }

    let argument = init;
    if (assignedName) { // handle default import usage with named/namespace import.
      const hasExplicitDefaultProp = id.properties.some(({ key }) => key?.name === 'default');
      const left = getPropertyExpression({ type: 'Literal', prop: assignedName });
      const right = hasExplicitDefaultProp ? { type: 'Identifier', name: 'res' } : argument;
      argument = { type: 'AssignmentExpression', left, operator: '=', right };
    }

    body = { type: 'BlockStatement', body: dynamicImportAssignmentBlock({ argument, left: init }) };
    $log`{dim.italic.green automatically attempting to resolve "${name}" from network-import...}`;
  }

  return {
    kind: 'var',
    type: 'VariableDeclaration',
    declarations: [
      {
        id,
        type: 'VariableDeclarator',
        init: {
          type: 'AwaitExpression',
          argument: {
            type: 'CallExpression',
            callee: {
              type: 'MemberExpression',
              object: dynamicImportExpression(resolved),
              property: { type: 'Identifier', name: 'then' },
            },
            arguments: [
              {
                type: 'ArrowFunctionExpression',
                params: [{ type: 'Identifier', name: 'res' }],
                body,
              },
            ],
          },
        },
      },
    ],
  };
};

/**
 * subtree for `import('name')`
 * @param {string} name
 * @returns {import('meriyah').ESTree.ImportExpression}
 */
const dynamicImportExpression = (name) => ({
  type: 'ImportExpression',
  source: { type: 'Literal', value: name },
});

/**
 * subtree for property access expression.
 * @returns {import('meriyah').ESTree.MemberExpression}
 */
const getPropertyExpression = ({
  prop,
  type = /^\w+$/.test(prop) ? 'Identifier' : 'Literal',
  computed = type === 'Literal',
  optional = type === 'Identifier',
  name = 'global',
} = {}) => ({
  type: 'MemberExpression',
  object: { type: 'Identifier', name },
  property: { type, [{ Identifier: 'name', Literal: 'value' }[type]]: prop },
  computed,
  optional,
});

/**
 * subtree for conditional assignment in dynamic import body.
 * @param {{ left: import('meriyah').ESTree.MemberExpressionargument: import('meriyah').ESTree.Expression }}
 * @returns {import('meriyah').ESTree.Statement[]}
 */
const dynamicImportAssignmentBlock = ({ left, argument }) => [
  {
    type: 'ExpressionStatement',
    expression: {
      type: 'AssignmentExpression',
      left,
      operator: '=',
      right: {
        type: 'LogicalExpression',
        left: {
          type: 'ChainExpression',
          expression: getPropertyExpression({ name: 'res', prop: 'default' }),
        },
        operator: '||',
        right: { type: 'Identifier', name: 'res' },
      },
    },
  },
  {
    type: 'ExpressionStatement',
    expression: {
      type: 'AssignmentExpression',
      left: {
        type: 'MemberExpression',
        object: {
          type: 'LogicalExpression',
          left,
          operator: '??',
          right: { type: 'ObjectExpression', properties: [] },
        },
        property: { type: 'Identifier', name: 'default' },
        computed: false,
      },
      operator: '??=',
      right: left,
    },
  },
  { type: 'ReturnStatement', argument },
];
