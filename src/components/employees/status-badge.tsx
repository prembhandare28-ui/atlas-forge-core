import { cn } from "@/lib/utils";
import { EMPLOYEE_STATUSES, type EmployeeStatus } from "@/lib/employees/constants";

const TONE: Record<string, string> = {
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20",
  muted: "bg-muted text-muted-foreground ring-border",
  destructive: "bg-destructive/10 text-destructive ring-destructive/20",
};

export function StatusBadge({ status, className }: { status: EmployeeStatus; className?: string }) {
  const item = EMPLOYEE_STATUSES.find((s) => s.value === status)!;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONE[item.tone],
        className,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          item.tone === "success" && "bg-emerald-500",
          item.tone === "warning" && "bg-amber-500",
          item.tone === "muted" && "bg-muted-foreground/50",
          item.tone === "destructive" && "bg-destructive",
        )}
      />
      {item.label}
    </span>
  );
}