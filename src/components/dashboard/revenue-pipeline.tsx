import { GitBranch, Users2, CheckCircle2, Calendar, FileText, Trophy, XCircle } from "lucide-react";
import { DashboardSection } from "./section";
import { IntegrationEmpty } from "./integration-empty";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePipelineOverview } from "@/lib/dashboard/hooks";

const STAGES = [
  { key: "leads",     label: "Leads",       icon: Users2 },
  { key: "qualified", label: "Qualified",   icon: CheckCircle2 },
  { key: "meetings",  label: "Meetings",    icon: Calendar },
  { key: "proposals", label: "Proposals",   icon: FileText },
  { key: "won",       label: "Closed Won",  icon: Trophy },
  { key: "lost",      label: "Closed Lost", icon: XCircle },
] as const;

export function RevenuePipeline() {
  const { data, isLoading } = usePipelineOverview();

  return (
    <DashboardSection
      title="Revenue pipeline"
      description="Deal flow from first touch to closed. CRM-agnostic by design."
      icon={GitBranch}
    >
      <Card className="border-border/60">
        <CardContent className="p-5">
          {!isLoading && !data ? (
            <IntegrationEmpty
              icon={GitBranch}
              title="Connect a CRM"
              description="Pipeline stages will populate from HubSpot, Salesforce, or your custom CRM once connected."
              integrationHook="crm.pipeline"
              className="border-0 bg-transparent p-2"
            />
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {STAGES.map((s) => (
                  <div key={s.key} className="rounded-lg border bg-card/40 p-3 transition-colors hover:bg-accent/30">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.label}</span>
                      <s.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    {isLoading ? (
                      <Skeleton className="h-6 w-12" />
                    ) : (
                      <div className="text-xl font-semibold tabular-nums">
                        {(data as Record<string, number> | null)?.[s.key] ?? 0}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-baseline justify-between border-t pt-4">
                <span className="text-sm text-muted-foreground">Potential revenue</span>
                {isLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  <span className="text-lg font-semibold tabular-nums">
                    {new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })
                      .format(data?.potential ?? 0)}
                  </span>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </DashboardSection>
  );
}