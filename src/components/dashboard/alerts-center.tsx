import { Bell, ShieldAlert, DollarSign, Workflow, ClipboardCheck, ServerCrash } from "lucide-react";
import { DashboardSection } from "./section";
import { IntegrationEmpty } from "./integration-empty";
import { Card, CardContent } from "@/components/ui/card";
import { useSystemAlerts } from "@/lib/dashboard/hooks";

const CATEGORIES = [
  { key: "system",   label: "System",              icon: ServerCrash },
  { key: "revenue",  label: "Revenue",             icon: DollarSign },
  { key: "workflow", label: "Workflow failures",   icon: Workflow },
  { key: "approval", label: "Pending approvals",   icon: ClipboardCheck },
  { key: "security", label: "Security",            icon: ShieldAlert },
] as const;

export function AlertsCenter() {
  const { data, isLoading } = useSystemAlerts();
  const counts = new Map<string, number>();
  (data ?? []).forEach((a) => counts.set(a.category, (counts.get(a.category) ?? 0) + 1));

  return (
    <DashboardSection title="Alerts center" icon={Bell}>
      <Card className="h-full border-border/60">
        <CardContent className="p-5">
          {!isLoading && !data ? (
            <IntegrationEmpty
              icon={Bell}
              title="No alerts configured"
              description="System, revenue, workflow, approval, and security alerts will surface here."
              integrationHook="alerts.stream"
              className="border-0 bg-transparent p-2"
            />
          ) : (
            <ul className="divide-y">
              {CATEGORIES.map((c) => {
                const n = counts.get(c.key) ?? 0;
                return (
                  <li key={c.key} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/60">
                        <c.icon className="h-4 w-4 text-muted-foreground" />
                      </span>
                      <span className="text-sm font-medium">{c.label}</span>
                    </div>
                    <span
                      className={
                        n > 0
                          ? "rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive tabular-nums"
                          : "rounded-full bg-accent/60 px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums"
                      }
                    >
                      {n}
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