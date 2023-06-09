/**
 * subtree for `({ prop: alias })`
 * @param {string} prop
 * @param {string} alias
 * @returns {Property}
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
 * subtree for declaration with resolved assignment from `global` namespace
 * @param {string} globalName
 * @param {{ properties?: Property[], name?: Identifier }}
 * @returns {VariableDeclaration}
 */
export const resolvedImportDeclaration = (globalName, { name, properties } = {}) => ({
  type: 'VariableDeclaration',
  kind: 'var',
  declarations: [
    {
      id: properties ? { type: 'ObjectPattern', properties } : { type: 'Identifier', name },
      type: 'VariableDeclarator',
      init: {
        type: 'MemberExpression',
        object: { type: 'Identifier', name: 'global' },
        property: { type: 'Literal', value: globalName },
        computed: true,
      },
    },
  ],
});

/**
 * custom dynamic import subtree
 * @param {string} moduleName
 * @param {{ properties?: Property[], name?: Identifier }}
 * @returns {VariableDeclaration}
 */
export const dynamicImportDeclaration = (moduleName, { name, properties } = {}) => {
  const body = [];
  const returnStatement = { type: 'ReturnStatement', argument: globalAssignExpression(moduleName) };
  const id = properties ? { type: 'ObjectPattern', properties } : { type: 'Identifier', name };
  if (id.type === 'ObjectPattern') {
    const hasExplicitDefaultProp = properties.some(({ key }) => key?.name === 'default');
    if (name || hasExplicitDefaultProp) {
      body.push({ type: 'ExpressionStatement', expression: globalAssignExpression(moduleName) });
      let assignment = { ...returnStatement.argument, right: resolvedChainExpression.right };
      if (name) returnStatement.argument.left.property.value = name;
      else assignment = resolvedChainExpression.right;
      hasExplicitDefaultProp && (returnStatement.argument = assignment);
    }
  }

  body.push(returnStatement);

  return {
    type: 'VariableDeclaration',
    kind: 'var',
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
              object: { type: 'ImportExpression', source: { type: 'Literal', value: moduleName } },
              property: { type: 'Identifier', name: 'then' },
              computed: false,
            },
            arguments: [
              {
                type: 'ArrowFunctionExpression',
                params: [{ type: 'Identifier', name: 'res' }],
                body: { type: 'BlockStatement', body },
                expression: true,
                async: false,
              },
            ],
          },
        },
      },
    ],
  };
};

/** @param {string} value */
const globalAssignExpression = (globalName) => ({
  type: 'AssignmentExpression',
  left: {
    type: 'MemberExpression',
    object: { type: 'Identifier', name: 'global' },
    property: { type: 'Literal', value: globalName },
    computed: true,
  },
  operator: '=',
  right: resolvedChainExpression,
});

/** subtree for `res?.default || res` */
const resolvedChainExpression = Object.freeze(
  /** @type {const} */ ({
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
  })
);

// type defs
/**
 * @typedef {import('meriyah').ESTree.Property} Property
 * @typedef {import('meriyah').ESTree.Identifier} Identifier
 * @typedef {import('meriyah').ESTree.VariableDeclaration} VariableDeclaration
 */
