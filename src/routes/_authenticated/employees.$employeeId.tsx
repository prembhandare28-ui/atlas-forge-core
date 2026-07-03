import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mail, MapPin, Phone, Clock, Building2 } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmployeeAvatar } from "@/components/employees/employee-avatar";
import { StatusBadge } from "@/components/employees/status-badge";
import {
  useEmployeeAuditQuery,
  useEmployeeQuery,
} from "@/lib/employees/hooks";
import { EMPLOYMENT_TYPES, formatRelative, labelFor } from "@/lib/employees/constants";

export const Route = createFileRoute("/_authenticated/employees/$employeeId")({
  component: EmployeeProfilePage,
});

function EmployeeProfilePage() {
  const { employeeId } = Route.useParams();
  const { data: employee, isLoading } = useEmployeeQuery(employeeId);
  const { data: audit = [] } = useEmployeeAuditQuery(employeeId);

  if (isLoading || !employee) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const kpis = (employee.kpis as Array<{ label: string; target?: string }> | null) ?? [];
  const skills = employee.skills ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/employees">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to directory
          </Link>
        </Button>
      </div>

      <PageHeader
        title={employee.full_name}
        description={employee.role_title ?? "Team member"}
        actions={<StatusBadge status={employee.status} />}
      />

      <div className="mb-6 flex flex-col items-start gap-6 rounded-2xl border bg-card/40 p-6 md:flex-row md:items-center">
        <EmployeeAvatar name={employee.full_name} src={employee.avatar_url} size="lg" />
        <div className="grid flex-1 grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <InfoRow icon={Mail} label="Email" value={employee.email} />
          <InfoRow icon={Phone} label="Phone" value={employee.phone ?? "—"} />
          <InfoRow icon={Building2} label="Department" value={employee.department?.name ?? "—"} />
          <InfoRow icon={MapPin} label="Location" value={employee.location ?? "—"} />
          <InfoRow icon={Clock} label="Timezone" value={employee.timezone ?? "—"} />
          <InfoRow
            icon={Clock}
            label="Last active"
            value={formatRelative(employee.last_active_at ?? employee.updated_at)}
          />
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="audit">Audit log</TabsTrigger>
          <TabsTrigger value="ai" disabled>
            AI profile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Bio</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground whitespace-pre-wrap">
              {employee.bio || "No bio provided."}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Responsibilities</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground whitespace-pre-wrap">
              {employee.responsibilities || "No responsibilities listed."}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organization" className="mt-4">
          <Card>
            <CardContent className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2">
              <Field label="Employee ID" value={employee.employee_code} mono />
              <Field label="Department" value={employee.department?.name ?? "—"} />
              <Field label="Role" value={employee.role_title ?? "—"} />
              <Field label="Manager" value={employee.manager?.full_name ?? "—"} />
              <Field label="Employment type" value={labelFor(EMPLOYMENT_TYPES, employee.employment_type)} />
              <Field label="Kind" value={employee.kind === "ai" ? "AI" : "Human"} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="mt-4">
          <Card>
            <CardContent className="flex flex-wrap gap-2 pt-6">
              {skills.length === 0 ? (
                <p className="text-sm text-muted-foreground">No skills recorded.</p>
              ) : (
                skills.map((s) => (
                  <Badge key={s} variant="secondary" className="rounded-full">
                    {s}
                  </Badge>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kpis" className="mt-4">
          <Card>
            <CardContent className="space-y-3 pt-6">
              {kpis.length === 0 ? (
                <p className="text-sm text-muted-foreground">No KPIs configured.</p>
              ) : (
                kpis.map((k, i) => (
                  <div
                    key={`${k.label}-${i}`}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="text-sm font-medium">{k.label}</span>
                    {k.target ? (
                      <span className="text-xs text-muted-foreground">{k.target}</span>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Activity feed becomes available in Sprint #003.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              No documents attached yet.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {audit.length === 0 ? (
                <p className="text-sm text-muted-foreground">No audit events yet.</p>
              ) : (
                <ol className="space-y-3">
                  {audit.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-start justify-between gap-4 border-b pb-3 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="text-sm font-medium">{a.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(a.created_at).toLocaleString()}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="truncate font-medium">{value}</span>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={mono ? "mt-1 font-mono text-sm" : "mt-1 text-sm"}>{value}</p>
    </div>
  );
}