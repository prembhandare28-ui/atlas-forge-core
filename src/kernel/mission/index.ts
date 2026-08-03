/**
 * ATLAS Mission Engine — public API (Sprint 008).
 * Subsystem of AtlasKernel. UI-independent, side-effect free on import.
 */
export {
  MissionEngine,
  createMissionEngineTask,
  MISSION_ENGINE_SERVICE_ID,
  MISSION_ENGINE_TASK_ID,
  type MissionEngineDependencies,
} from "./mission-engine";
export { MissionRegistry } from "./mission-registry";
export { MissionExecutor } from "./mission-executor";
export { InMemoryMissionQueue, type MissionQueue } from "./mission-queue";
export { MissionStateMachine } from "./mission-state-machine";
export type { MissionStateStore } from "./mission-state-store";
export { InMemoryMissionStateStore } from "./in-memory-mission-state-store";
export { MissionTransitionWriter, type MissionTransitionPatch } from "./mission-transitions";
export {
  MISSION_EVENTS,
  MissionEventPublisher,
  type MissionEventName,
} from "./mission-events";
export {
  MissionError,
  MissionNotFoundError,
  MissionDefinitionNotFoundError,
  MissionTransitionError,
  MissionCancelledError,
} from "./mission-errors";
export type {
  CreateMissionInput,
  MissionDefinition,
  MissionEngineExtension,
  MissionHandler,
  MissionHistoryEntry,
  MissionInstance,
  MissionListFilter,
  MissionMetrics,
  MissionPayload,
  MissionProgress,
  MissionRunContext,
  MissionStatus,
} from "./mission-types";