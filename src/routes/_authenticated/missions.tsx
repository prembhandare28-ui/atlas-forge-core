import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/shared/page-header";
import { MissionDashboard } from "@/components/missions/mission-dashboard";
import { MissionWizard } from "@/components/missions/mission-wizard";

export const Route = createFileRoute("/_authenticated/missions")({
  head: () => ({
    meta: [
      { title: "Mission Control — ATLAS OS" },
      {
        name: "description",
        content:
          "Dispatch, monitor and control ATLAS Mission Engine runs with live lifecycle telemetry.",
      },
      { property: "og:title", content: "Mission Control — ATLAS OS" },
      {
        property: "og:description",
        content: "Dispatch and monitor ATLAS missions with live lifecycle telemetry.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MissionsPage,
});

function MissionsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Mission Control"
        description="Runtime cockpit for the ATLAS Mission Engine — dispatch, pause, retry and audit every mission."
        actions={<MissionWizard />}
      />
      <MissionDashboard />
    </div>
  );
}