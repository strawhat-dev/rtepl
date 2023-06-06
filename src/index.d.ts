import type repl from 'node:repl';
import type { ColorName, ModifierName } from 'chalk';

declare module 'repl' {
  interface ReplOptions extends repl.ReplOptions {
    theme?: Theme;
    sheet?: Partial<SheetConfig>;
    extensions?: {
      cdn?: boolean;
      typescript?: boolean;
      staticImports?: boolean;
      redeclarations?: boolean;
    };
  }
}

export default typeof repl;
export declare const start: typeof repl.start;
export declare const writer: typeof repl.writer;
export declare const REPLServer: typeof repl.REPLServer;
export declare const REPL_MODE_SLOPPY: typeof repl.REPL_MODE_SLOPPY;
export declare const REPL_MODE_STRICT: typeof repl.REPL_MODE_STRICT;

// https://github.com/highlightjs/highlight.js/blob/main/docs/css-classes-reference.rst
export type Style = ColorName | ModifierName | `#${string}`;
export type SheetConfig = {
  [className: string]: Style | Style[];

  /**
   * fallback value
   */
  default: Style | Style[];

  /**
   * keyword in a regular Algol-style language
   */
  keyword: Style | Style[];

  /**
   * built-in or library object (constant, class, function)
   */
  built_in: Style | Style[];

  /**
   * data type (in a language with syntactically significant types) (`string`, `int`, `array`, etc.)
   */
  type: Style | Style[];

  /**
   * special identifier for a built-in value (`true`, `false`, `null`, etc.)
   */
  literal: Style | Style[];

  /**
   * number, including units and modifiers, if any.
   */
  number: Style | Style[];

  /**
   * operators: `+`, `-`, `>>`, `|`, `==`
   */
  operator: Style | Style[];

  /**
   * aux. punctuation that should be subtly highlighted (parentheses, brackets, etc.)
   */
  punctuation: Style | Style[];

  /**
   * object property `obj.prop1.prop2.value`
   */
  property: Style | Style[];

  /**
   * literal regular expression
   */
  regexp: Style | Style[];

  /**
   * literal string, character
   */
  string: Style | Style[];

  /**
   * an escape character such as `\n`
   */
  'char.escape': Style | Style[];

  /**
   * parsed section inside a literal string
   */
  subst: Style | Style[];

  /**
   * symbolic constant, interned string, goto label
   */
  symbol: Style | Style[];

  /**
   * **deprecated** You probably want `title.class`
   */
  class: Style | Style[];

  /**
   * **deprecated** You probably want `title.function`
   */
  function: Style | Style[];

  /**
   * variables
   */
  variable: Style | Style[];

  /**
   * variable with special meaning in a language, e.g.: `this`, `window`, `super`, `self`, etc.
   */
  'variable.language': Style | Style[];

  /**
   * variable that is a constant value, ie `MAX_FILES`
   */
  'variable.constant': Style | Style[];

  /**
   * name of a class or a function
   */
  title: Style | Style[];

  /**
   * name of a class (interface, trait, module, etc)
   */
  'title.class': Style | Style[];

  /**
   * name of class being inherited from, extended, etc.
   */
  'title.class.inherited': Style | Style[];

  /**
   * name of a function
   */
  'title.function': Style | Style[];

  /**
   * name of a function (when being invoked)
   */
  'title.function.invoke': Style | Style[];

  /**
   * block of function arguments (parameters) at the place of declaration
   */
  params: Style | Style[];

  /**
   * comments
   */
  comment: Style | Style[];

  /**
   * documentation markup within comments, e.g. `@params`
   */
  doctag: Style | Style[];

  /**
   * flags, modifiers, annotations, processing instructions, preprocessor directives, etc
   */
  meta: Style | Style[];

  /**
   * REPL or shell prompts or similar
   */
  'meta.prompt': Style | Style[];

  /**
   * a keyword inside a meta block (note this is nested, not subscoped)
   */
  'meta keyword': Style | Style[];

  /**
   * a string inside a meta block (note this is nested, not subscoped)
   */
  'meta string': Style | Style[];

  /**
   * heading of a section in a config file, heading in text markup
   */
  section: Style | Style[];

  /**
   * XML/HTML tag
   */
  tag: Style | Style[];

  /**
   * name of an XML tag, the first word in an s-expression
   */
  name: Style | Style[];

  /**
   * name of an attribute with no language defined semantics (keys in JSON, setting names in .ini), also sub-attribute within another highlighted object, like XML tag
   */
  attr: Style | Style[];

  /**
   * name of an attribute followed by a structured value part, like CSS properties
   */
  attribute: Style | Style[];

  /**
   * list item bullet
   */
  bullet: Style | Style[];

  /**
   * code block
   */
  code: Style | Style[];

  /**
   * emphasis
   */
  emphasis: Style | Style[];

  /**
   * strong emphasis
   */
  strong: Style | Style[];

  /**
   * mathematical formula
   */
  formula: Style | Style[];

  /**
   * hyperlink
   */
  link: Style | Style[];

  /**
   * quotation or blockquote
   */
  quote: Style | Style[];

  /**
   * tag selector
   */
  'selector-tag': Style | Style[];

  /**
   * #id selector
   */
  'selector-id': Style | Style[];

  /**
   * .class selector
   */
  'selector-class': Style | Style[];

  /**
   * [attr] selector
   */
  'selector-attr': Style | Style[];

  /**
   * :pseudo selector
   */
  'selector-pseudo': Style | Style[];

  /**
   * tag of a template language
   */
  'template-tag': Style | Style[];

  /**
   * variable in a template language
   */
  'template-variable': Style | Style[];

  /**
   * added or changed line
   */
  addition: Style | Style[];

  /**
   * deleted line
   */
  deletion: Style | Style[];
};

