import chalk from 'chalk';

const prefixStr = chalk.dim('[SERVER]');
const errorPrefixStr = chalk.red('[SERVER-ERROR]');
const debugPrefixStr = chalk.dim('[SERVER-DEBUG]');

// biome-ignore lint/suspicious/noExplicitAny: any is derived from console.log
export type LoggerType = (...data: any[]) => void;

const stringifyAny = (data: unknown[]) =>
  data.map((i) =>
    typeof i === 'object' ? JSON.stringify(i, null, 2) : String(i)
  );

export const prettyLog: LoggerType = (...data) =>
  console.log(`${prefixStr} ${stringifyAny(data).join(' ')}`);

export const errorLog: LoggerType = (...data) =>
  console.error(`${errorPrefixStr} ${stringifyAny(data).join(' ')}`);

export const customLog: LoggerType = (prefix: string, ...data) =>
  console.log(`${prefix} ${stringifyAny(data).join(' ')}`);

export const debugLog: LoggerType = (...data) => {
  if (process.env.DEBUG) {
    return console.log(`${debugPrefixStr} ${stringifyAny(data).join(' ')}`);
  }
};
