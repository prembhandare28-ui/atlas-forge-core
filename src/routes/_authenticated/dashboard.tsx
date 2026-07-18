import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/shared/page-header";
import { RevenueOverview } from "@/components/dashboard/revenue-overview";
import { WorkforceOverview } from "@/components/dashboard/workforce-overview";
import { RevenuePipeline } from "@/components/dashboard/revenue-pipeline";
import { DepartmentPerformance } from "@/components/dashboard/department-performance";
import { TopPerformers } from "@/components/dashboard/top-performers";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { AlertsCenter } from "@/components/dashboard/alerts-center";
import { QuickActions } from "@/components/dashboard/quick-actions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-10">
      <PageHeader
        title="Command Center"
        description="Real-time pulse of revenue, workforce, and operations across ATLAS OS."
        actions={<QuickActions.Inline />}
      />

      <RevenueOverview />
      <WorkforceOverview />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenuePipeline />
        </div>
        <TopPerformers />
      </div>

      <DepartmentPerformance />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityFeed />
        </div>
        <AlertsCenter />
      </div>

      <QuickActions />
    </div>
  );
}