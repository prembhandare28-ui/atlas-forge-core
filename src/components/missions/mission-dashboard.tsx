import { useMemo, useState } from "react";
import { Activity, CheckCircle2, ListOrdered, Loader2, TriangleAlert } from "lucide-react";
import type { MissionStatus } from "@/kernel";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MISSION_STATUSES, MISSION_STATUS_LABELS } from "@/lib/missions/constants";
import {
  useKernelStatus,
  useMissionDefinitions,
  useMissionHistory,
  useMissionMetrics,
  useMissionQueue,
  useMissions,
} from "@/lib/missions/hooks";
import { MissionCard } from "./mission-card";
import { MissionEmptyState } from "./mission-empty-state";
import { MissionTimeline } from "./mission-timeline";

export function MissionDashboard() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | MissionStatus>("all");
  const filter = useMemo(
    () => ({
      search: search.trim() || undefined,
      status: status === "all" ? undefined : ([status] as readonly MissionStatus[]),
    }),
    [search, status],
  );

  const { missions, ready } = useMissions(filter);
  const metrics = useMissionMetrics();
  const queue = useMissionQueue();
  const history = useMissionHistory(15);
  const definitions = useMissionDefinitions();
  const kernel = useKernelStatus();

  const definitionMap = useMemo(
    () => new Map(definitions.map((item) => [item.id, item])),
    [definitions],
  );

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total missions" value={metrics.total} icon={ListOrdered} />
        <MetricCard label="Running" value={metrics.running} icon={Loader2} tone="primary" />
        <MetricCard label="Completed" value={metrics.completed} icon={CheckCircle2} tone="success" />
        <MetricCard label="Failed" value={metrics.failed} icon={TriangleAlert} tone="destructive" />
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4 text-primary" /> Runtime
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-4">
          <Runtime label="Kernel phase" value={kernel?.phase ?? (ready ? "running" : "booting")} />
          <Runtime label="Health" value={kernel?.health ?? "unknown"} />
          <Runtime label="Queue depth" value={String(queue.length)} />
          <Runtime label="Definitions" value={String(definitions.length)} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search missions by id or definition"
          className="sm:max-w-sm"
        />
        <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
          <SelectTrigger className="sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {MISSION_STATUSES.map((value) => (
              <SelectItem key={value} value={value}>
                {MISSION_STATUS_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {missions.length === 0 ? (
            <MissionEmptyState
              description={
                ready
                  ? "No missions match the current filters. Launch one to populate the runtime."
                  : "Starting the mission runtime…"
              }
            />
          ) : (
            missions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                definition={definitionMap.get(mission.definitionId)}
              />
            ))
          )}
        </div>

        <Card className="h-fit border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Lifecycle timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <MissionTimeline entries={history} showMissionId />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Runtime({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium capitalize">{value}</p>
    </div>
  );
}