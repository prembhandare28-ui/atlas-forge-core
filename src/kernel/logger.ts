import type { KernelLogLevel, KernelLogger, KernelMetadata } from "./types";

/** Discards all output — safe default for SSR and tests. */
export const silentLogger: KernelLogger = {
  log: () => undefined,
};

/** Minimal console logger, opt-in only. */
export function createConsoleLogger(prefix = "[atlas:kernel]"): KernelLogger {
  return {
    log(level: KernelLogLevel, message: string, metadata?: KernelMetadata) {
      const line = `${prefix} ${message}`;
      if (level === "error") console.error(line, metadata ?? "");
      else if (level === "warn") console.warn(line, metadata ?? "");
      else console.info(line, metadata ?? "");
    },
  };
}
