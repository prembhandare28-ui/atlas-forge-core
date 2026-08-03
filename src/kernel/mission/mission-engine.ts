import { defineTask, degraded, healthy } from "../factory";
import type { KernelContext, KernelMetadata, KernelTask } from "../types";
import { InMemoryMissionQueue, type MissionQueue } from "./mission-queue";
import { InMemoryMissionStateStore } from "./in-memory-mission-state-store";
import { MissionExecutor } from "./mission-executor";
import { MISSION_EVENTS } from "./mission-events";
import { MissionError } from "./mission-errors";
import { MissionRegistry } from "./mission-registry";
import { MissionStateMachine } from "./mission-state-machine";
import type { MissionStateStore } from "./mission-state-store";
import { MissionTransitionWriter } from "./mission-transitions";
import type {
  CreateMissionInput,
  MissionDefinition,
  MissionHistoryEntry,
  MissionInstance,
  MissionListFilter,
  MissionMetrics,
  MissionPayload,
  MissionProgress,
} from "./mission-types";

export const MISSION_ENGINE_SERVICE_ID = "mission-engine";
export const MISSION_ENGINE_TASK_ID = "mission-engine";

export interface MissionEngineDependencies {
  readonly registry?: MissionRegistry;
  readonly store?: MissionStateStore;
  readonly queue?: MissionQueue;
  readonly stateMachine?: MissionStateMachine;
}

let missionSequence = 0;

/**
 * First official AtlasKernel subsystem. Owns mission lifecycle only —
 * no UI, no database, no AI runtime, no workflow orchestration.
 */
export class MissionEngine {
  readonly registry: MissionRegistry;
  private readonly store: MissionStateStore;
  private readonly queue: MissionQueue;
  private readonly stateMachine: MissionStateMachine;
  private readonly writer: MissionTransitionWriter;
  private readonly executor: MissionExecutor;
  private draining = false;
  private started = false;

  constructor(
    private readonly context: KernelContext,
    dependencies: MissionEngineDependencies = {},
  ) {
    this.registry = dependencies.registry ?? new MissionRegistry();
    this.store = dependencies.store ?? new InMemoryMissionStateStore();
    this.queue = dependencies.queue ?? new InMemoryMissionQueue();
    this.stateMachine = dependencies.stateMachine ?? new MissionStateMachine();
    this.writer = new MissionTransitionWriter(this.store, this.stateMachine, context);
    this.executor = new MissionExecutor(this.registry, this.store, this.writer, context);
  }

  /* ---------- lifecycle ---------- */

  start(): void {
    this.started = true;
    this.context.logger.log("info", "mission engine started");
  }

  async stop(): Promise<void> {
    this.started = false;
    this.executor.cancelAll();
    this.queue.clear();
    this.context.logger.log("info", "mission engine stopped");
  }

  isStarted(): boolean {
    return this.started;
  }

  /* ---------- definitions ---------- */

  registerMission<TInput extends MissionPayload, TResult extends MissionPayload>(
    definition: MissionDefinition<TInput, TResult>,
  ): void {
    this.registry.register(definition);
    this.writer.emitLifecycle(MISSION_EVENTS.registered, {
      definitionId: definition.id,
      type: definition.type,
      version: definition.version,
    });
  }

  listDefinitions(): readonly MissionDefinition[] {
    return this.registry.list();
  }

  /* ---------- instances ---------- */

  createMission(input: CreateMissionInput): MissionInstance {
    const definition = this.registry.require(input.definitionId);
    const at = this.context.clock.now();
    missionSequence += 1;
    const id = input.id ?? `msn-${at.toString(36)}-${missionSequence.toString(36)}`;
    if (this.store.get(id)) throw new MissionError(`Mission "${id}" already exists`);

    const metadata: KernelMetadata = { ...(definition.metadata ?? {}), ...(input.metadata ?? {}) };
    const instance: MissionInstance = {
      id,
      definitionId: definition.id,
      status: "created",
      input: input.input ?? {},
      progress: { percent: 0, updatedAt: at },
      metadata,
      attempts: 0,
      createdAt: at,
      updatedAt: at,
    };
    this.writer.recordCreation(instance);
    return instance;
  }

