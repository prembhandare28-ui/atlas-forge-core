import { KernelError } from "./errors";
import type { KernelMetrics, KernelTask, KernelTaskSnapshot, TaskState } from "./types";

interface TaskRecord {
  readonly task: KernelTask;
  state: TaskState;
  startedAt?: number;
  stoppedAt?: number;
  error?: string;
}

/** Owns task identity and lifecycle state. Does not execute tasks. */
export class KernelTaskRegistry {
  private readonly records = new Map<string, TaskRecord>();

  register(task: KernelTask): void {
    if (this.records.has(task.id)) {
      throw new KernelError(`Task "${task.id}" is already registered`);
    }
    this.records.set(task.id, { task, state: "registered" });
  }

  unregister(taskId: string): void {
    this.records.delete(taskId);
  }

  has(taskId: string): boolean {
    return this.records.has(taskId);
  }

  /** Tasks in start order (ascending `order`, then registration order). */
  ordered(): readonly KernelTask[] {
    return [...this.records.values()]
      .map((record, index) => ({ record, index }))
      .sort((a, b) => (a.record.task.order ?? 0) - (b.record.task.order ?? 0) || a.index - b.index)
      .map((entry) => entry.record.task);
  }

  setState(taskId: string, state: TaskState, at: number, error?: string): void {
    const record = this.records.get(taskId);
    if (!record) return;
    record.state = state;
    record.error = error;
    if (state === "running") record.startedAt = at;
    if (state === "stopped" || state === "failed") record.stoppedAt = at;
  }

  stateOf(taskId: string): TaskState | undefined {
    return this.records.get(taskId)?.state;
  }

  snapshot(): readonly KernelTaskSnapshot[] {
    return this.ordered().map((task) => {
      const record = this.records.get(task.id) as TaskRecord;
      return {
        id: task.id,
        description: task.description,
        order: task.order ?? 0,
        state: record.state,
        startedAt: record.startedAt,
        stoppedAt: record.stoppedAt,
        error: record.error,
      };
    });
  }

  /** Placeholder metrics derived from task state only. */
  metrics(): KernelMetrics {
    let running = 0;
    let completed = 0;
    let failed = 0;
    for (const record of this.records.values()) {
      if (record.state === "running") running += 1;
      else if (record.state === "stopped") completed += 1;
      else if (record.state === "failed") failed += 1;
    }
    return {
      totalTasks: this.records.size,
      runningTasks: running,
      completedTasks: completed,
      failedTasks: failed,
    };
  }
}
