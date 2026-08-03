import type { KernelContext, KernelEventName, KernelMetadata } from "../types";

/** Mission event names. Emitted through the existing kernel event bus. */
export const MISSION_EVENTS = {
  created: "mission.created",
  queued: "mission.queued",
  started: "mission.started",
  progress: "mission.progress",
  completed: "mission.completed",
  failed: "mission.failed",
  cancelled: "mission.cancelled",
  paused: "mission.paused",
  resumed: "mission.resumed",
  deleted: "mission.deleted",
  registered: "mission.registered",
} as const;

export type MissionEventName = (typeof MISSION_EVENTS)[keyof typeof MISSION_EVENTS];

/** Thin emitter: no second event system, only a typed facade over the bus. */
export class MissionEventPublisher {
  constructor(private readonly context: KernelContext) {}

  emit(name: MissionEventName, payload: KernelMetadata): void {
    this.context.events.emit(name as KernelEventName, payload);
  }
}