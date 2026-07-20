import { Badge } from "@/components/ui/badge";
import { WORKFLOW_STATUSES, type WorkflowStatus } from "@/lib/workflows/constants";
import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
  muted: "bg-muted text-muted-foreground border-border",
};

export function WorkflowStatusBadge({ status }: { status: WorkflowStatus }) {
  const item = WORKFLOW_STATUSES.find((s) => s.value === status);
  if (!item) return null;
  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", TONE[item.tone])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {item.label}
    </Badge>
  );
}