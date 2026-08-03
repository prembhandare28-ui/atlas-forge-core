/**
 * ATLAS Kernel — public API (Sprint 007 foundation).
 * UI-independent, side-effect free on import.
 */
export { AtlasKernel, KERNEL_VERSION, type KernelOptions } from "./kernel";
export { KernelTaskRegistry } from "./task-registry";
export { KernelHealthMonitor, type IdentifiedHealthReport } from "./health-monitor";
export { KernelEventBus } from "./event-bus";
export { KernelError, describeError } from "./errors";
export { systemClock } from "./clock";
export { silentLogger, createConsoleLogger } from "./logger";
export { createKernel, defineTask, healthy, degraded, unhealthy } from "./factory";
/** Subsystems (Sprint 008+). */
export * from "./mission/index";
export type {
  KernelClock,
  KernelContext,
  KernelEvent,
  KernelEventEmitter,
  KernelEventListener,
  KernelEventName,
  KernelFeatureFlags,
  KernelHealthLevel,
  KernelHealthProbe,
  KernelHealthReport,
  KernelLogLevel,
  KernelLogger,
  KernelMetadata,
  KernelMetrics,
  KernelPhase,
  KernelRuntimeInfo,
  KernelServices,
  KernelStatus,
  KernelTask,
  KernelTaskSnapshot,
  TaskState,
} from "./types";
