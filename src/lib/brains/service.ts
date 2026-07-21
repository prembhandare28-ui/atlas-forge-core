import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { BrainFormValues } from "./schemas";
import type { BrainCategory, BrainStatus } from "./constants";

export type BrainRow = Database["public"]["Tables"]["brains"]["Row"];
export type BrainVersionRow = Database["public"]["Tables"]["brain_versions"]["Row"];
export type BrainActivityRow = Database["public"]["Tables"]["brain_activity"]["Row"];
export type BrainAssignmentRow = Database["public"]["Tables"]["brain_assignments"]["Row"];
export type BrainAnalyticsRow = Database["public"]["Tables"]["brain_analytics_daily"]["Row"];

export interface BrainWithRelations extends BrainRow {
  knowledge: { knowledge_id: string; pack: { id: string; name: string; category: string } | null }[];
  skills: { skill_id: string; skill: { id: string; name: string; category: string } | null }[];
  tools: {
    tool_id: string;
    permissions: string[];
    tool: { id: string; name: string; provider: string; status: string } | null;
  }[];
  assignments: (BrainAssignmentRow & {
    employee: { id: string; full_name: string } | null;
    workflow: { id: string; name: string } | null;
  })[];
}

export interface ListBrainsParams {
  search?: string;
  categories?: BrainCategory[];
  statuses?: BrainStatus[];
  page?: number;
  pageSize?: number;
  sort?: { column: "name" | "updated_at" | "status"; ascending: boolean };
}

const BRAIN_SELECT = `
  *,
  knowledge:brain_knowledge(knowledge_id, pack:knowledge_packs(id,name,category)),
  skills:brain_skills(skill_id, skill:skills(id,name,category)),
  tools:brain_tools(tool_id, permissions, tool:tools(id,name,provider,status)),
  assignments:brain_assignments(*, employee:employees(id,full_name), workflow:workflows(id,name))
` as const;

function nullIfEmpty(v: string | null | undefined) {
  const s = (v ?? "").toString().trim();
  return s.length ? s : null;
}

export async function listBrains(params: ListBrainsParams = {}) {
  const {
    search,
    categories,
    statuses,
    page = 1,
    pageSize = 25,
    sort = { column: "updated_at", ascending: false },
  } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let q = supabase
    .from("brains")
    .select(BRAIN_SELECT, { count: "exact" })
    .order(sort.column, { ascending: sort.ascending })
    .range(from, to);
  const term = search?.trim();
  if (term) {
    const escaped = term.replace(/[,%]/g, "");
    q = q.or(`name.ilike.%${escaped}%,description.ilike.%${escaped}%`);
  }
  if (categories?.length) q = q.in("category", categories);
  if (statuses?.length) q = q.in("status", statuses);
  const { data, error, count } = await q;
  if (error) throw error;
  return {
    rows: (data ?? []) as unknown as BrainWithRelations[],
    total: count ?? 0,
  };
}

