import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const Route = createFileRoute("/_authenticated/analytics")({
  component: () => (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader title="Analytics" description="Workforce insights and reporting." />
      <EmptyState icon={BarChart3} title="Analytics module planned" description="Foundation ready — module implementation pending." />
    </div>
  ),
});