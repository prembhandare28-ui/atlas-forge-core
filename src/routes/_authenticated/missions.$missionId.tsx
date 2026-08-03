import { createFileRoute, Link } from "@tanstack/react-router";

import { PageHeader } from "@/components/shared/page-header";
import { MissionActions } from "@/components/missions/mission-actions";
import { MissionProgressBar } from "@/components/missions/mission-progress-bar";
import { MissionStatusBadge } from "@/components/missions/mission-status-badge";
import { MissionTimeline } from "@/components/missions/mission-timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/shared/loading-screen";
import { useMission } from "@/lib/missions/hooks";
import { formatMissionDuration, formatMissionTime } from "@/lib/missions/constants";

export const Route = createFileRoute("/_authenticated/missions/$missionId")({
  head: () => ({
    meta: [
      { title: "Mission Detail — ATLAS OS" },
      {
        name: "description",
        content: "Inspect a single ATLAS mission: status, progress, payload, result and timeline.",
      },
      { property: "og:title", content: "Mission Detail — ATLAS OS" },
      {
        property: "og:description",
        content: "Inspect status, progress, payload and lifecycle history for one ATLAS mission.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MissionDetailPage,
});

function MissionDetailPage() {
  const { missionId } = Route.useParams();
  const { mission, history, ready } = useMission(missionId);

  if (!ready) return <LoadingScreen label="Starting mission runtime" />;

  if (!mission) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <PageHeader
          title="Mission not found"
          description="Missions live in the in-memory runtime and are cleared when the app reloads."
          actions={
            <Button asChild variant="outline">
              <Link to="/missions">Back to Mission Control</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title={mission.definitionId}
        description={`Mission ${mission.id}`}
        actions={
          <div className="flex items-center gap-2">
            <MissionStatusBadge status={mission.status} />
            <MissionActions mission={mission} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <MissionProgressBar progress={mission.progress} />
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <Detail label="Created" value={formatMissionTime(mission.createdAt)} />
              <Detail label="Started" value={formatMissionTime(mission.startedAt)} />
              <Detail label="Completed" value={formatMissionTime(mission.completedAt)} />
              <Detail
                label="Duration"
                value={formatMissionDuration(mission.startedAt, mission.completedAt)}
              />
              <Detail label="Attempts" value={String(mission.attempts)} />
              <Detail label="Updated" value={formatMissionTime(mission.updatedAt)} />
            </div>
            {mission.error ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {mission.error}
              </p>
            ) : null}
            <div className="grid gap-4 lg:grid-cols-2">
              <Payload title="Input" value={mission.input} />
              <Payload title="Result" value={mission.result} />
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <MissionTimeline entries={history} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function Payload({ title, value }: { title: string; value?: Readonly<Record<string, unknown>> }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
      <pre className="max-h-48 overflow-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs">
        {value ? JSON.stringify(value, null, 2) : "—"}
      </pre>
    </div>
  );
}