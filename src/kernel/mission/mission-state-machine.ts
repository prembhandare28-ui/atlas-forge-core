import { MissionTransitionError } from "./mission-errors";
import type { MissionStatus } from "./mission-types";

const TRANSITIONS: Readonly<Record<MissionStatus, readonly MissionStatus[]>> = {
  created: ["queued", "cancelled"],
  queued: ["running", "cancelled", "created"],
  running: ["paused", "completed", "failed", "cancelled"],
  paused: ["running", "cancelled", "failed"],
  completed: [],
  failed: ["queued"],
  cancelled: ["queued"],
};

const TERMINAL: readonly MissionStatus[] = ["completed", "failed", "cancelled"];

/** Single source of truth for legal mission status transitions. */
export class MissionStateMachine {
  canTransition(from: MissionStatus, to: MissionStatus): boolean {
    return TRANSITIONS[from].includes(to);
  }

  assertTransition(missionId: string, from: MissionStatus, to: MissionStatus): void {
    if (!this.canTransition(from, to)) {
      throw new MissionTransitionError(missionId, from, to);
    }
  }

  nextStates(from: MissionStatus): readonly MissionStatus[] {
    return TRANSITIONS[from];
  }

  isTerminal(status: MissionStatus): boolean {
    return TERMINAL.includes(status);
  }
}