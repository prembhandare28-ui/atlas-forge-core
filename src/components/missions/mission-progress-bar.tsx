import { Progress } from "@/components/ui/progress";
import type { MissionProgress } from "@/kernel";

export function MissionProgressBar({ progress }: { progress: MissionProgress }) {
  return (
    <div className="space-y-1.5">
      <Progress value={progress.percent} className="h-1.5" />
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="truncate">{progress.message ?? "No progress reported"}</span>
        <span className="tabular-nums">{progress.percent}%</span>
      </div>
    </div>
  );
}