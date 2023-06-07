import type repl from 'node:repl';
import type { ColorName, ModifierName } from 'chalk';

type REPL = typeof repl;
declare const rtepl: REPL;
declare module 'repl' {
  interface ReplOptions extends repl.ReplOptions {
    /**
     * The name of the theme to use (provided by `hljs` stylesheets).
     * @defaultValue `'atom-one-dark'`
     */
    theme?: Theme;
    /**
     * A configuration object that maps `hljs` classes
     * to a single or array of `chalk` color/modifier names *(or hex values)*,
     * for more advanced customization of syntax styling.
     * - Can be used in conjunction with the `theme` option, which will be merged.
     */
    sheet?: Partial<SheetConfig>;
    /**
     * Extensions that affect transpilation and transpiles commands that would normally be invalid
     * in a repl context to valid equivalents, allowing for flexibility and quickly testing code.
     * @defaultValue all options are `true` by default, unless a user defined `extensions` object is explicitly given
     */
    extensions?: {
      /**
       * Automatically use a cdn for all imports, unless:
       * - the imported module is a node builtin
       * - the module can be resolved from the current working directory
       */
      cdn?: boolean;
      /**
       * Similarily to the DevTools console, allow redeclaring `let` & `const`.
       * *(Converts all unscoped declarations to `var`)*
       */
      redeclarations?: boolean;
      /**
       * Allow for static import syntax,
       * which will be converted to dynamic imports if enabled.
       */
      staticImports?: boolean;
      /**
       * Enable transpiling typescript with esbuild.
       * - Note: Unlike `ts-node`'s repl, this does **not**
       *   perform any typechecking (similarly to `tsx`).
       */
      typescript?: boolean;
    };
  }
}

export default rtepl;
export declare const start: REPL['start'];
export declare const writer: REPL['writer'];
export declare const REPLServer: REPL['REPLServer'];
export declare const REPL_MODE_SLOPPY: REPL['REPL_MODE_SLOPPY'];
export declare const REPL_MODE_STRICT: REPL['REPL_MODE_STRICT'];

export type * from 'node:repl';
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

