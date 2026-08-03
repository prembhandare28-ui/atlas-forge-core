import type { MissionStatus } from "@/kernel";
import { cn } from "@/lib/utils";
import {
  MISSION_STATUS_LABELS,
  MISSION_STATUS_TONES,
  MISSION_TONE_CLASSES,
} from "@/lib/missions/constants";

export function MissionStatusBadge({
  status,
  className,
}: {
  status: MissionStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        MISSION_TONE_CLASSES[MISSION_STATUS_TONES[status]],
        className,
      )}
    >
      {MISSION_STATUS_LABELS[status]}
    </span>
  );
}