type Theme =
  | 'a11y-dark'
  | 'a11y-light'
  | 'agate'
  | 'an-old-hope'
  | 'androidstudio'
  | 'arduino-light'
  | 'arta'
  | 'ascetic'
  | 'atom-one-dark-reasonable'
  | 'atom-one-dark'
  | 'atom-one-light'
  | 'brown-paper'
  | 'codepen-embed'
  | 'color-brewer'
  | 'dark'
  | 'default'
  | 'devibeans'
  | 'docco'
  | 'far'
  | 'felipec'
  | 'foundation'
  | 'github-dark-dimmed'
  | 'github-dark'
  | 'github'
  | 'gml'
  | 'googlecode'
  | 'gradient-dark'
  | 'gradient-light'
  | 'grayscale'
  | 'hybrid'
  | 'idea'
  | 'intellij-light'
  | 'ir-black'
  | 'isbl-editor-dark'
  | 'isbl-editor-light'
  | 'kimbie-dark'
  | 'kimbie-light'
  | 'lightfair'
  | 'lioshi'
  | 'magula'
  | 'mono-blue'
  | 'monokai-sublime'
  | 'monokai'
  | 'night-owl'
  | 'nnfx-dark'
  | 'nnfx-light'
  | 'nord'
  | 'obsidian'
  | 'panda-syntax-dark'
  | 'panda-syntax-light'
  | 'paraiso-dark'
  | 'paraiso-light'
  | 'pojoaque'
  | 'purebasic'
  | 'qtcreator-dark'
  | 'qtcreator-light'
  | 'rainbow'
  | 'routeros'
  | 'school-book'
  | 'shades-of-purple'
  | 'srcery'
  | 'stackoverflow-dark'
  | 'stackoverflow-light'
  | 'sunburst'
  | 'tokyo-night-dark'
  | 'tokyo-night-light'
  | 'tomorrow-night-blue'
  | 'tomorrow-night-bright'
  | 'vs'
  | 'vs2015'
  | 'xcode'
  | 'xt256';
