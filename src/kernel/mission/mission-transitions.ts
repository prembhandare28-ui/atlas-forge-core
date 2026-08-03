import type { KernelClock, KernelContext, KernelMetadata } from "../types";
import { MissionNotFoundError } from "./mission-errors";
import { MissionEventPublisher, MISSION_EVENTS, type MissionEventName } from "./mission-events";
import { MissionStateMachine } from "./mission-state-machine";
import type { MissionStateStore } from "./mission-state-store";
import type { MissionInstance, MissionPayload, MissionStatus } from "./mission-types";

const STATUS_EVENT: Readonly<Record<MissionStatus, MissionEventName | null>> = {
  created: MISSION_EVENTS.created,
  queued: MISSION_EVENTS.queued,
  running: MISSION_EVENTS.started,
  paused: MISSION_EVENTS.paused,
  completed: MISSION_EVENTS.completed,
  failed: MISSION_EVENTS.failed,
  cancelled: MISSION_EVENTS.cancelled,
};

export interface MissionTransitionPatch {
  readonly result?: MissionPayload;
  readonly error?: string;
  readonly message?: string;
  readonly attempts?: number;
  readonly progressPercent?: number;
  readonly progressMessage?: string;
}

/**
 * Applies validated status changes, writes history and emits events.
 * Shared by the engine and the executor so transition logic exists once.
 */
export class MissionTransitionWriter {
  private readonly clock: KernelClock;
  private readonly publisher: MissionEventPublisher;

  constructor(
    private readonly store: MissionStateStore,
    private readonly stateMachine: MissionStateMachine,
    context: KernelContext,
  ) {
    this.clock = context.clock;
    this.publisher = new MissionEventPublisher(context);
  }

  require(missionId: string): MissionInstance {
    const instance = this.store.get(missionId);
    if (!instance) throw new MissionNotFoundError(missionId);
    return instance;
  }

  transition(
    missionId: string,
    to: MissionStatus,
    patch: MissionTransitionPatch = {},
  ): MissionInstance {
    const current = this.require(missionId);
    this.stateMachine.assertTransition(missionId, current.status, to);
    const at = this.clock.now();

    const next: MissionInstance = {
      ...current,
      status: to,
      updatedAt: at,
      attempts: patch.attempts ?? current.attempts,
      result: patch.result ?? (to === "queued" ? undefined : current.result),
      error: to === "failed" ? patch.error : to === "queued" ? undefined : current.error,
      queuedAt: to === "queued" ? at : current.queuedAt,
      startedAt: to === "running" && !current.startedAt ? at : current.startedAt,
      completedAt: this.stateMachine.isTerminal(to) ? at : undefined,
      progress:
        patch.progressPercent === undefined
          ? to === "completed"
            ? { percent: 100, message: current.progress.message, updatedAt: at }
            : current.progress
          : { percent: patch.progressPercent, message: patch.progressMessage, updatedAt: at },
    };

    this.store.save(next);
    this.store.appendHistory({
      missionId,
      at,
      from: current.status,
      to,
      message: patch.message ?? patch.error,
    });

    const event = STATUS_EVENT[to];
    if (event) {
      this.publisher.emit(event, {
        missionId,
        definitionId: next.definitionId,
        status: to,
        error: next.error ?? null,
      });
    }
    return next;
  }

  recordCreation(instance: MissionInstance): void {
    this.store.save(instance);
    this.store.appendHistory({
      missionId: instance.id,
      at: instance.createdAt,
      from: null,
      to: "created",
    });
    this.publisher.emit(MISSION_EVENTS.created, {
      missionId: instance.id,
      definitionId: instance.definitionId,
      status: instance.status,
      error: null,
    });
  }

  progress(missionId: string, percent: number, message?: string): void {
    const current = this.store.get(missionId);
    if (!current || current.status !== "running") return;
    const at = this.clock.now();
    const clamped = Math.min(100, Math.max(0, Math.round(percent)));
    this.store.save({
      ...current,
      progress: { percent: clamped, message, updatedAt: at },
      updatedAt: at,
    });
    this.publisher.emit(MISSION_EVENTS.progress, {
      missionId,
      percent: clamped,
      message: message ?? null,
    });
  }

  emitLifecycle(event: MissionEventName, payload: KernelMetadata): void {
    this.publisher.emit(event, payload);
  }
}