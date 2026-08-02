import { systemClock } from "./clock";
import { KernelEventBus } from "./event-bus";
import { describeError, KernelError } from "./errors";
import { KernelHealthMonitor } from "./health-monitor";
import { silentLogger } from "./logger";
import { KernelTaskRegistry } from "./task-registry";
import type {
  KernelClock,
  KernelContext,
  KernelFeatureFlags,
  KernelHealthLevel,
  KernelHealthProbe,
  KernelLogger,
  KernelMetadata,
  KernelMetrics,
  KernelPhase,
  KernelRuntimeInfo,
  KernelServices,
  KernelStatus,
  KernelTask,
} from "./types";

/** Kernel API version. Bump when the public kernel contract changes. */
export const KERNEL_VERSION = "0.1.0";

let runtimeSequence = 0;

function nextRuntimeId(kernelId: string, at: number): string {
  runtimeSequence += 1;
  return `${kernelId}-${at.toString(36)}-${runtimeSequence.toString(36)}`;
}

export interface KernelOptions {
  readonly kernelId?: string;
  /** Overrides the generated runtime id (useful in tests). */
  readonly runtimeId?: string;
  readonly version?: string;
  readonly clock?: KernelClock;
  readonly logger?: KernelLogger;
  readonly metadata?: KernelMetadata;
  /** Additive feature flags; unknown flags are ignored. */
  readonly features?: KernelFeatureFlags;
  /** Injectable services made available through the kernel context. */
  readonly services?: KernelServices;
  /** Boot fails fast by default; set false to boot in a degraded phase. */
  readonly failFast?: boolean;
}

/**
 * ATLAS Kernel — coordinates registered tasks and reports runtime status.
 * Deliberately free of business, AI, network and database concerns.
 */
export class AtlasKernel {
  private readonly registry = new KernelTaskRegistry();
  private readonly health: KernelHealthMonitor;
  private readonly context: KernelContext;
  private readonly failFast: boolean;
  private readonly version: string;
  private readonly runtimeId: string;
  private readonly createdAt: number;
  private phase: KernelPhase = "idle";
  private healthLevel: KernelHealthLevel = "unknown";
  private bootedAt?: number;
  private transition?: Promise<void>;

  constructor(options: KernelOptions = {}) {
    const clock = options.clock ?? systemClock;
    this.failFast = options.failFast ?? true;
    this.health = new KernelHealthMonitor(clock);
    const kernelId = options.kernelId ?? "atlas-kernel";
    this.version = options.version ?? KERNEL_VERSION;
    this.createdAt = clock.now();
    this.runtimeId = options.runtimeId ?? nextRuntimeId(kernelId, this.createdAt);
    const features = options.features ?? {};
    const services = options.services ?? {};
    this.context = {
      kernelId,
      version: this.version,
      runtimeId: this.runtimeId,
      clock,
      logger: options.logger ?? silentLogger,
      events: new KernelEventBus(clock),
      metadata: options.metadata ?? {},
      features,
      services,
      getService: <T,>(serviceId: string) => services[serviceId] as T | undefined,
      isEnabled: (flag: string) => features[flag] === true,
    };
  }

  /** Stable, injectable context for subsystems (Sprint 008+). */
  getContext(): KernelContext {
    return this.context;
  }

  getPhase(): KernelPhase {
    return this.phase;
  }

  /** Immutable runtime metadata (version, runtimeId, startedAt, uptime). */
  getRuntimeInfo(): KernelRuntimeInfo {
    const now = this.context.clock.now();
    return {
      kernelId: this.context.kernelId,
      version: this.version,
      runtimeId: this.runtimeId,
      createdAt: this.createdAt,
      startedAt: this.bootedAt,
      uptimeMs: this.bootedAt ? Math.max(0, now - this.bootedAt) : 0,
    };
  }

  /** Placeholder metrics surface — task counters only, no business logic. */
  getMetrics(): KernelMetrics {
    return this.registry.metrics();
  }

  isRunning(): boolean {
    return this.phase === "running" || this.phase === "degraded";
  }

  registerTask(task: KernelTask): void {
    if (this.phase !== "idle" && this.phase !== "stopped") {
      throw new KernelError(`Cannot register "${task.id}" while kernel is ${this.phase}`);
    }
    this.registry.register(task);
    if (task.health) {
      this.health.add({
        id: `task:${task.id}`,
        check: () => task.health!(this.context),
      });
    }
  }

