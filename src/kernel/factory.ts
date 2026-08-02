import { AtlasKernel, type KernelOptions } from "./kernel";
import { systemClock } from "./clock";
import type { KernelHealthReport, KernelTask } from "./types";

/** Composition helper: build a kernel with tasks pre-registered. */
export function createKernel(
  options: KernelOptions = {},
  tasks: readonly KernelTask[] = [],
): AtlasKernel {
  const kernel = new AtlasKernel(options);
  for (const task of tasks) kernel.registerTask(task);
  return kernel;
}

/** Identity helper preserving literal typing for task definitions. */
export function defineTask(task: KernelTask): KernelTask {
  return task;
}

export const healthy = (message?: string): KernelHealthReport => ({
  level: "healthy",
  message,
  checkedAt: systemClock.now(),
});

export const degraded = (message?: string): KernelHealthReport => ({
  level: "degraded",
  message,
  checkedAt: systemClock.now(),
});

export const unhealthy = (message?: string): KernelHealthReport => ({
  level: "unhealthy",
  message,
  checkedAt: systemClock.now(),
});
