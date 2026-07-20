import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { WorkflowFormValues, WorkflowStepItem } from "./schemas";
import type {
  WorkflowAssignmentRole,
  WorkflowCategory,
  WorkflowStatus,
} from "./constants";

export type WorkflowRow = Database["public"]["Tables"]["workflows"]["Row"];
export type WorkflowStepRow = Database["public"]["Tables"]["workflow_steps"]["Row"];
export type WorkflowAssignmentRow =
  Database["public"]["Tables"]["workflow_assignments"]["Row"];
export type WorkflowActivityRow =
  Database["public"]["Tables"]["workflow_activity"]["Row"];
export type WorkflowVersionRow =
  Database["public"]["Tables"]["workflow_versions"]["Row"];

export interface WorkflowWithRelations extends WorkflowRow {
  department: { id: string; name: string } | null;
  steps: WorkflowStepRow[];
  assignments: (WorkflowAssignmentRow & {
    employee: { id: string; full_name: string; employee_code: string; avatar_url: string | null; kind: string } | null;
  })[];
}

export interface ListWorkflowsParams {
  search?: string;
  departmentIds?: string[];
  categories?: WorkflowCategory[];
  statuses?: WorkflowStatus[];
  page?: number;
  pageSize?: number;
  sort?: { column: "name" | "updated_at" | "created_at" | "status"; ascending: boolean };
}

export interface ListWorkflowsResult {
  rows: WorkflowWithRelations[];
  total: number;
}

const WORKFLOW_SELECT = `
  *,
  department:departments(id, name),
  steps:workflow_steps(*),
  assignments:workflow_assignments(
    *,
    employee:employees(id, full_name, employee_code, avatar_url, kind)
  )
` as const;

function nullIfEmpty(v: string | null | undefined): string | null {
  const s = (v ?? "").toString().trim();
  return s.length ? s : null;
}

export async function listWorkflows(
  params: ListWorkflowsParams = {},
): Promise<ListWorkflowsResult> {
  const {
    search,
    departmentIds,
    categories,
    statuses,
    page = 1,
    pageSize = 25,
    sort = { column: "updated_at", ascending: false },
  } = params;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let q = supabase
    .from("workflows")
    .select(WORKFLOW_SELECT, { count: "exact" })
    .order(sort.column, { ascending: sort.ascending })
    .range(from, to);

  const term = search?.trim();
  if (term) {
    const escaped = term.replace(/[,%]/g, "");
    q = q.or(`name.ilike.%${escaped}%,description.ilike.%${escaped}%`);
  }
  if (departmentIds?.length) q = q.in("department_id", departmentIds);
  if (categories?.length) q = q.in("category", categories);
  if (statuses?.length) q = q.in("status", statuses);

  const { data, error, count } = await q;
  if (error) throw error;
  return {
    rows: (data ?? []) as unknown as WorkflowWithRelations[],
    total: count ?? 0,
  };
}