  registerHealthProbe(probe: KernelHealthProbe): () => void {
    return this.health.add(probe);
  }

  async boot(): Promise<KernelStatus> {
    await this.transition;
    if (this.isRunning()) return this.getStatus();
    this.transition = this.performBoot();
    await this.transition;
    this.transition = undefined;
    return this.getStatus();
  }

  async shutdown(): Promise<KernelStatus> {
    await this.transition;
    if (!this.isRunning()) return this.getStatus();
    this.transition = this.performShutdown();
    await this.transition;
    this.transition = undefined;
    return this.getStatus();
  }

  async getStatus(): Promise<KernelStatus> {
    const reports = this.isRunning() ? await this.health.collect() : [];
    if (this.isRunning()) {
      this.healthLevel = reports.length ? KernelHealthMonitor.worst(reports) : "healthy";
      if (this.phase === "degraded" && this.healthLevel === "healthy") this.healthLevel = "degraded";
    }
    const now = this.context.clock.now();
    return {
      kernelId: this.context.kernelId,
      version: this.version,
      runtimeId: this.runtimeId,
      phase: this.phase,
      health: this.isRunning() ? this.healthLevel : "unknown",
      startedAt: this.bootedAt,
      bootedAt: this.bootedAt,
      uptimeMs: this.bootedAt ? Math.max(0, now - this.bootedAt) : 0,
      metrics: this.registry.metrics(),
      tasks: this.registry.snapshot(),
      reports,
    };
  }

  private async performBoot(): Promise<void> {
    this.phase = "booting";
    this.log("info", "kernel boot started");
    this.context.events.emit("kernel:boot:start");
    const started: KernelTask[] = [];
    let failures = 0;

    for (const task of this.registry.ordered()) {
      this.setTaskState(task.id, "starting");
      try {
        await task.start(this.context);
        this.setTaskState(task.id, "running");
        started.push(task);
      } catch (error) {
        const message = describeError(error);
        failures += 1;
        this.setTaskState(task.id, "failed", message);
        this.log("error", `task "${task.id}" failed to start`, { error: message });
        if (this.failFast) {
          await this.stopTasks(started);
          this.phase = "stopped";
          this.healthLevel = "unhealthy";
          this.context.events.emit("kernel:boot:failed", { task: task.id, error: message });
          throw new KernelError(`Kernel boot aborted: task "${task.id}" failed — ${message}`);
        }
      }
    }

    this.bootedAt = this.context.clock.now();
    this.phase = failures > 0 ? "degraded" : "running";
    this.healthLevel = failures > 0 ? "degraded" : "healthy";
    this.context.events.emit("kernel:boot:complete", { tasks: started.length, failures });
    this.log("info", "kernel boot complete", { tasks: started.length, failures });
  }

  private async performShutdown(): Promise<void> {
    this.phase = "stopping";
    this.context.events.emit("kernel:shutdown:start");
    await this.stopTasks([...this.registry.ordered()].reverse());
    this.phase = "stopped";
    this.healthLevel = "unknown";
    this.bootedAt = undefined;
    this.context.events.emit("kernel:shutdown:complete");
    this.log("info", "kernel shutdown complete");
  }

  private async stopTasks(tasks: readonly KernelTask[]): Promise<void> {
    for (const task of tasks) {
      if (this.registry.stateOf(task.id) !== "running") continue;
      this.setTaskState(task.id, "stopping");
      try {
        await task.stop?.(this.context);
        this.setTaskState(task.id, "stopped");
      } catch (error) {
        const message = describeError(error);
        this.setTaskState(task.id, "failed", message);
        this.log("warn", `task "${task.id}" failed to stop`, { error: message });
      }
    }
  }

  private setTaskState(
    taskId: string,
    state: Parameters<KernelTaskRegistry["setState"]>[1],
    error?: string,
  ): void {
    this.registry.setState(taskId, state, this.context.clock.now(), error);
    this.context.events.emit("kernel:task:state", { task: taskId, state, error: error ?? null });
  }

  private log(level: "info" | "warn" | "error", message: string, metadata?: KernelMetadata): void {
    this.context.logger.log(level, message, metadata);
  }
}