export async function getBrain(id: string): Promise<BrainWithRelations> {
  const { data, error } = await supabase
    .from("brains")
    .select(BRAIN_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Brain not found");
  return data as unknown as BrainWithRelations;
}

function toInsert(values: BrainFormValues, uid: string | null) {
  return {
    name: values.name.trim(),
    description: nullIfEmpty(values.description ?? null),
    category: values.category,
    tags: values.tags ?? [],
    status: values.status,
    visibility: values.visibility,
    mission: nullIfEmpty(values.mission ?? null),
    goals: values.goals ?? [],
    success_definition: nullIfEmpty(values.success_definition ?? null),
    expected_roi: values.expected_roi ?? null,
    tone: values.tone,
    decision_style: values.decision_style,
    creativity_level: values.creativity_level,
    risk_level: values.risk_level,
    response_depth: values.response_depth,
    always_do: values.always_do ?? [],
    never_do: values.never_do ?? [],
    escalation_rules: nullIfEmpty(values.escalation_rules ?? null),
    approval_rules: nullIfEmpty(values.approval_rules ?? null),
    session_memory_enabled: values.session_memory_enabled,
    long_term_memory_enabled: values.long_term_memory_enabled,
    context_window_tokens: values.context_window_tokens,
    memory_retention_days: values.memory_retention_days,
    owner_id: uid,
    created_by: uid,
    version: 1,
  } satisfies Database["public"]["Tables"]["brains"]["Insert"];
}

export async function createBrain(values: BrainFormValues): Promise<BrainRow> {
  const { data: user } = await supabase.auth.getUser();
  const uid = user.user?.id ?? null;
  const { data, error } = await supabase
    .from("brains")
    .insert(toInsert(values, uid))
    .select("*")
    .single();
  if (error) throw error;
  await logBrainActivity(data.id, "brain.created", { name: data.name });
  await snapshotBrainVersion(data.id, "Initial version");
  return data;
}

export async function updateBrain(id: string, patch: Partial<BrainFormValues>): Promise<BrainRow> {
  const payload: Database["public"]["Tables"]["brains"]["Update"] = {};
  const keys: (keyof BrainFormValues)[] = [
    "name","description","category","tags","status","visibility","mission","goals",
    "success_definition","expected_roi","tone","decision_style","creativity_level","risk_level",
    "response_depth","always_do","never_do","escalation_rules","approval_rules",
    "session_memory_enabled","long_term_memory_enabled","context_window_tokens","memory_retention_days",
  ];
  for (const k of keys) {
    if (patch[k] !== undefined) (payload as Record<string, unknown>)[k] = patch[k];
  }
  const { data, error } = await supabase
    .from("brains").update(payload).eq("id", id).select("*").single();
  if (error) throw error;
  await logBrainActivity(id, "brain.updated", {});
  return data;
}

export async function setBrainStatus(id: string, status: BrainStatus): Promise<BrainRow> {
  const { data, error } = await supabase
    .from("brains").update({ status }).eq("id", id).select("*").single();
  if (error) throw error;
  await logBrainActivity(id, `brain.status.${status}`, {});
  return data;
}

export async function deleteBrain(id: string): Promise<void> {
  const { error } = await supabase.from("brains").delete().eq("id", id);
  if (error) throw error;
}

export async function cloneBrain(id: string): Promise<BrainRow> {
  const src = await getBrain(id);
  const { data: user } = await supabase.auth.getUser();
  const uid = user.user?.id ?? null;
  const payload: Database["public"]["Tables"]["brains"]["Insert"] = {
    ...(toInsert({
      name: `${src.name} (Copy)`,
      description: src.description ?? "",
      category: src.category,
      tags: src.tags,
      status: "draft",
      visibility: src.visibility,
      mission: src.mission ?? "",
      goals: src.goals,
      success_definition: src.success_definition ?? "",
      expected_roi: src.expected_roi,
      tone: src.tone,
      decision_style: src.decision_style,
      creativity_level: src.creativity_level,
      risk_level: src.risk_level,
      response_depth: src.response_depth,
      always_do: src.always_do,
      never_do: src.never_do,
      escalation_rules: src.escalation_rules ?? "",
      approval_rules: src.approval_rules ?? "",
      session_memory_enabled: src.session_memory_enabled,
      long_term_memory_enabled: src.long_term_memory_enabled,
      context_window_tokens: src.context_window_tokens,
      memory_retention_days: src.memory_retention_days,
    }, uid)),
  };
  const { data, error } = await supabase.from("brains").insert(payload).select("*").single();
  if (error) throw error;
  await logBrainActivity(data.id, "brain.cloned", { source_id: src.id });
  await snapshotBrainVersion(data.id, `Cloned from ${src.name}`);
  return data;
}

export async function createBrainFromTemplate(templateId: string, name?: string): Promise<BrainRow> {
  const { data: tpl, error } = await supabase
    .from("brain_templates").select("*").eq("id", templateId).maybeSingle();
  if (error) throw error;
  if (!tpl) throw new Error("Template not found");
  const snap = (tpl.snapshot ?? {}) as Record<string, unknown>;
  const { data: user } = await supabase.auth.getUser();
  const uid = user.user?.id ?? null;
  const values: BrainFormValues = {
    name: name ?? tpl.name,
    description: tpl.description ?? "",
    category: tpl.category,
    tags: tpl.tags ?? [],
    status: "draft",
    visibility: "organization",
    mission: (snap.mission as string) ?? "",
    goals: (snap.goals as string[]) ?? [],
    success_definition: (snap.success_definition as string) ?? "",
    expected_roi: null,
    tone: (snap.tone as BrainFormValues["tone"]) ?? "friendly",
    decision_style: (snap.decision_style as BrainFormValues["decision_style"]) ?? "balanced",
    creativity_level: (snap.creativity_level as number) ?? 50,
    risk_level: (snap.risk_level as number) ?? 30,
    response_depth: (snap.response_depth as BrainFormValues["response_depth"]) ?? "standard",
    always_do: (snap.always_do as string[]) ?? [],
    never_do: (snap.never_do as string[]) ?? [],
    escalation_rules: (snap.escalation_rules as string) ?? "",
    approval_rules: (snap.approval_rules as string) ?? "",
    session_memory_enabled: true,
    long_term_memory_enabled: false,
    context_window_tokens: 8000,
    memory_retention_days: 30,
  };
  const insertPayload: Database["public"]["Tables"]["brains"]["Insert"] = {
    ...toInsert(values, uid),
    template_id: tpl.id,
  };
  const { data, error: insErr } = await supabase
    .from("brains").insert(insertPayload).select("*").single();
  if (insErr) throw insErr;
  await supabase.from("brain_templates").update({ usage_count: (tpl.usage_count ?? 0) + 1 }).eq("id", tpl.id);
  await logBrainActivity(data.id, "brain.from_template", { template_id: tpl.id });
  await snapshotBrainVersion(data.id, `Created from template: ${tpl.name}`);
  return data;
}

// ------------- Versions -------------
export async function snapshotBrainVersion(brainId: string, notes?: string): Promise<void> {
  const b = await getBrain(brainId);
  const { data: latest } = await supabase
    .from("brain_versions").select("version").eq("brain_id", brainId)
    .order("version", { ascending: false }).limit(1).maybeSingle();
  const next = (latest?.version ?? 0) + 1;
  const { data: user } = await supabase.auth.getUser();
  await supabase.from("brain_versions").insert({
    brain_id: brainId,
    version: next,
    status: b.status,
    snapshot: b as unknown as Database["public"]["Tables"]["brain_versions"]["Insert"]["snapshot"],
    notes: notes ?? null,
    created_by: user.user?.id ?? null,
  });
  await supabase.from("brains").update({ version: next }).eq("id", brainId);
  await logBrainActivity(brainId, "brain.version.snapshot", { version: next });
}

export async function listBrainVersions(brainId: string): Promise<BrainVersionRow[]> {
  const { data, error } = await supabase
    .from("brain_versions").select("*").eq("brain_id", brainId)
    .order("version", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function rollbackBrainVersion(brainId: string, versionId: string): Promise<void> {
  const { data: v, error } = await supabase
    .from("brain_versions").select("*").eq("id", versionId).maybeSingle();
  if (error) throw error;
  if (!v) throw new Error("Version not found");
  const snap = v.snapshot as unknown as BrainRow;
  await updateBrain(brainId, {
    name: snap.name, description: snap.description ?? "", category: snap.category,
    tags: snap.tags, mission: snap.mission ?? "", goals: snap.goals,
    success_definition: snap.success_definition ?? "", tone: snap.tone,
    decision_style: snap.decision_style, creativity_level: snap.creativity_level,
    risk_level: snap.risk_level, response_depth: snap.response_depth,
    always_do: snap.always_do, never_do: snap.never_do,
    escalation_rules: snap.escalation_rules ?? "", approval_rules: snap.approval_rules ?? "",
    session_memory_enabled: snap.session_memory_enabled,
    long_term_memory_enabled: snap.long_term_memory_enabled,
    context_window_tokens: snap.context_window_tokens,
    memory_retention_days: snap.memory_retention_days,
  });
  await logBrainActivity(brainId, "brain.rollback", { to_version: v.version });
  await snapshotBrainVersion(brainId, `Rolled back to v${v.version}`);
}

// ------------- Activity -------------
export async function logBrainActivity(
  brainId: string,
  action: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  await supabase.from("brain_activity").insert({
    brain_id: brainId,
    action,
    metadata: metadata as unknown as Database["public"]["Tables"]["brain_activity"]["Insert"]["metadata"],
    user_id: user.user?.id ?? null,
  });
}

export async function listBrainActivity(brainId: string): Promise<BrainActivityRow[]> {
  const { data, error } = await supabase
    .from("brain_activity").select("*").eq("brain_id", brainId)
    .order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  return data ?? [];
}

// ------------- Assignments -------------
export async function attachKnowledge(brainId: string, knowledgeId: string) {
  const { error } = await supabase
    .from("brain_knowledge").insert({ brain_id: brainId, knowledge_id: knowledgeId });
  if (error) throw error;
  await logBrainActivity(brainId, "brain.knowledge.attached", { knowledge_id: knowledgeId });
}
export async function detachKnowledge(brainId: string, knowledgeId: string) {
  const { error } = await supabase
    .from("brain_knowledge").delete()
    .eq("brain_id", brainId).eq("knowledge_id", knowledgeId);
  if (error) throw error;
  await logBrainActivity(brainId, "brain.knowledge.detached", { knowledge_id: knowledgeId });
}
export async function attachSkill(brainId: string, skillId: string) {
  const { error } = await supabase.from("brain_skills").insert({ brain_id: brainId, skill_id: skillId });
  if (error) throw error;
  await logBrainActivity(brainId, "brain.skill.attached", { skill_id: skillId });
}
export async function detachSkill(brainId: string, skillId: string) {
  const { error } = await supabase
    .from("brain_skills").delete().eq("brain_id", brainId).eq("skill_id", skillId);
  if (error) throw error;
  await logBrainActivity(brainId, "brain.skill.detached", { skill_id: skillId });
}
export async function attachTool(brainId: string, toolId: string, permissions: string[] = []) {
  const { error } = await supabase
    .from("brain_tools").insert({ brain_id: brainId, tool_id: toolId, permissions });
  if (error) throw error;
  await logBrainActivity(brainId, "brain.tool.attached", { tool_id: toolId });
}
export async function detachTool(brainId: string, toolId: string) {
  const { error } = await supabase
    .from("brain_tools").delete().eq("brain_id", brainId).eq("tool_id", toolId);
  if (error) throw error;
  await logBrainActivity(brainId, "brain.tool.detached", { tool_id: toolId });
}
export async function assignBrainToEmployee(brainId: string, employeeId: string) {
  const { error } = await supabase.from("brain_assignments").insert({
    brain_id: brainId, target_type: "employee", employee_id: employeeId,
  });
  if (error) throw error;
  await logBrainActivity(brainId, "brain.assigned.employee", { employee_id: employeeId });
}
export async function assignBrainToWorkflow(brainId: string, workflowId: string) {
  const { error } = await supabase.from("brain_assignments").insert({
    brain_id: brainId, target_type: "workflow", workflow_id: workflowId,
  });
  if (error) throw error;
  await logBrainActivity(brainId, "brain.assigned.workflow", { workflow_id: workflowId });
}
export async function removeBrainAssignment(assignmentId: string) {
  const { error } = await supabase.from("brain_assignments").delete().eq("id", assignmentId);
  if (error) throw error;
}

// ------------- Analytics -------------
export async function listBrainAnalytics(brainId: string, days = 30): Promise<BrainAnalyticsRow[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data, error } = await supabase
    .from("brain_analytics_daily").select("*")
    .eq("brain_id", brainId)
    .gte("day", since.toISOString().slice(0, 10))
    .order("day", { ascending: true });
  if (error) throw error;
  return data ?? [];
}