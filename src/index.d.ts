import type * as repl from 'node:repl';
import type * as rtepl from './lib/index.js';
import type { DefaultCommands } from './lib/config.js';
import type { AnsiColors, Ansis, AnsiStyles } from 'ansis';
import type { ExecaReturnValue, Options as ExecOptions, Result } from 'execa';

type REPL = typeof repl;

type BaseReplOptions = Except<repl.ReplOptions, 'preview' | 'prompt'>;

declare module 'repl' {
  interface ReplOptions extends BaseReplOptions {
    /**
     * Shell to use when running commands with `$` *(wrapped `execa` instance)* in the repl.
     * @defaultValue `'bash'`
     */
    shell?: boolean | string;
    /**
     * The name of the theme to use (provided by `hljs` stylesheets).
     * @defaultValue `'atom-one-dark'`
     * @see {@link https://github.com/highlightjs/highlight.js/tree/main/src/styles}
     */
    theme?: Theme;
    /**
     * A configuration object that maps `hljs` classes to a single or array of `chalk`
     * color/modifier names _(or hex values)_, used for more advanced customization of syntax styling.
     * - Can be used in conjunction with the `theme` option, which will be merged.
     */
    sheet?: SheetConfig;
    /**
     * Define commands to be handled with a custom callback when a matching command name *(i.e. first word)* is given.
     * - When `'*'` is specified, everything may be intercepted by the defined callback.
     * - Note: Differs from node's `repl.defineCommand` in that the `'.'` prefix is not needed.
     *
     * @example
     * repl.start({ commands: {
     *   ls: ({ $, argv }) => $`ls ${[...argv]}`,
     * }});
     */
    commands?: {
      [k in '*' | (string & {})]?: (cmd: {
        /** Execa command runner. */
        $: rtepl.$['run'];
        /** The current repl instance. */
        repl: rtepl.REPLServer;
        /** The full command-line string. */
        cmd: string;
        /** Parsed arguments passed to the command as a string. */
        args: string;
        /** Parsed arguments passed to the command as an array. */
        argv: string[];
        /** The default `repl.eval` callback (default arguments passed if none were given). */
        evaluate: repl.REPLEval;
        /** @see {@link https://www.npmjs.com/package/ansis} */
        ansi: Ansis;
      }, _: EvalArgs) => void;
    };
  }
}

export declare const start: rtepl.REPLStart;
export declare const writer: repl.REPLWriter;
export declare const REPLServer: rtepl.REPLServer;
export declare const REPL_MODE_SLOPPY: REPL['REPL_MODE_SLOPPY'];
export declare const REPL_MODE_STRICT: REPL['REPL_MODE_STRICT'];
export default { start, writer, REPLServer, REPL_MODE_SLOPPY, REPL_MODE_STRICT };

/**
 * Useful pre-defined custom commands.
 * @see {@link DefaultCommands}
 */
export declare const commands: ReadonlyRecord<
  '?' | 'cat' | 'cd' | 'clear' | 'exit' | 'ls' | 'which',
  VoidFn
>;

export type * from 'node:repl';

export type REPLServer = rtepl.REPLServer;

export type ReplOptions = BaseReplOptions;

/** @internal The rest of the arguments that were passed to `repl.eval` before the command was intercepted. */
export type REPLEvalParams = Parameters<repl.REPLEval> extends [any, ...infer rest] ? rest : never;

export type Style = AnsiColors | AnsiStyles | `#${string}`;

