import type {
  MissionHistoryEntry,
  MissionInstance,
  MissionListFilter,
  MissionMetrics,
} from "./mission-types";

/**
 * Persistence abstraction. Sprint 008 ships an in-memory implementation only;
 * a durable store can be added later without touching the engine.
 */
export interface MissionStateStore {
  save(instance: MissionInstance): void;
  get(missionId: string): MissionInstance | undefined;
  delete(missionId: string): boolean;
  list(filter?: MissionListFilter): readonly MissionInstance[];
  metrics(): MissionMetrics;
  appendHistory(entry: MissionHistoryEntry): void;
  history(missionId: string): readonly MissionHistoryEntry[];
  recentHistory(limit: number): readonly MissionHistoryEntry[];
  clear(): void;
}