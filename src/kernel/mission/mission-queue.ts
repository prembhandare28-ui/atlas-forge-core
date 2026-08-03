/**
 * FIFO queue abstraction. Single-process, in-memory, no scheduling.
 * A distributed queue can implement the same interface later.
 */
export interface MissionQueue {
  enqueue(missionId: string): void;
  dequeue(): string | undefined;
  peek(): string | undefined;
  remove(missionId: string): boolean;
  has(missionId: string): boolean;
  list(): readonly string[];
  size(): number;
  clear(): void;
}

export class InMemoryMissionQueue implements MissionQueue {
  private items: string[] = [];

  enqueue(missionId: string): void {
    if (!this.items.includes(missionId)) this.items.push(missionId);
  }

  dequeue(): string | undefined {
    return this.items.shift();
  }

  peek(): string | undefined {
    return this.items[0];
  }

  remove(missionId: string): boolean {
    const index = this.items.indexOf(missionId);
    if (index < 0) return false;
    this.items.splice(index, 1);
    return true;
  }

  has(missionId: string): boolean {
    return this.items.includes(missionId);
  }

  list(): readonly string[] {
    return [...this.items];
  }

  size(): number {
    return this.items.length;
  }

  clear(): void {
    this.items = [];
  }
}