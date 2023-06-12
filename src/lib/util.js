import os from 'node:os';
import chalk from 'chalk';

/**
 * @template {object} T
 * @template {Record<string, any>} Props
 * @param {T} target
 * @param {Readonly<Props>} props
 * @returns {T & Props}
 */
export const extend = (target, props) => {
  props ?? ([target, props] = [{}, target]);
  for (const [prop, value] of Object.entries(props)) {
    Object.defineProperty(target, prop, { value });
  }

  return target;
};

/** @internal */
export const displayEnvironmentInfo = () => {
  let osInfo = os.version();

  // os.version() on macOS too verbose
  if (process.platform === 'darwin') {
    osInfo = `${process.platform} v${os.release()}`;
  }

  // prettier-ignore
  console.log(chalk.green(`
  node ${process.version}
  ${osInfo} ${os.machine()}
  ${os.cpus().pop().model}
`));
};
