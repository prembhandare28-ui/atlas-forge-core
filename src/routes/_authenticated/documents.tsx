import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const Route = createFileRoute("/_authenticated/documents")({
  component: () => (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader title="Documents" description="Contracts, policies, and personnel files." />
      <EmptyState icon={FileText} title="Documents module planned" description="Foundation ready — module implementation pending." />
    </div>
  ),
});