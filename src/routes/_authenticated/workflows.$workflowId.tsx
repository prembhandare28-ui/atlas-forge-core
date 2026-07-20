import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bot,
  Building2,
  ClipboardList,
  Clock,
  Layers,
  Pause,
  Play,
  Plus,
  Trash2,
  UserPlus,
  Users2,
  Workflow as WorkflowIcon,
  Zap,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmployeeAvatar } from "@/components/employees/employee-avatar";
import { WorkflowStatusBadge } from "@/components/workflows/workflow-status-badge";
import {
  WORKFLOW_CATEGORIES,
  WORKFLOW_TRIGGERS,
  WORKFLOW_ASSIGNMENT_ROLES,
  workflowLabelFor,
  type WorkflowStatus,
} from "@/lib/workflows/constants";
import {
  EMPLOYEE_PRIORITIES,
  formatRelative,
  labelFor,
} from "@/lib/employees/constants";
import {
  useAssignEmployee,
  useRemoveAssignment,
  useSetWorkflowStatus,
  useWorkflowActivityQuery,
  useWorkflowQuery,
  useWorkflowVersionsQuery,
} from "@/lib/workflows/hooks";
import { useManagerOptionsQuery } from "@/lib/employees/hooks";
import { useCan } from "@/lib/rbac";

export const Route = createFileRoute("/_authenticated/workflows/$workflowId")({
  component: WorkflowProfilePage,
});

