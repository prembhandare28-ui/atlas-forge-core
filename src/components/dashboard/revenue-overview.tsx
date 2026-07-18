import {
  DollarSign, CalendarDays, CalendarRange, Repeat, Infinity as InfinityIcon,
  TrendingUp, TrendingDown, Percent, LineChart,
} from "lucide-react";
import { DashboardSection } from "./section";
import { MetricCard } from "./metric-card";
import { IntegrationEmpty } from "./integration-empty";
import { useRevenueOverview } from "@/lib/dashboard/hooks";

const fmt = (n: number) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export function RevenueOverview() {
  const { data, isLoading } = useRevenueOverview();

  return (
    <DashboardSection
      title="Revenue overview"
      description="Today, this week, this month, and recurring revenue at a glance."
      icon={LineChart}
    >
      {!isLoading && !data ? (
        <IntegrationEmpty
          icon={DollarSign}
          title="Connect a revenue source"
          description="Wire up Stripe, HubSpot, or your warehouse to see live revenue, MRR, ARR, profit, and growth here."
          integrationHook="revenue.provider"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Today"      icon={CalendarDays}  loading={isLoading} value={data ? fmt(data.today) : "—"} />
          <MetricCard label="This week"  icon={CalendarRange} loading={isLoading} value={data ? fmt(data.week)  : "—"} />
          <MetricCard label="This month" icon={CalendarRange} loading={isLoading} value={data ? fmt(data.month) : "—"} />
          <MetricCard label="MRR"        icon={Repeat}        loading={isLoading} value={data ? fmt(data.mrr)   : "—"} tone="primary" />
          <MetricCard label="ARR"        icon={InfinityIcon}  loading={isLoading} value={data ? fmt(data.arr)   : "—"} tone="primary" />
          <MetricCard label="Profit"     icon={TrendingUp}    loading={isLoading} value={data ? fmt(data.profit) : "—"} tone="success" />
          <MetricCard label="Expenses"   icon={TrendingDown}  loading={isLoading} value={data ? fmt(data.expenses) : "—"} tone="warning" />
          <MetricCard label="Growth"     icon={Percent}       loading={isLoading} value={data ? `${data.growth.toFixed(1)}%` : "—"} tone="success" />
        </div>
      )}
    </DashboardSection>
  );
}