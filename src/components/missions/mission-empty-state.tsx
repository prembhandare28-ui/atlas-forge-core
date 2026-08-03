import { Rocket } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export function MissionEmptyState({
  title = "No missions yet",
  description = "Dispatch a mission from the registry to see it appear here.",
}: {
  title?: string;
  description?: string;
}) {
  return <EmptyState icon={Rocket} title={title} description={description} />;
}