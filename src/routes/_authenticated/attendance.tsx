import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const Route = createFileRoute("/_authenticated/attendance")({
  component: () => (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader title="Attendance" description="Time, shifts, and presence tracking." />
      <EmptyState icon={CalendarClock} title="Attendance module planned" description="Foundation ready — module implementation pending." />
    </div>
  ),
});