import {
  createKernel,
  createMissionEngineTask,
  type AtlasKernel,
  type KernelEvent,
  type MissionEngine,
} from "@/kernel";
import { SYSTEM_MISSION_DEFINITIONS } from "./definitions";

let engine: MissionEngine | undefined;
let bootPromise: Promise<void> | undefined;

const kernel: AtlasKernel = createKernel({ kernelId: "atlas-forge", metadata: { app: "atlas-os" } }, [
  createMissionEngineTask((instance) => {
    engine = instance;
    for (const definition of SYSTEM_MISSION_DEFINITIONS) {
      if (!instance.registry.has(definition.id)) instance.registerMission(definition);
    }
  }),
]);

export const missionKernel = kernel;

/** Boots the kernel once and returns the Mission Engine subsystem. */
export async function ensureMissionRuntime(): Promise<MissionEngine> {
  bootPromise ??= kernel.boot().then(() => undefined);
  await bootPromise;
  if (!engine) throw new Error("Mission engine failed to start");
  return engine;
}

export function getMissionEngine(): MissionEngine | undefined {
  return engine;
}

/** Subscribes to every kernel event — the UI's single change signal. */
export function subscribeToKernelEvents(listener: (event: KernelEvent) => void): () => void {
  return kernel.getContext().events.onAny(listener);
}