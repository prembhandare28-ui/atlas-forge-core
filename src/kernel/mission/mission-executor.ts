import { describeError } from "../errors";
import type { KernelContext } from "../types";
import { MissionCancelledError } from "./mission-errors";
import type { MissionRegistry } from "./mission-registry";
import type { MissionStateStore } from "./mission-state-store";
import type { MissionTransitionWriter } from "./mission-transitions";
import type { MissionInstance, MissionPayload, MissionRunContext } from "./mission-types";

interface RunControl {
  paused: boolean;
  cancelled: boolean;
  resume?: () => void;
}

/** Runs mission handlers: progress, transitions, errors, cancellation. */
export class MissionExecutor {
  private readonly controls = new Map<string, RunControl>();

  constructor(
    private readonly registry: MissionRegistry,
    private readonly store: MissionStateStore,
    private readonly writer: MissionTransitionWriter,
    private readonly context: KernelContext,
  ) {}

  isActive(missionId: string): boolean {
    return this.controls.has(missionId);
  }

  pause(missionId: string): boolean {
    const control = this.controls.get(missionId);
    if (!control || control.paused) return false;
    control.paused = true;
    return true;
  }

  resume(missionId: string): boolean {
    const control = this.controls.get(missionId);
    if (!control || !control.paused) return false;
    control.paused = false;
    control.resume?.();
    control.resume = undefined;
    return true;
  }

  cancel(missionId: string): boolean {
    const control = this.controls.get(missionId);
    if (!control) return false;
    control.cancelled = true;
    control.paused = false;
    control.resume?.();
    control.resume = undefined;
    return true;
  }

  cancelAll(): void {
    for (const missionId of [...this.controls.keys()]) this.cancel(missionId);
  }

  async execute(missionId: string): Promise<MissionInstance> {
    const instance = this.writer.require(missionId);
    const definition = this.registry.require(instance.definitionId);
    const control: RunControl = { paused: false, cancelled: false };
    this.controls.set(missionId, control);

    const running = this.writer.transition(missionId, "running", {
      attempts: instance.attempts + 1,
      progressPercent: 0,
      progressMessage: "Starting",
    });
    this.context.logger.log("info", `mission "${missionId}" started`, {
      definitionId: definition.id,
      attempt: running.attempts,
    });

    const runContext: MissionRunContext = {
      missionId,
      definitionId: definition.id,
      input: instance.input,
      kernel: this.context,
      report: (percent, message) => this.writer.progress(missionId, percent, message),
      checkpoint: () => this.checkpoint(missionId, control),
      get isCancelled() {
        return control.cancelled;
      },
    };

    try {
      const result = (await definition.handler(runContext)) as MissionPayload;
      await this.checkpoint(missionId, control);
      return this.writer.transition(missionId, "completed", {
        result: result ?? {},
        message: "Completed",
      });
    } catch (error) {
      const message = describeError(error);
      if (control.cancelled) {
        this.context.logger.log("warn", `mission "${missionId}" cancelled`, { message });
        const current = this.store.get(missionId);
        return current?.status === "cancelled"
          ? current
          : this.writer.transition(missionId, "cancelled", { message });
      }
      this.context.logger.log("error", `mission "${missionId}" failed`, { error: message });
      return this.writer.transition(missionId, "failed", { error: message });
    } finally {
      this.controls.delete(missionId);
    }
  }

  private async checkpoint(missionId: string, control: RunControl): Promise<void> {
    if (control.cancelled) throw new MissionCancelledError(missionId);
    if (!control.paused) return;
    const current = this.store.get(missionId);
    if (current?.status === "running") this.writer.transition(missionId, "paused");
    await new Promise<void>((resolve) => {
      control.resume = resolve;
    });
    if (control.cancelled) throw new MissionCancelledError(missionId);
    const paused = this.store.get(missionId);
    if (paused?.status === "paused") this.writer.transition(missionId, "running");
  }
}