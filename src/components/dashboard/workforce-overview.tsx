import {
  Users, User, Bot, Blend, CircleDot, Moon, PowerOff, AlertOctagon,
} from "lucide-react";
import { DashboardSection } from "./section";
import { MetricCard } from "./metric-card";
import { useWorkforceStats } from "@/lib/dashboard/hooks";

export function WorkforceOverview() {
  const { data, isLoading } = useWorkforceStats();
  const s = data;

  return (
    <DashboardSection
      title="Workforce overview"
      description="Human today, AI-ready tomorrow. Click any card to drill into the directory."
      icon={Users}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total employees" icon={Users} loading={isLoading}
          value={s?.total ?? 0}
          hint={s ? `${s.newThisMonth} new this month · ${s.departments} departments` : undefined}
          to="/employees" />
        <MetricCard label="Human employees" icon={User} loading={isLoading}
          value={s?.human ?? 0} to="/employees" search={{ kind: ["human"] }} />
        <MetricCard label="AI employees" icon={Bot} loading={isLoading}
          value={s?.ai ?? 0} to="/employees" search={{ kind: ["ai"] }} tone="primary" />
        <MetricCard label="Hybrid" icon={Blend} loading={isLoading}
          value={s?.hybrid ?? 0} hint="Reserved for hybrid teams" tone="muted" />

        <MetricCard label="Active" icon={CircleDot} loading={isLoading}
          value={s?.active ?? 0} to="/employees" search={{ status: ["active"] }} tone="success" />
        <MetricCard label="Idle" icon={Moon} loading={isLoading}
          value={s?.idle ?? 0} to="/employees" search={{ status: ["on_leave"] }} tone="warning" />
        <MetricCard label="Offline" icon={PowerOff} loading={isLoading}
          value={s?.offline ?? 0} to="/employees" search={{ status: ["inactive"] }} tone="muted" />
        <MetricCard label="Error" icon={AlertOctagon} loading={isLoading}
          value={s?.error ?? 0} to="/employees" search={{ status: ["archived"] }} tone="destructive" />
      </div>
    </DashboardSection>
  );
}