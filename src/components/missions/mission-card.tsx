import { Link } from "@tanstack/react-router";
import type { MissionDefinition, MissionInstance } from "@/kernel";
import { Card, CardContent } from "@/components/ui/card";
import { MissionActions } from "./mission-actions";
import { MissionProgressBar } from "./mission-progress-bar";
import { MissionStatusBadge } from "./mission-status-badge";
import { formatMissionTime } from "@/lib/missions/constants";

export function MissionCard({
  mission,
  definition,
}: {
  mission: MissionInstance;
  definition?: MissionDefinition;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="space-y-3 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              to="/missions/$missionId"
              params={{ missionId: mission.id }}
              className="truncate text-sm font-semibold hover:underline"
            >
              {definition?.name ?? mission.definitionId}
            </Link>
            <p className="truncate text-[11px] text-muted-foreground">{mission.id}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <MissionStatusBadge status={mission.status} />
            <MissionActions mission={mission} />
          </div>
        </div>
        <MissionProgressBar progress={mission.progress} />
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Created {formatMissionTime(mission.createdAt)}</span>
          <span>Attempt {mission.attempts}</span>
        </div>
        {mission.error ? (
          <p className="rounded-md bg-destructive/10 px-2 py-1.5 text-[11px] text-destructive">
            {mission.error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}