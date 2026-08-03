import type { MissionHistoryEntry } from "@/kernel";
import { MISSION_STATUS_LABELS, formatMissionTime } from "@/lib/missions/constants";
import { MissionStatusBadge } from "./mission-status-badge";

export function MissionTimeline({
  entries,
  showMissionId = false,
}: {
  entries: readonly MissionHistoryEntry[];
  showMissionId?: boolean;
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No lifecycle events recorded yet.</p>;
  }
  return (
    <ol className="relative space-y-4 border-l pl-5">
      {entries.map((entry, index) => (
        <li key={`${entry.missionId}-${entry.at}-${index}`} className="relative">
          <span className="absolute -left-[1.42rem] top-1.5 h-2 w-2 rounded-full bg-primary" />
          <div className="flex flex-wrap items-center gap-2">
            <MissionStatusBadge status={entry.to} />
            <span className="text-xs text-muted-foreground">
              {entry.from ? `from ${MISSION_STATUS_LABELS[entry.from]}` : "initial state"}
            </span>
            {showMissionId ? (
              <span className="font-mono text-[11px] text-muted-foreground">{entry.missionId}</span>
            ) : null}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {formatMissionTime(entry.at)}
            {entry.message ? ` · ${entry.message}` : ""}
          </p>
        </li>
      ))}
    </ol>
  );
}