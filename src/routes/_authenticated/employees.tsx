import { createFileRoute } from "@tanstack/react-router";
import { Users, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/employees")({
  component: EmployeesPage,
});

function EmployeesPage() {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Employees"
        description="Manage your workforce directory. CRUD operations arrive in the next iteration."
        actions={
          <Button className="bg-[image:var(--gradient-primary)]">
            <UserPlus className="mr-2 h-4 w-4" /> Add employee
          </Button>
        }
      />
      <EmptyState
        icon={Users}
        title="Employee module coming soon"
        description="This screen is scaffolded and ready. Employee CRUD, filtering, and bulk actions will be delivered in Master Prompt #002."
      />
    </div>
  );
}