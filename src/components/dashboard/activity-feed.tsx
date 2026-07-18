import { Activity } from "lucide-react";
import { DashboardSection } from "./section";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelative } from "@/lib/employees/constants";
import { useRecentActivity } from "@/lib/dashboard/hooks";

const LABELS: Record<string, string> = {
  "employee.created": "Employee created",
  "employee.updated": "Employee updated",
  "employee.department_changed": "Department changed",
  "employee.role_changed": "Role changed",
  "employee.photo_updated": "Photo updated",
  "employee.status_changed": "Status changed",
  "employee.deleted": "Employee deleted",
};

export function ActivityFeed() {
  const { data, isLoading } = useRecentActivity(12);

  return (
    <DashboardSection
      title="Activity feed"
      description="Real business events across the workspace."
      icon={Activity}
    >
      <Card className="border-border/60">
        <CardContent className="p-5">
          {isLoading ? (
            <ul className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </li>
              ))}
            </ul>
          ) : !data || data.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No activity yet"
              description="Employee changes, deployments, and business events will appear here in real time."
            />
          ) : (
            <ul className="divide-y">
              {data.map((log) => {
                const label = LABELS[log.action] ?? log.action;
                const meta = (log.metadata ?? {}) as Record<string, unknown>;
                const subject = typeof meta.full_name === "string" ? meta.full_name : (log.entity_type ?? "");
                return (
                  <li key={log.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{label}</p>
                        {subject ? (
                          <p className="truncate text-xs text-muted-foreground">{subject}</p>
                        ) : null}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {formatRelative(log.created_at)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </DashboardSection>
  );
}