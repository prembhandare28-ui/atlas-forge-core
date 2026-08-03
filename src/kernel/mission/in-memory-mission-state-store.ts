import type { MissionStateStore } from "./mission-state-store";
import type {
  MissionHistoryEntry,
  MissionInstance,
  MissionListFilter,
  MissionMetrics,
  MissionStatus,
} from "./mission-types";

/** Single-process, in-memory store. No database, no persistence. */
export class InMemoryMissionStateStore implements MissionStateStore {
  private readonly instances = new Map<string, MissionInstance>();
  private readonly historyEntries: MissionHistoryEntry[] = [];

  save(instance: MissionInstance): void {
    this.instances.set(instance.id, instance);
  }

  get(missionId: string): MissionInstance | undefined {
    return this.instances.get(missionId);
  }

  delete(missionId: string): boolean {
    return this.instances.delete(missionId);
  }

  list(filter: MissionListFilter = {}): readonly MissionInstance[] {
    const search = filter.search?.trim().toLowerCase();
    return [...this.instances.values()]
      .filter((instance) => {
        if (filter.status && !filter.status.includes(instance.status)) return false;
        if (filter.definitionId && instance.definitionId !== filter.definitionId) return false;
        if (search) {
          const haystack = `${instance.id} ${instance.definitionId}`.toLowerCase();
          if (!haystack.includes(search)) return false;
        }
        return true;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  metrics(): MissionMetrics {
    const counters: Record<MissionStatus, number> = {
      created: 0,
      queued: 0,
      running: 0,
      paused: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };
    for (const instance of this.instances.values()) counters[instance.status] += 1;
    return { total: this.instances.size, ...counters };
  }

  appendHistory(entry: MissionHistoryEntry): void {
    this.historyEntries.push(entry);
  }

  history(missionId: string): readonly MissionHistoryEntry[] {
    return this.historyEntries.filter((entry) => entry.missionId === missionId);
  }

  recentHistory(limit: number): readonly MissionHistoryEntry[] {
    return [...this.historyEntries].reverse().slice(0, Math.max(0, limit));
  }

  clear(): void {
    this.instances.clear();
    this.historyEntries.length = 0;
  }
}