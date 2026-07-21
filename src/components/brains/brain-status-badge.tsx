import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BRAIN_STATUSES, type BrainStatus } from "@/lib/brains/constants";

const TONE: Record<string, string> = {
  muted: "bg-muted text-muted-foreground",
  success: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  destructive: "bg-destructive/15 text-destructive border-destructive/30",
  primary: "bg-primary/15 text-primary border-primary/30",
};

export function BrainStatusBadge({ status }: { status: BrainStatus }) {
  const s = BRAIN_STATUSES.find((x) => x.value === status);
  return (
    <Badge variant="outline" className={cn("text-[11px] font-medium border", TONE[s?.tone ?? "muted"])}>
      {s?.label ?? status}
    </Badge>
  );
}