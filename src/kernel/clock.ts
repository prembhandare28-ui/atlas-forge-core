import type { KernelClock } from "./types";

/** Default wall-clock implementation. Swappable in tests. */
export const systemClock: KernelClock = {
  now: () => Date.now(),
};
