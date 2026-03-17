type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

const COLORS: Record<LogLevel, string> = {
  DEBUG: "\x1b[90m",
  INFO: "\x1b[36m",
  WARN: "\x1b[33m",
  ERROR: "\x1b[31m",
};
const RESET = "\x1b[0m";

function fmt(level: LogLevel, module: string, step: string, detail?: string) {
  const ts = new Date().toISOString().slice(11, 23);
  const color = COLORS[level];
  const msg = detail ? `${step} — ${detail}` : step;
  return `${color}[${ts}] [${level}] [${module}]${RESET} ${msg}`;
}

export function createLogger(module: string) {
  return {
    debug(step: string, detail?: string) {
      console.log(fmt("DEBUG", module, step, detail));
    },
    info(step: string, detail?: string) {
      console.log(fmt("INFO", module, step, detail));
    },
    warn(step: string, detail?: string) {
      console.warn(fmt("WARN", module, step, detail));
    },
    error(step: string, error?: unknown) {
      const detail = error instanceof Error
        ? `${error.message}\n${error.stack}`
        : String(error ?? "");
      console.error(fmt("ERROR", module, step, detail));
    },
    timed<T>(step: string, fn: () => T | Promise<T>): Promise<T> {
      const t0 = performance.now();
      const result = fn();
      if (result instanceof Promise) {
        return result.then((val) => {
          const ms = Math.round(performance.now() - t0);
          console.log(fmt("INFO", module, step, `completed in ${ms}ms`));
          return val;
        }).catch((err) => {
          const ms = Math.round(performance.now() - t0);
          console.error(fmt("ERROR", module, step, `failed after ${ms}ms`));
          throw err;
        });
      }
      const ms = Math.round(performance.now() - t0);
      console.log(fmt("INFO", module, step, `completed in ${ms}ms`));
      return Promise.resolve(result);
    },
  };
}
