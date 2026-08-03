import type { MissionDefinition, MissionRunContext } from "@/kernel";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Built-in system mission definitions. Infrastructure-level only — no business
 * logic. Product missions register themselves through `registerMission`.
 */
export const SYSTEM_MISSION_DEFINITIONS: readonly MissionDefinition[] = [
  {
    id: "system.kernel-diagnostics",
    type: "diagnostics",
    name: "Kernel Diagnostics",
    description: "Collects kernel runtime metadata and reports it as a mission result.",
    version: "1.0.0",
    handler: async (context: MissionRunContext) => {
      context.report(20, "Reading kernel runtime");
      await context.checkpoint();
      const { kernelId, version, runtimeId } = context.kernel;
      context.report(70, "Aggregating diagnostics");
      await context.checkpoint();
      return { kernelId, version, runtimeId, checkedAt: Date.now() };
    },
  },
  {
    id: "system.pipeline-check",
    type: "diagnostics",
    name: "Pipeline Check",
    description: "Staged mission used to verify queue, progress and lifecycle wiring.",
    version: "1.0.0",
    maxRetries: 3,
    handler: async (context: MissionRunContext) => {
      const stages = ["Queue", "Executor", "State machine", "Event bus"];
      let index = 0;
      for (const stage of stages) {
        await context.checkpoint();
        index += 1;
        context.report((index / stages.length) * 100, `${stage} verified`);
        await wait(400);
      }
      return { stages: stages.length, verifiedAt: Date.now() };
    },
  },
];