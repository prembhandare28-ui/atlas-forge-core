import { createFileRoute } from "@tanstack/react-router";
import {
  Users,
  UserPlus,
  Building2,
  TrendingUp,
  ArrowUpRight,
  Activity,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

const stats = [
  { label: "Total employees", value: "—", delta: "+0", icon: Users },
  { label: "New this month", value: "—", delta: "+0", icon: UserPlus },
  { label: "Departments", value: "—", delta: "+0", icon: Building2 },
  { label: "Active today", value: "—", delta: "+0", icon: TrendingUp },
];

function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Welcome back"
        description="Your workforce at a glance. Employee data will populate here once records are added."
        actions={
          <Button className="bg-[image:var(--gradient-primary)] shadow-[var(--shadow-md)] hover:opacity-95">
            <UserPlus className="mr-2 h-4 w-4" /> Add employee
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/60 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight">{s.value}</div>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <ArrowUpRight className="h-3 w-3" /> {s.delta} vs last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Audit trail across the workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Activity}
              title="No activity yet"
              description="Once you begin managing employees, updates will appear here in real time."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Foundation status</CardTitle>
            <CardDescription>What's ready in V1.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              "Authentication",
              "Role-based access",
              "Profiles",
              "Audit logging",
              "Design system",
              "Dark mode",
            ].map((f) => (
              <div key={f} className="flex items-center justify-between">
                <span className="text-muted-foreground">{f}</span>
                <span className="inline-flex h-2 w-2 rounded-full bg-success" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}