export type Theme =
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
  | 'xt256'
  | 'base16/3024'
  | 'base16/apathy'
  | 'base16/apprentice'
  | 'base16/ashes'
  | 'base16/atelier-cave-light'
  | 'base16/atelier-cave'
  | 'base16/atelier-dune-light'
  | 'base16/atelier-dune'
  | 'base16/atelier-estuary-light'
  | 'base16/atelier-estuary'
  | 'base16/atelier-forest-light'
  | 'base16/atelier-forest'
  | 'base16/atelier-heath-light'
  | 'base16/atelier-heath'
  | 'base16/atelier-lakeside-light'
  | 'base16/atelier-lakeside'
  | 'base16/atelier-plateau-light'
  | 'base16/atelier-plateau'
  | 'base16/atelier-savanna-light'
  | 'base16/atelier-savanna'
  | 'base16/atelier-seaside-light'
  | 'base16/atelier-seaside'
  | 'base16/atelier-sulphurpool-light'
  | 'base16/atelier-sulphurpool'
  | 'base16/atlas'
  | 'base16/bespin'
  | 'base16/black-metal-bathory'
  | 'base16/black-metal-burzum'
  | 'base16/black-metal-dark-funeral'
  | 'base16/black-metal-gorgoroth'
  | 'base16/black-metal-immortal'
  | 'base16/black-metal-khold'
  | 'base16/black-metal-marduk'
  | 'base16/black-metal-mayhem'
  | 'base16/black-metal-nile'
  | 'base16/black-metal-venom'
  | 'base16/black-metal'
  | 'base16/brewer'
  | 'base16/bright'
  | 'base16/brogrammer'
  | 'base16/brush-trees-dark'
  | 'base16/brush-trees'
  | 'base16/chalk'
  | 'base16/circus'
  | 'base16/classic-dark'
  | 'base16/classic-light'
  | 'base16/codeschool'
  | 'base16/colors'
  | 'base16/cupcake'
  | 'base16/cupertino'
  | 'base16/danqing'
  | 'base16/darcula'
  | 'base16/dark-violet'
  | 'base16/darkmoss'
  | 'base16/darktooth'
  | 'base16/decaf'
  | 'base16/default-dark'
  | 'base16/default-light'
  | 'base16/dirtysea'
  | 'base16/dracula'
  | 'base16/edge-dark'
  | 'base16/edge-light'
  | 'base16/eighties'
  | 'base16/embers'
  | 'base16/equilibrium-dark'
  | 'base16/equilibrium-gray-dark'
  | 'base16/equilibrium-gray-light'
  | 'base16/equilibrium-light'
  | 'base16/espresso'
  | 'base16/eva-dim'
  | 'base16/eva'
  | 'base16/flat'
  | 'base16/framer'
  | 'base16/fruit-soda'
  | 'base16/gigavolt'
  | 'base16/github'
  | 'base16/google-dark'
  | 'base16/google-light'
  | 'base16/grayscale-dark'
  | 'base16/grayscale-light'
  | 'base16/green-screen'
  | 'base16/gruvbox-dark-hard'
  | 'base16/gruvbox-dark-medium'
  | 'base16/gruvbox-dark-pale'
  | 'base16/gruvbox-dark-soft'
  | 'base16/gruvbox-light-hard'
  | 'base16/gruvbox-light-medium'
  | 'base16/gruvbox-light-soft'
  | 'base16/hardcore'
  | 'base16/harmonic16-dark'
  | 'base16/harmonic16-light'
  | 'base16/heetch-dark'
  | 'base16/heetch-light'
  | 'base16/helios'
  | 'base16/hopscotch'
  | 'base16/horizon-dark'
  | 'base16/horizon-light'
  | 'base16/humanoid-dark'
  | 'base16/humanoid-light'
  | 'base16/ia-dark'
  | 'base16/ia-light'
  | 'base16/icy-dark'
  | 'base16/ir-black'
  | 'base16/isotope'
  | 'base16/kimber'
  | 'base16/london-tube'
  | 'base16/macintosh'
  | 'base16/marrakesh'
  | 'base16/materia'
  | 'base16/material-darker'
  | 'base16/material-lighter'
  | 'base16/material-palenight'
  | 'base16/material-vivid'
  | 'base16/material'
  | 'base16/mellow-purple'
  | 'base16/mexico-light'
  | 'base16/mocha'
  | 'base16/monokai'
  | 'base16/nebula'
  | 'base16/nord'
  | 'base16/nova'
  | 'base16/ocean'
  | 'base16/oceanicnext'
  | 'base16/one-light'
  | 'base16/onedark'
  | 'base16/outrun-dark'
  | 'base16/papercolor-dark'
  | 'base16/papercolor-light'
  | 'base16/paraiso'
  | 'base16/pasque'
  | 'base16/phd'
  | 'base16/pico'
  | 'base16/pop'
  | 'base16/porple'
  | 'base16/qualia'
  | 'base16/railscasts'
  | 'base16/rebecca'
  | 'base16/ros-pine-dawn'
  | 'base16/ros-pine-moon'
  | 'base16/ros-pine'
  | 'base16/sagelight'
  | 'base16/sandcastle'
  | 'base16/seti-ui'
  | 'base16/shapeshifter'
  | 'base16/silk-dark'
  | 'base16/silk-light'
  | 'base16/snazzy'
  | 'base16/solar-flare-light'
  | 'base16/solar-flare'
  | 'base16/solarized-dark'
  | 'base16/solarized-light'
  | 'base16/spacemacs'
  | 'base16/summercamp'
  | 'base16/summerfruit-dark'
  | 'base16/summerfruit-light'
  | 'base16/synth-midnight-terminal-dark'
  | 'base16/synth-midnight-terminal-light'
  | 'base16/tango'
  | 'base16/tender'
  | 'base16/tomorrow-night'
  | 'base16/tomorrow'
  | 'base16/twilight'
  | 'base16/unikitty-dark'
  | 'base16/unikitty-light'
  | 'base16/vulcan'
  | 'base16/windows-10-light'
  | 'base16/windows-10'
  | 'base16/windows-95-light'
  | 'base16/windows-95'
  | 'base16/windows-high-contrast-light'
  | 'base16/windows-high-contrast'
  | 'base16/windows-nt-light'
  | 'base16/windows-nt'
  | 'base16/woodland'
  | 'base16/xcode-dusk'
  | 'base16/zenburn';
