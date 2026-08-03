/**
 * ATLAS Mission Engine — contracts.
 * Pure types only: no runtime, no UI, no I/O, no persistence.
 */
import type { KernelContext, KernelMetadata } from "../types";

export type MissionStatus =
  | "created"
  | "queued"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

/** JSON-serializable payload boundary for mission input/result. */
export type MissionPayload = Readonly<Record<string, unknown>>;

export interface MissionProgress {
  readonly percent: number;
  readonly message?: string;
  readonly updatedAt: number;
}

/** Reported by an executing handler. */
export interface MissionRunContext<TInput extends MissionPayload = MissionPayload> {
  readonly missionId: string;
  readonly definitionId: string;
  readonly input: TInput;
  readonly kernel: KernelContext;
  /** Report progress (0-100). Ignored once the mission has settled. */
  report(percent: number, message?: string): void;
  /** Resolves when running; waits while paused; throws when cancelled. */
  checkpoint(): Promise<void>;
  readonly isCancelled: boolean;
}

export type MissionHandler<
  TInput extends MissionPayload = MissionPayload,
  TResult extends MissionPayload = MissionPayload,
> = (context: MissionRunContext<TInput>) => Promise<TResult> | TResult;

export interface MissionDefinition<
  TInput extends MissionPayload = MissionPayload,
  TResult extends MissionPayload = MissionPayload,
> {
  readonly id: string;
  readonly type: string;
  readonly name: string;
  readonly description?: string;
  readonly version: string;
  readonly metadata?: KernelMetadata;
  /** Maximum retries surfaced to callers; the engine never auto-retries. */
  readonly maxRetries?: number;
  readonly handler: MissionHandler<TInput, TResult>;
}

export interface MissionInstance {
  readonly id: string;
  readonly definitionId: string;
  readonly status: MissionStatus;
  readonly input: MissionPayload;
  readonly result?: MissionPayload;
  readonly progress: MissionProgress;
  readonly error?: string;
  readonly metadata: KernelMetadata;
  readonly attempts: number;
  readonly createdAt: number;
  readonly queuedAt?: number;
  readonly startedAt?: number;
  readonly completedAt?: number;
  readonly updatedAt: number;
}

export interface MissionHistoryEntry {
  readonly missionId: string;
  readonly at: number;
  readonly from: MissionStatus | null;
  readonly to: MissionStatus;
  readonly message?: string;
}

export interface MissionListFilter {
  readonly status?: readonly MissionStatus[];
  readonly definitionId?: string;
  readonly search?: string;
}

export interface MissionMetrics {
  readonly total: number;
  readonly created: number;
  readonly queued: number;
  readonly running: number;
  readonly paused: number;
  readonly completed: number;
  readonly failed: number;
  readonly cancelled: number;
}

export interface CreateMissionInput {
  readonly definitionId: string;
  readonly input?: MissionPayload;
  readonly metadata?: KernelMetadata;
  /** Explicit id (tests / deterministic flows). Generated when omitted. */
  readonly id?: string;
}

/**
 * Extension seam for Sprint 009+ (Planner, Analyzer, Scheduler, Telemetry,
 * Memory, AI runtime, Workflow runtime). Declared only — never implemented here.
 */
export interface MissionEngineExtension {
  readonly id: string;
  attach(context: KernelContext): void;
  detach?(context: KernelContext): void;
}