  queueMission(missionId: string): MissionInstance {
    const instance = this.writer.transition(missionId, "queued", { message: "Queued" });
    this.queue.enqueue(missionId);
    void this.drain();
    return instance;
  }

  /** Creates and queues in one call — convenience for callers and UI. */
  dispatchMission(input: CreateMissionInput): MissionInstance {
    const created = this.createMission(input);
    return this.queueMission(created.id);
  }

  /** Runs a queued mission immediately, bypassing the FIFO drain. */
  async runMission(missionId: string): Promise<MissionInstance> {
    this.queue.remove(missionId);
    return this.executor.execute(missionId);
  }

  pauseMission(missionId: string): boolean {
    this.writer.require(missionId);
    return this.executor.pause(missionId);
  }

  resumeMission(missionId: string): boolean {
    const instance = this.writer.require(missionId);
    if (this.executor.isActive(missionId)) return this.executor.resume(missionId);
    if (instance.status === "paused") {
      this.writer.transition(missionId, "cancelled", { message: "Paused mission is not active" });
      return false;
    }
    return false;
  }

  cancelMission(missionId: string): MissionInstance {
    const instance = this.writer.require(missionId);
    this.queue.remove(missionId);
    if (this.executor.isActive(missionId)) {
      this.executor.cancel(missionId);
      return instance;
    }
    return this.writer.transition(missionId, "cancelled", { message: "Cancelled" });
  }

  retryMission(missionId: string): MissionInstance {
    const instance = this.writer.require(missionId);
    const definition = this.registry.require(instance.definitionId);
    if (definition.maxRetries !== undefined && instance.attempts > definition.maxRetries) {
      throw new MissionError(`Mission "${missionId}" exceeded its retry limit`);
    }
    return this.queueMission(missionId);
  }

  deleteMission(missionId: string): boolean {
    this.queue.remove(missionId);
    this.executor.cancel(missionId);
    const deleted = this.store.delete(missionId);
    if (deleted) {
      this.writer.emitLifecycle(MISSION_EVENTS.deleted, { missionId });
    }
    return deleted;
  }

  /* ---------- reads ---------- */

  getMission(missionId: string): MissionInstance | undefined {
    return this.store.get(missionId);
  }

  listMissions(filter?: MissionListFilter): readonly MissionInstance[] {
    return this.store.list(filter);
  }

  missionHistory(missionId: string): readonly MissionHistoryEntry[] {
    return this.store.history(missionId);
  }

  recentHistory(limit = 20): readonly MissionHistoryEntry[] {
    return this.store.recentHistory(limit);
  }

  missionProgress(missionId: string): MissionProgress | undefined {
    return this.store.get(missionId)?.progress;
  }

  metrics(): MissionMetrics {
    return this.store.metrics();
  }

  queuedMissionIds(): readonly string[] {
    return this.queue.list();
  }

  nextStates(missionId: string) {
    const instance = this.writer.require(missionId);
    return this.stateMachine.nextStates(instance.status);
  }

  /** Sequential FIFO drain. No scheduling, no concurrency policy. */
  private async drain(): Promise<void> {
    if (this.draining) return;
    this.draining = true;
    try {
      let next = this.queue.dequeue();
      while (next) {
        const instance = this.store.get(next);
        if (instance?.status === "queued") {
          await this.executor.execute(next);
        }
        next = this.queue.dequeue();
      }
    } finally {
      this.draining = false;
    }
  }
}

/** Kernel integration: registers the engine as a lifecycle-managed task. */
export function createMissionEngineTask(
  onReady?: (engine: MissionEngine) => void,
  dependencies?: MissionEngineDependencies,
): KernelTask {
  let engine: MissionEngine | undefined;
  return defineTask({
    id: MISSION_ENGINE_TASK_ID,
    description: "ATLAS Mission Engine — mission lifecycle subsystem",
    order: 10,
    start: (context: KernelContext) => {
      engine = new MissionEngine(context, dependencies);
      engine.start();
      onReady?.(engine);
    },
    stop: async () => {
      await engine?.stop();
      engine = undefined;
    },
    health: () => {
      if (!engine?.isStarted()) return degraded("mission engine is not running");
      const metrics = engine.metrics();
      return metrics.failed > 0
        ? degraded(`${metrics.failed} failed mission(s)`)
        : healthy(`${metrics.total} mission(s) tracked`);
    },
  });
}