function WorkflowProfilePage() {
  const { workflowId } = Route.useParams();
  const { canManageEmployees } = useCan();
  const { data: workflow, isLoading } = useWorkflowQuery(workflowId);
  const { data: activity = [] } = useWorkflowActivityQuery(workflowId);
  const { data: versions = [] } = useWorkflowVersionsQuery(workflowId);
  const { data: employees = [] } = useManagerOptionsQuery();
  const setStatus = useSetWorkflowStatus();
  const assign = useAssignEmployee(workflowId);
  const removeAssignment = useRemoveAssignment();

  const [assignEmployeeId, setAssignEmployeeId] = useState<string>("");
  const [assignRole, setAssignRole] = useState<string>("assignee");

  const totalMinutes = useMemo(
    () =>
      (workflow?.steps ?? []).reduce((sum, s) => sum + (s.estimated_minutes ?? 0), 0),
    [workflow],
  );

  if (isLoading || !workflow) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const cfg = (workflow.trigger_config as Record<string, unknown> | null) ?? {};

  const nextStatus = (): WorkflowStatus =>
    workflow.status === "active" ? "paused" : "active";

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/workflows">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to workflows
          </Link>
        </Button>
      </div>

      <PageHeader
        title={workflow.name}
        description={workflow.description ?? "No description."}
        actions={
          <div className="flex items-center gap-2">
            <WorkflowStatusBadge status={workflow.status} />
            {canManageEmployees && workflow.status !== "archived" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setStatus.mutate({ id: workflow.id, status: nextStatus() })
                }
              >
                {workflow.status === "active" ? (
                  <>
                    <Pause className="mr-2 h-3.5 w-3.5" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-3.5 w-3.5" /> Activate
                  </>
                )}
              </Button>
            )}
          </div>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard icon={Building2} label="Department" value={workflow.department?.name ?? "—"} />
        <SummaryCard icon={Layers} label="Category" value={workflowLabelFor(WORKFLOW_CATEGORIES, workflow.category)} />
        <SummaryCard icon={Zap} label="Trigger" value={workflowLabelFor(WORKFLOW_TRIGGERS, workflow.trigger_type)} />
        <SummaryCard
          icon={Clock}
          label="Est. duration"
          value={totalMinutes ? `${totalMinutes} min` : "—"}
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="steps">Steps</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="runtime">Future Runtime</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card>
            <CardContent className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2">
              <Field label="Priority" value={labelFor(EMPLOYEE_PRIORITIES, workflow.priority)} />
              <Field label="Version" value={`v${workflow.version}`} mono />
              <Field label="Executions" value={String(workflow.execution_count)} mono />
              <Field label="Last run" value={formatRelative(workflow.last_run_at)} />
              <Field label="Created" value={formatRelative(workflow.created_at)} />
              <Field label="Updated" value={formatRelative(workflow.updated_at)} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-4 w-4 text-primary" /> Trigger
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Type" value={workflowLabelFor(WORKFLOW_TRIGGERS, workflow.trigger_type)} />
              <Field label="Schedule" value={(cfg.schedule as string | null) ?? "—"} />
              <Field
                label="Notes"
                value={(cfg.notes as string | null) ?? "—"}
                className="sm:col-span-2"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="steps" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {workflow.steps.length === 0 ? (
                <p className="text-sm text-muted-foreground">No steps defined.</p>
              ) : (
                <ol className="space-y-2">
                  {workflow.steps.map((s, i) => (
                    <li
                      key={s.id}
                      className="flex items-start gap-3 rounded-lg border p-3"
                    >
                      <span className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{s.title}</span>
                          <Badge variant="secondary" className="text-[10px] uppercase">
                            {s.step_type}
                          </Badge>
                          {s.estimated_minutes ? (
                            <span className="text-xs text-muted-foreground">
                              · {s.estimated_minutes}m
                            </span>
                          ) : null}
                        </div>
                        {s.description ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {s.description}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="mt-4 space-y-4">
          {canManageEmployees && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserPlus className="h-4 w-4 text-primary" /> Assign employee
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Select value={assignEmployeeId} onValueChange={setAssignEmployeeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose employee (human, AI, or hybrid)" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.full_name}{" "}
                          <span className="text-muted-foreground">· {e.employee_code}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Select value={assignRole} onValueChange={setAssignRole}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WORKFLOW_ASSIGNMENT_ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  disabled={!assignEmployeeId || assign.isPending}
                  onClick={() => {
                    assign.mutate(
                      { employeeId: assignEmployeeId, role: assignRole as never },
                      { onSuccess: () => setAssignEmployeeId("") },
                    );
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" /> Assign
                </Button>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users2 className="h-4 w-4 text-muted-foreground" /> Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              {workflow.assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No one assigned yet.</p>
              ) : (
                <ul className="divide-y">
                  {workflow.assignments.map((a) => (
                    <li key={a.id} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-3">
                        <EmployeeAvatar
                          name={a.employee?.full_name ?? "?"}
                          src={a.employee?.avatar_url ?? null}
                          size="sm"
                        />
                        <div>
                          <div className="text-sm font-medium">
                            {a.employee?.full_name ?? "Unknown"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {a.employee?.employee_code}{" · "}
                            {a.employee?.kind === "ai"
                              ? "AI"
                              : a.employee?.kind === "hybrid"
                                ? "Hybrid"
                                : "Human"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {a.role}
                        </Badge>
                        {canManageEmployees && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => removeAssignment.mutate(a.id)}
                            aria-label="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {versions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No versions saved yet.</p>
              ) : (
                <ol className="space-y-2">
                  {versions.map((v) => (
                    <li
                      key={v.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-muted-foreground">
                          v{v.version}
                        </span>
                        <span className="text-sm">Snapshot</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatRelative(v.created_at)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                <ol className="space-y-3">
                  {activity.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-start justify-between gap-4 border-b pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex items-start gap-3">
                        <ClipboardList className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{a.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(a.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="runtime" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bot className="h-4 w-4 text-primary" /> Runtime (coming soon)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
                Execution runtime for Human, AI, and Hybrid employees ships in a future
                sprint. The workflow is production-ready as a specification today —
                assignments, steps, and versions are captured so the runtime can pick it up.
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Runtime status" value="Not deployed" />
                <Field label="Executor kind" value="TBD" />
                <Field label="Integration hooks" value="Prepared" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-card/40 p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1.5 truncate text-base font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={mono ? "mt-1 font-mono text-sm" : "mt-1 text-sm"}>{value}</p>
    </div>
  );
}

// silence unused icon import warnings when tree shakes remove branches
void WorkflowIcon;