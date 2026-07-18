import { Building2 } from "lucide-react";
import { DashboardSection } from "./section";
import { IntegrationEmpty } from "./integration-empty";
import { Card, CardContent } from "@/components/ui/card";
import { useDepartmentPerformance } from "@/lib/dashboard/hooks";

const DEPARTMENTS = ["Sales", "Marketing", "Operations", "Support", "Finance", "Engineering"] as const;

export function DepartmentPerformance() {
  const { data, isLoading } = useDepartmentPerformance();
  const map = new Map((data ?? []).map((d) => [d.name.toLowerCase(), d] as const));

  return (
    <DashboardSection
      title="Department performance"
      description="Revenue, cost, ROI, and productivity per team."
      icon={Building2}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DEPARTMENTS.map((name) => {
          const d = map.get(name.toLowerCase());
          return (
            <Card key={name} className="border-border/60 transition-shadow hover:shadow-[var(--shadow-md)]">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{name}</h3>
                  <span className="rounded-full bg-accent/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {isLoading ? "…" : d ? "Live" : "Not connected"}
                  </span>
                </div>
                {!isLoading && !d ? (
                  <IntegrationEmpty
                    title="No metrics yet"
                    description="Metrics populate once revenue and productivity sources are connected."
                    integrationHook={`dept.${name.toLowerCase()}`}
                    className="mt-3 border-0 bg-transparent p-0"
                  />
                ) : (
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div><dt className="text-xs text-muted-foreground">Revenue</dt><dd className="mt-0.5 font-medium tabular-nums">{d?.revenue ?? "—"}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Cost</dt><dd className="mt-0.5 font-medium tabular-nums">{d?.cost ?? "—"}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">ROI</dt><dd className="mt-0.5 font-medium tabular-nums">{d ? `${d.roi}%` : "—"}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Employees</dt><dd className="mt-0.5 font-medium tabular-nums">{d?.employees ?? "—"}</dd></div>
                    <div className="col-span-2"><dt className="text-xs text-muted-foreground">Productivity</dt><dd className="mt-0.5 font-medium tabular-nums">{d?.productivity ?? "—"}</dd></div>
                  </dl>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </DashboardSection>
  );
}