import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  MissionDefinition,
  MissionHistoryEntry,
  MissionInstance,
  MissionListFilter,
  MissionMetrics,
  MissionEngine,
  KernelStatus,
} from "@/kernel";
import { ensureMissionRuntime, missionKernel, subscribeToKernelEvents } from "./runtime";

interface MissionRuntimeState {
  readonly engine?: MissionEngine;
  readonly ready: boolean;
  readonly revision: number;
}

/** Boots the kernel on mount and re-renders on every kernel event. */
export function useMissionRuntime(): MissionRuntimeState {
  const [engine, setEngine] = useState<MissionEngine | undefined>(undefined);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    void ensureMissionRuntime().then((instance) => {
      if (active) setEngine(instance);
    });
    const unsubscribe = subscribeToKernelEvents(() => {
      if (active) setRevision((value) => value + 1);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return { engine, ready: Boolean(engine), revision };
}

export function useMissions(filter?: MissionListFilter): {
  missions: readonly MissionInstance[];
  ready: boolean;
} {
  const { engine, ready, revision } = useMissionRuntime();
  const key = JSON.stringify(filter ?? {});
  const missions = useMemo(() => {
    void revision;
    void key;
    return engine ? engine.listMissions(filter) : [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, revision, key]);
  return { missions, ready };
}

export function useMission(missionId: string): {
  mission?: MissionInstance;
  history: readonly MissionHistoryEntry[];
  ready: boolean;
} {
  const { engine, ready, revision } = useMissionRuntime();
  return useMemo(() => {
    void revision;
    return {
      mission: engine?.getMission(missionId),
      history: engine?.missionHistory(missionId) ?? [],
      ready,
    };
  }, [engine, missionId, ready, revision]);
}

const EMPTY_METRICS: MissionMetrics = {
  total: 0,
  created: 0,
  queued: 0,
  running: 0,
  paused: 0,
  completed: 0,
  failed: 0,
  cancelled: 0,
};

export function useMissionMetrics(): MissionMetrics {
  const { engine, revision } = useMissionRuntime();
  return useMemo(() => {
    void revision;
    return engine?.metrics() ?? EMPTY_METRICS;
  }, [engine, revision]);
}

export function useMissionQueue(): readonly MissionInstance[] {
  const { engine, revision } = useMissionRuntime();
  return useMemo(() => {
    void revision;
    if (!engine) return [];
    return engine
      .queuedMissionIds()
      .map((id) => engine.getMission(id))
      .filter((mission): mission is MissionInstance => Boolean(mission));
  }, [engine, revision]);
}

export function useMissionDefinitions(): readonly MissionDefinition[] {
  const { engine, revision } = useMissionRuntime();
  return useMemo(() => {
    void revision;
    return engine?.listDefinitions() ?? [];
  }, [engine, revision]);
}

export function useMissionHistory(limit = 25): readonly MissionHistoryEntry[] {
  const { engine, revision } = useMissionRuntime();
  return useMemo(() => {
    void revision;
    return engine?.recentHistory(limit) ?? [];
  }, [engine, limit, revision]);
}

/** Kernel health for the mission dashboard. Read-only. */
export function useKernelStatus(): KernelStatus | undefined {
  const { revision, ready } = useMissionRuntime();
  const [status, setStatus] = useState<KernelStatus | undefined>(undefined);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    void missionKernel.getStatus().then((next) => {
      if (active) setStatus(next);
    });
    return () => {
      active = false;
    };
  }, [ready, revision]);

  return status;
}

/** Imperative mission actions bound to the running engine. */
export function useMissionActions() {
  const { engine } = useMissionRuntime();

  const dispatch = useCallback(
    (definitionId: string, input?: Record<string, unknown>, metadata?: Record<string, string>) =>
      engine?.dispatchMission({ definitionId, input, metadata }),
    [engine],
  );

  return {
    ready: Boolean(engine),
    dispatch,
    create: useCallback(
      (definitionId: string, input?: Record<string, unknown>) =>
        engine?.createMission({ definitionId, input }),
      [engine],
    ),
    queue: useCallback((id: string) => engine?.queueMission(id), [engine]),
    pause: useCallback((id: string) => engine?.pauseMission(id), [engine]),
    resume: useCallback((id: string) => engine?.resumeMission(id), [engine]),
    cancel: useCallback((id: string) => engine?.cancelMission(id), [engine]),
    retry: useCallback((id: string) => engine?.retryMission(id), [engine]),
    remove: useCallback((id: string) => engine?.deleteMission(id), [engine]),
  };
}