export async function getWorkflow(id: string): Promise<WorkflowWithRelations> {
  const { data, error } = await supabase
    .from("workflows")
    .select(WORKFLOW_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Workflow not found");
  const wf = data as unknown as WorkflowWithRelations;
  wf.steps = [...(wf.steps ?? [])].sort((a, b) => a.order_index - b.order_index);
  return wf;
}

function stepInsert(workflowId: string, s: WorkflowStepItem, order: number) {
  return {
    workflow_id: workflowId,
    order_index: order,
    title: s.title.trim(),
    description: nullIfEmpty(s.description ?? null),
    step_type: s.step_type,
    estimated_minutes: s.estimated_minutes ?? null,
    assigned_employee_id: s.assigned_employee_id ?? null,
  } satisfies Database["public"]["Tables"]["workflow_steps"]["Insert"];
}

export async function createWorkflow(values: WorkflowFormValues): Promise<WorkflowRow> {
  const { data: user } = await supabase.auth.getUser();
  const uid = user.user?.id ?? null;

  const totalMinutes = values.steps.reduce(
    (sum, s) => sum + (s.estimated_minutes ?? 0),
    0,
  );

  const insertPayload: Database["public"]["Tables"]["workflows"]["Insert"] = {
    name: values.name.trim(),
    description: nullIfEmpty(values.description ?? null),
    department_id: values.department_id ?? null,
    category: values.category,
    priority: values.priority,
    status: "draft",
    owner_id: values.owner_id ?? uid,
    trigger_type: values.trigger_type,
    trigger_config: {
      schedule: nullIfEmpty(values.trigger_schedule ?? null),
      notes: nullIfEmpty(values.trigger_notes ?? null),
    } as unknown as Database["public"]["Tables"]["workflows"]["Insert"]["trigger_config"],
    estimated_duration_minutes: totalMinutes || null,
    version: 1,
    created_by: uid,
  };

  const { data: workflow, error } = await supabase
    .from("workflows")
    .insert(insertPayload)
    .select("*")
    .single();
  if (error) throw error;

  if (values.steps.length) {
    const { error: stepErr } = await supabase
      .from("workflow_steps")
      .insert(values.steps.map((s, i) => stepInsert(workflow.id, s, i)));
    if (stepErr) throw stepErr;
  }

  const assignments = values.assignments ?? [];
  if (assignments.length) {
    const rows = assignments.map((employeeId) => ({
      workflow_id: workflow.id,
      employee_id: employeeId,
      role: "assignee" as WorkflowAssignmentRole,
    }));
    const { error: aErr } = await supabase.from("workflow_assignments").insert(rows);
    if (aErr) throw aErr;
  }

  await logWorkflowActivity(workflow.id, "workflow.created", {
    name: workflow.name,
  });

  await snapshotWorkflowVersion(workflow.id);

  return workflow;
}

export async function updateWorkflow(
  id: string,
  patch: Partial<WorkflowFormValues>,
): Promise<WorkflowRow> {
  const payload: Database["public"]["Tables"]["workflows"]["Update"] = {};
  if (patch.name !== undefined) payload.name = patch.name.trim();
  if (patch.description !== undefined) payload.description = nullIfEmpty(patch.description);
  if (patch.department_id !== undefined) payload.department_id = patch.department_id ?? null;
  if (patch.category !== undefined) payload.category = patch.category;
  if (patch.priority !== undefined) payload.priority = patch.priority;
  if (patch.owner_id !== undefined) payload.owner_id = patch.owner_id ?? null;
  if (patch.trigger_type !== undefined) payload.trigger_type = patch.trigger_type;
  if (patch.trigger_schedule !== undefined || patch.trigger_notes !== undefined) {
    payload.trigger_config = {
      schedule: nullIfEmpty(patch.trigger_schedule ?? null),
      notes: nullIfEmpty(patch.trigger_notes ?? null),
    } as unknown as Database["public"]["Tables"]["workflows"]["Update"]["trigger_config"];
  }

  const { data, error } = await supabase
    .from("workflows")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;

  await logWorkflowActivity(id, "workflow.updated", {});
  return data;
}

export async function setWorkflowStatus(
  id: string,
  status: WorkflowStatus,
): Promise<WorkflowRow> {
  const { data, error } = await supabase
    .from("workflows")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  await logWorkflowActivity(id, `workflow.status.${status}`, {});
  return data;
}

export async function deleteWorkflow(id: string): Promise<void> {
  const { error } = await supabase.from("workflows").delete().eq("id", id);
  if (error) throw error;
}

export async function cloneWorkflow(id: string): Promise<WorkflowRow> {
  const src = await getWorkflow(id);
  const values: WorkflowFormValues = {
    name: `${src.name} (Copy)`,
    description: src.description ?? "",
    department_id: src.department_id,
    category: src.category,
    priority: src.priority,
    owner_id: src.owner_id,
    trigger_type: src.trigger_type,
    trigger_schedule:
      ((src.trigger_config as Record<string, unknown> | null)?.schedule as string | null) ?? "",
    trigger_notes:
      ((src.trigger_config as Record<string, unknown> | null)?.notes as string | null) ?? "",
    steps: src.steps.map((s) => ({
      title: s.title,
      description: s.description ?? "",
      step_type: s.step_type,
      estimated_minutes: s.estimated_minutes,
      assigned_employee_id: s.assigned_employee_id,
    })),
    assignments: src.assignments.map((a) => a.employee_id),
  };
  return createWorkflow(values);
}

// ---------- Steps ----------
export async function replaceWorkflowSteps(
  workflowId: string,
  steps: WorkflowStepItem[],
): Promise<void> {
  const { error: delErr } = await supabase
    .from("workflow_steps")
    .delete()
    .eq("workflow_id", workflowId);
  if (delErr) throw delErr;
  if (steps.length) {
    const { error } = await supabase
      .from("workflow_steps")
      .insert(steps.map((s, i) => stepInsert(workflowId, s, i)));
    if (error) throw error;
  }
  const totalMinutes = steps.reduce((sum, s) => sum + (s.estimated_minutes ?? 0), 0);
  await supabase
    .from("workflows")
    .update({ estimated_duration_minutes: totalMinutes || null })
    .eq("id", workflowId);
  await logWorkflowActivity(workflowId, "workflow.steps.updated", { count: steps.length });
  await snapshotWorkflowVersion(workflowId);
}

// ---------- Assignments ----------
export async function assignEmployeeToWorkflow(
  workflowId: string,
  employeeId: string,
  role: WorkflowAssignmentRole = "assignee",
): Promise<WorkflowAssignmentRow> {
  const { data, error } = await supabase
    .from("workflow_assignments")
    .insert({ workflow_id: workflowId, employee_id: employeeId, role })
    .select("*")
    .single();
  if (error) throw error;
  await logWorkflowActivity(workflowId, "workflow.assignment.added", {
    employee_id: employeeId,
    role,
  });
  return data;
}

export async function removeWorkflowAssignment(assignmentId: string): Promise<void> {
  const { data: existing } = await supabase
    .from("workflow_assignments")
    .select("workflow_id, employee_id")
    .eq("id", assignmentId)
    .maybeSingle();
  const { error } = await supabase
    .from("workflow_assignments")
    .delete()
    .eq("id", assignmentId);
  if (error) throw error;
  if (existing) {
    await logWorkflowActivity(existing.workflow_id, "workflow.assignment.removed", {
      employee_id: existing.employee_id,
    });
  }
}

// ---------- Versions ----------
async function snapshotWorkflowVersion(workflowId: string): Promise<void> {
  const wf = await getWorkflow(workflowId);
  const { data: latest } = await supabase
    .from("workflow_versions")
    .select("version")
    .eq("workflow_id", workflowId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextVersion = (latest?.version ?? 0) + 1;
  const { data: user } = await supabase.auth.getUser();
  await supabase.from("workflow_versions").insert({
    workflow_id: workflowId,
    version: nextVersion,
    snapshot: {
      workflow: {
        name: wf.name,
        description: wf.description,
        category: wf.category,
        priority: wf.priority,
        trigger_type: wf.trigger_type,
        trigger_config: wf.trigger_config,
      },
      steps: wf.steps.map((s) => ({
        title: s.title,
        description: s.description,
        step_type: s.step_type,
        estimated_minutes: s.estimated_minutes,
        assigned_employee_id: s.assigned_employee_id,
        order_index: s.order_index,
      })),
    } as unknown as Database["public"]["Tables"]["workflow_versions"]["Insert"]["snapshot"],
    created_by: user.user?.id ?? null,
  });
  await supabase.from("workflows").update({ version: nextVersion }).eq("id", workflowId);
}

export async function listWorkflowVersions(workflowId: string): Promise<WorkflowVersionRow[]> {
  const { data, error } = await supabase
    .from("workflow_versions")
    .select("*")
    .eq("workflow_id", workflowId)
    .order("version", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ---------- Activity ----------
export async function logWorkflowActivity(
  workflowId: string,
  action: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  await supabase.from("workflow_activity").insert({
    workflow_id: workflowId,
    action,
    metadata: metadata as unknown as Database["public"]["Tables"]["workflow_activity"]["Insert"]["metadata"],
    user_id: user.user?.id ?? null,
  });
}

export async function listWorkflowActivity(
  workflowId: string,
): Promise<WorkflowActivityRow[]> {
  const { data, error } = await supabase
    .from("workflow_activity")
    .select("*")
    .eq("workflow_id", workflowId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}