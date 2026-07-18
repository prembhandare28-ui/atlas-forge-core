import { Trophy, Building2, Zap, Target, Timer } from "lucide-react";
import { DashboardSection } from "./section";
import { IntegrationEmpty } from "./integration-empty";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTopPerformers } from "@/lib/dashboard/hooks";

const ROWS = [
  { key: "topRevenueEmployee", label: "Top revenue employee", icon: Trophy },
  { key: "topDepartment",      label: "Top department",       icon: Building2 },
  { key: "mostProductive",     label: "Most productive",      icon: Zap },
  { key: "highestRoi",         label: "Highest ROI",          icon: Target },
  { key: "fastestResponse",    label: "Fastest response",     icon: Timer },
] as const;

export function TopPerformers() {
  const { data, isLoading } = useTopPerformers();

  return (
    <DashboardSection title="Top performers" icon={Trophy}>
      <Card className="h-full border-border/60">
        <CardContent className="p-5">
          {!isLoading && !data ? (
            <IntegrationEmpty
              title="Awaiting data"
              description="Rankings appear once revenue and productivity signals stream in."
              integrationHook="analytics.rankings"
              className="border-0 bg-transparent p-2"
            />
          ) : (
            <ul className="divide-y">
              {ROWS.map((r) => {
                const entry = data?.[r.key] ?? null;
                return (
                  <li key={r.key} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/60">
                        <r.icon className="h-4 w-4 text-muted-foreground" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{r.label}</p>
                        {isLoading ? (
                          <Skeleton className="mt-1 h-4 w-32" />
                        ) : (
                          <p className="truncate text-sm font-medium">{entry?.name ?? "—"}</p>
                        )}
                      </div>
                    </div>
                    {!isLoading ? (
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                        {entry?.value ?? "—"}
                      </span>
                    ) : null}
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