export type SheetConfig = {
  [classname: string]: Style | Style[] | undefined;

  /** Fallback value */
  default?: Style | Style[];

  /** Keyword in a regular Algol-style language */
  keyword?: Style | Style[];

  /** Built-in or library object (constant, class, function) */
  built_in?: Style | Style[];

  /** Data type (in a language with syntactically significant types) (`string`, `int`, `array`, etc.) */
  type?: Style | Style[];

  /** Special identifier for a built-in value (`true`, `false`, `null`, etc.) */
  literal?: Style | Style[];

  /** Number, including units and modifiers, if any. */
  number?: Style | Style[];

  /** Operators: `+`, `-`, `>>`, `|`, `==` */
  operator?: Style | Style[];

  /** Aux. punctuation that should be subtly highlighted (parentheses, brackets, etc.) */
  punctuation?: Style | Style[];

  /** Object property `obj.prop1.prop2.value` */
  property?: Style | Style[];

  /** Literal regular expression */
  regexp?: Style | Style[];

  /** Literal string, character */
  string?: Style | Style[];

  /** An escape character such as `\n` */
  'char.escape'?: Style | Style[];

  /** Parsed section inside a literal string */
  subst?: Style | Style[];

  /** Symbolic constant, interned string, goto label */
  symbol?: Style | Style[];

  /** **deprecated** You probably want `title.class` */
  class?: Style | Style[];

  /** **deprecated** You probably want `title.function` */
  function?: Style | Style[];

  /** Variables */
  variable?: Style | Style[];

  /** Variable with special meaning in a language, e.g.: `this`, `window`, `super`, `self`, etc. */
  'variable.language'?: Style | Style[];

  /** Variable that is a constant value, ie `MAX_FILES` */
  'variable.constant'?: Style | Style[];

  /** Name of a class or a function */
  title?: Style | Style[];

  /** Name of a class (interface, trait, module, etc) */
  'title.class'?: Style | Style[];

  /** Name of class being inherited from, extended, etc. */
  'title.class.inherited'?: Style | Style[];

  /** Name of a function */
  'title.function'?: Style | Style[];

  /** Name of a function (when being invoked) */
  'title.function.invoke'?: Style | Style[];

  /** Block of function arguments (parameters) at the place of declaration */
  params?: Style | Style[];

  /** Comments */
  comment?: Style | Style[];

  /** Documentation markup within comments, e.g. `@params` */
  doctag?: Style | Style[];

  /** Flags, modifiers, annotations, processing instructions, preprocessor directives, etc */
  meta?: Style | Style[];

  /** REPL or shell prompts or similar */
  'meta.prompt'?: Style | Style[];

  /** A keyword inside a meta block (note this is nested, not subscoped) */
  'meta keyword'?: Style | Style[];

  /** A string inside a meta block (note this is nested, not subscoped) */
  'meta string'?: Style | Style[];

  /** Heading of a section in a config file, heading in text markup */
  section?: Style | Style[];

  /** XML/HTML tag */
  tag?: Style | Style[];

  /** Name of an XML tag, the first word in an s-expression */
  name?: Style | Style[];

  /**
   * Name of an attribute with no language defined semantics (keys in JSON, setting names in .ini),
   * also sub-attribute within another highlighted object, like XML tag
   */
  attr?: Style | Style[];

  /** Name of an attribute followed by a structured value part, like CSS properties */
  attribute?: Style | Style[];

  /** List item bullet */
  bullet?: Style | Style[];

  /** Code block */
  code?: Style | Style[];

  /** Emphasis */
  emphasis?: Style | Style[];

  /** Strong emphasis */
  strong?: Style | Style[];

  /** Mathematical formula */
  formula?: Style | Style[];

  /** Hyperlink */
  link?: Style | Style[];

  /** Quotation or blockquote */
  quote?: Style | Style[];

  /** Tag selector */
  'selector-tag'?: Style | Style[];

  /** #id selector */
  'selector-id'?: Style | Style[];

  /** .class selector */
  'selector-class'?: Style | Style[];

  /** [attr] selector */
  'selector-attr'?: Style | Style[];

  /** :pseudo selector */
  'selector-pseudo'?: Style | Style[];

  /** Tag of a template language */
  'template-tag'?: Style | Style[];

  /** Variable in a template language */
  'template-variable'?: Style | Style[];

  /** Added or changed line */
  addition?: Style | Style[];

  /** Deleted line */
  deletion?: Style | Style[];
};

/** {@link https://github.com/highlightjs/highlight.js/tree/main/src/styles} */
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

// prettier-ignore
type IsEqual<A, B> = (<G>() => G extends A ? 1 : 2) extends (<G>() => G extends B ? 1 : 2) ? true : false;
type IsUnknown<T> = unknown extends T ? ([T] extends [null] ? false : true) : false;
type Filter<A, B> = IsEqual<A, B> extends true ? never : (A extends B ? never : A);
type Except<T, K extends keyof T> = { [k in keyof T as Filter<k, K>]: T[k] };
type ReadonlyRecord<K, V> = { readonly [key in K]: V } & {};
type VoidFn = (...args: any[]) => void;

// prettier-ignore
export type SetReturnType<Fn extends (...args: any[]) => any, Return> = (
  Fn extends (this: infer arg, ...args: infer args) => any ?
  (IsUnknown<arg> extends true ? (...args: args) => Return : (this: arg, ...args: args) => Return) :
  (...args: Parameters<Fn>) => Return
);
