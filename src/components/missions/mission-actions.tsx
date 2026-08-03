import { MoreHorizontal, Pause, Play, RotateCcw, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { MissionInstance } from "@/kernel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMissionActions } from "@/lib/missions/hooks";

export function MissionActions({
  mission,
  onDeleted,
}: {
  mission: MissionInstance;
  onDeleted?: () => void;
}) {
  const actions = useMissionActions();

  const guard = (label: string, fn: () => unknown) => {
    try {
      fn();
      toast.success(label);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  };

  const canQueue = mission.status === "created";
  const canPause = mission.status === "running";
  const canResume = mission.status === "paused";
  const canCancel = ["created", "queued", "running", "paused"].includes(mission.status);
  const canRetry = ["failed", "cancelled"].includes(mission.status);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Mission actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {canQueue ? (
          <DropdownMenuItem onClick={() => guard("Mission queued", () => actions.queue(mission.id))}>
            <Play className="mr-2 h-4 w-4" /> Queue
          </DropdownMenuItem>
        ) : null}
        {canPause ? (
          <DropdownMenuItem onClick={() => guard("Mission paused", () => actions.pause(mission.id))}>
            <Pause className="mr-2 h-4 w-4" /> Pause
          </DropdownMenuItem>
        ) : null}
        {canResume ? (
          <DropdownMenuItem onClick={() => guard("Mission resumed", () => actions.resume(mission.id))}>
            <Play className="mr-2 h-4 w-4" /> Resume
          </DropdownMenuItem>
        ) : null}
        {canRetry ? (
          <DropdownMenuItem onClick={() => guard("Mission re-queued", () => actions.retry(mission.id))}>
            <RotateCcw className="mr-2 h-4 w-4" /> Retry
          </DropdownMenuItem>
        ) : null}
        {canCancel ? (
          <DropdownMenuItem onClick={() => guard("Mission cancelled", () => actions.cancel(mission.id))}>
            <XCircle className="mr-2 h-4 w-4" /> Cancel
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() =>
            guard("Mission deleted", () => {
              actions.remove(mission.id);
              onDeleted?.();
            })
          }
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}