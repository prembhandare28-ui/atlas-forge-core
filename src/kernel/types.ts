/**
 * ATLAS Kernel — core contracts.
 * Pure types only: no runtime, no UI, no I/O.
 */

export type KernelPhase = "idle" | "booting" | "running" | "degraded" | "stopping" | "stopped";

export type KernelHealthLevel = "healthy" | "degraded" | "unhealthy" | "unknown";

export type TaskState = "registered" | "starting" | "running" | "stopping" | "stopped" | "failed";

export type KernelLogLevel = "debug" | "info" | "warn" | "error";

/** Structured, serializable metadata used across kernel primitives. */
export type KernelMetadata = Readonly<Record<string, string | number | boolean | null>>;

export interface KernelLogger {
  log(level: KernelLogLevel, message: string, metadata?: KernelMetadata): void;
}

export interface KernelClock {
  now(): number;
}

/** Immutable snapshot of a health probe result. */
export interface KernelHealthReport {
  readonly level: KernelHealthLevel;
  readonly message?: string;
  readonly checkedAt: number;
}

export interface KernelHealthProbe {
  readonly id: string;
  check(): KernelHealthReport | Promise<KernelHealthReport>;
}

/**
 * Context handed to every task. Subsystems depend on this interface only,
 * never on the concrete kernel implementation (dependency inversion).
 */
export interface KernelContext {
  readonly kernelId: string;
  readonly clock: KernelClock;
  readonly logger: KernelLogger;
  readonly events: KernelEventEmitter;
  readonly metadata: KernelMetadata;
}

/** A unit of work coordinated by the kernel lifecycle. */
export interface KernelTask {
  readonly id: string;
  readonly description?: string;
  /** Tasks with a lower order start earlier and stop later. */
  readonly order?: number;
  start(context: KernelContext): void | Promise<void>;
  stop?(context: KernelContext): void | Promise<void>;
  health?(context: KernelContext): KernelHealthReport | Promise<KernelHealthReport>;
}

export interface KernelTaskSnapshot {
  readonly id: string;
  readonly description?: string;
  readonly order: number;
  readonly state: TaskState;
  readonly startedAt?: number;
  readonly stoppedAt?: number;
  readonly error?: string;
}

export interface KernelStatus {
  readonly kernelId: string;
  readonly phase: KernelPhase;
  readonly health: KernelHealthLevel;
  readonly bootedAt?: number;
  readonly uptimeMs: number;
  readonly tasks: readonly KernelTaskSnapshot[];
  readonly reports: readonly (KernelHealthReport & { readonly id: string })[];
}

export type KernelEventName =
  | "kernel:boot:start"
  | "kernel:boot:complete"
  | "kernel:boot:failed"
  | "kernel:shutdown:start"
  | "kernel:shutdown:complete"
  | "kernel:task:state"
  | "kernel:health";

export interface KernelEvent {
  readonly name: KernelEventName;
  readonly at: number;
  readonly payload?: KernelMetadata;
}

export type KernelEventListener = (event: KernelEvent) => void;

export interface KernelEventEmitter {
  emit(name: KernelEventName, payload?: KernelMetadata): void;
  on(name: KernelEventName, listener: KernelEventListener): () => void;
  onAny(listener: KernelEventListener): () => void;
}
