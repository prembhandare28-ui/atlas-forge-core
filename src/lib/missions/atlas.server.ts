/**
 * ATLAS autonomous mission runtime (server only).
 *
 * Real execution: every step either runs against a real capability
 * (database read, AI brain/skill via the Lovable AI gateway) or is honestly
 * marked as blocked / needing a human. There is no simulated progress.
 *
 * All database access goes through the caller's RLS-scoped client, so a
 * mission can never touch another owner's workforce, knowledge or results.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import type { AtlasExecutorKind, AtlasMissionResult } from "./atlas-types";

export type Sb = SupabaseClient<Database>;

const AI_ENDPOINT = "https://ai.gateway.lovable.dev/v1/chat/completions";
const PLANNER_MODEL = "google/gemini-2.5-flash";
const MAX_STEP_ATTEMPTS = 2;

/* ------------------------------------------------------------------ AI ---- */

interface AiMessage {
  readonly role: "system" | "user" | "assistant";
  readonly content: string;
}

async function callAi(messages: readonly AiMessage[], temperature = 0.3): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("The AI capability is not connected for this project.");

  const response = await fetch(AI_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: PLANNER_MODEL, temperature, messages }),
  });

  if (response.status === 429) throw new Error("AI rate limit reached. Try again shortly.");
  if (response.status === 402) throw new Error("AI credits are exhausted for this workspace.");
  if (!response.ok) throw new Error(`AI gateway error (${response.status})`);

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("The AI returned an empty response.");
  return content;
}

function parseJsonBlock<T>(raw: string): T {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced?.[1] ?? raw).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  const slice = start >= 0 && end > start ? candidate.slice(start, end + 1) : candidate;
  return JSON.parse(slice) as T;
}

/* -------------------------------------------------------- capabilities ---- */

export interface Capability {
  readonly kind: AtlasExecutorKind;
  readonly id: string | null;
  readonly label: string;
  readonly description: string;
  readonly available: boolean;
}

/** Atlas-native capabilities that always execute for real. */
const SYSTEM_CAPABILITIES: readonly Capability[] = [
  {
    kind: "system",
    id: null,
    label: "atlas.workforce_data",
    description:
      "Reads live workforce data from this workspace: employees (human/AI/hybrid), departments, statuses, revenue goals, workflows and brains. Use whenever a step needs real internal figures.",
    available: true,
  },
  {
    kind: "system",
    id: null,
    label: "atlas.reasoning",
    description:
      "Atlas reasoning: analyses, compares, summarises, drafts and structures information using the outputs of previous steps and workspace knowledge. Produces text artifacts only.",
    available: true,
  },
];

export interface CapabilityCatalog {
  readonly capabilities: readonly Capability[];
  readonly knowledge: readonly { id: string; name: string; category: string }[];
}

export async function loadCapabilities(supabase: Sb): Promise<CapabilityCatalog> {
  const [brains, skills, tools, workflows, employees, knowledge] = await Promise.all([
    supabase.from("brains").select("id, name, mission, category, status").limit(60),
    supabase.from("skills").select("id, name, description, category").limit(80),
    supabase
      .from("tools")
      .select("id, name, provider, description, status, runtime_ready")
      .limit(60),
    supabase.from("workflows").select("id, name, description, status").limit(60),
    supabase
      .from("employees")
      .select("id, full_name, role_title, kind, status")
      .eq("status", "active")
      .limit(60),
    supabase
      .from("knowledge_packs")
      .select("id, name, category, status")
      .eq("status", "active")
      .limit(40),
  ]);

  const capabilities: Capability[] = [...SYSTEM_CAPABILITIES];

  for (const brain of brains.data ?? []) {
    capabilities.push({
      kind: "ai_brain",
      id: brain.id,
      label: brain.name,
      description: `${brain.category} brain (${brain.status}). ${brain.mission ?? ""}`.trim(),
      available: brain.status !== "archived",
    });
  }
  for (const skill of skills.data ?? []) {
    capabilities.push({
      kind: "skill",
      id: skill.id,
      label: skill.name,
      description: `${skill.category} skill. ${skill.description ?? ""}`.trim(),
      available: true,
    });
  }
  for (const tool of tools.data ?? []) {
    capabilities.push({
      kind: "tool",
      id: tool.id,
      label: `${tool.name} (${tool.provider})`,
      description: `${tool.description ?? "External tool"} — ${
        tool.runtime_ready && tool.status === "active"
          ? "connected"
          : "NOT connected: cannot execute yet"
      }`,
      available: tool.runtime_ready && tool.status === "active",
    });
  }
  for (const workflow of workflows.data ?? []) {
    capabilities.push({
      kind: "workflow",
      id: workflow.id,
      label: workflow.name,
      description: `${workflow.description ?? "Workflow"} (${workflow.status}) — requires a human operator to run.`,
      available: false,
    });
  }
  for (const employee of employees.data ?? []) {
    capabilities.push({
      kind: employee.kind === "human" ? "employee" : "ai_brain",
      id: employee.id,
      label: employee.full_name,
      description: `${employee.role_title ?? "Team member"} (${employee.kind}) — human work is handed off, not automated.`,
      available: false,
    });
  }

  return {
    capabilities,
    knowledge: (knowledge.data ?? []).map((pack) => ({
      id: pack.id,
      name: pack.name,
      category: pack.category,
    })),
  };
}

/* ------------------------------------------------------------ planning ---- */

interface PlannedStep {
  title?: string;
  description?: string;
  executor_kind?: string;
  executor_label?: string;
  executor_id?: string | null;
  instruction?: string;
  requires_approval?: boolean;
  capability_available?: boolean;
  blocked_reason?: string;
}

interface PlannerOutput {
  title?: string;
  objective?: string;
  desired_outcome?: string;
  constraints?: string[];
  success_criteria?: string[];
  priority?: string;
  needs_clarification?: boolean;
  clarification_question?: string;
  plan_rationale?: string;
  steps?: PlannedStep[];
}

const EXECUTOR_KINDS: readonly AtlasExecutorKind[] = [
  "ai_brain",
  "skill",
  "tool",
  "workflow",
  "employee",
  "human",
  "system",
];

const PRIORITIES = ["low", "medium", "high", "critical"] as const;

function plannerPrompt(catalog: CapabilityCatalog): string {
  const lines = catalog.capabilities.map(
    (capability) =>
      `- kind=${capability.kind} | id=${capability.id ?? "null"} | label="${capability.label}" | available=${capability.available} | ${capability.description}`,
  );
  return `You are ATLAS, an autonomous business operations planner.
Turn the user's natural-language business intent into a small, honest execution plan.

AVAILABLE CAPABILITIES (the ONLY things that can execute):
${lines.join("\n")}
KNOWLEDGE PACKS: ${catalog.knowledge.map((k) => k.name).join(", ") || "none"}

RULES
1. Never invent a capability. executor_id must be copied exactly from the list or be null.
2. Steps that need external systems (email, CRM, web scraping, payments, publishing) must set capability_available=false and explain blocked_reason honestly.
3. Steps that only a person can do use executor_kind "human" with capability_available=false.
4. Set requires_approval=true for external communication, financial operations, destructive data changes, publishing, or changes to important customer records.
5. Prefer executor_kind "system" with executor_label "atlas.workforce_data" for real internal figures, and "atlas.reasoning" for analysis/drafting/summarising.
6. Keep plans between 2 and 6 steps. Each instruction must be self-contained and actionable.
7. If an essential detail is missing that changes what would be produced, set needs_clarification=true and ask ONE short question. Do not ask about details you can reasonably decide.

Return ONLY JSON:
{"title":string,"objective":string,"desired_outcome":string,"constraints":string[],"success_criteria":string[],"priority":"low"|"medium"|"high"|"critical","needs_clarification":boolean,"clarification_question":string|null,"plan_rationale":string,"steps":[{"title":string,"description":string,"executor_kind":"ai_brain"|"skill"|"tool"|"workflow"|"employee"|"human"|"system","executor_id":string|null,"executor_label":string,"instruction":string,"requires_approval":boolean,"capability_available":boolean,"blocked_reason":string|null}]}`;
}

export interface PlanResult {
  readonly missionId: string;
  readonly needsClarification: boolean;
  readonly clarificationQuestion?: string;
}

/** Understands the intent, generates a plan and persists mission + steps. */
export async function planMission(
  supabase: Sb,
  userId: string,
  intent: string,
  context?: string,
): Promise<PlanResult> {
  const catalog = await loadCapabilities(supabase);
  const raw = await callAi([
    { role: "system", content: plannerPrompt(catalog) },
    {
      role: "user",
      content: context ? `Mission: ${intent}\n\nAdditional context: ${context}` : `Mission: ${intent}`,
    },
  ]);
  const plan = parseJsonBlock<PlannerOutput>(raw);

  const known = new Map(
    catalog.capabilities.filter((c) => c.id).map((c) => [c.id as string, c] as const),
  );
  const priority = PRIORITIES.includes((plan.priority ?? "") as (typeof PRIORITIES)[number])
    ? (plan.priority as (typeof PRIORITIES)[number])
    : "medium";
  const needsClarification = Boolean(plan.needs_clarification && plan.clarification_question);

  const { data: mission, error } = await supabase
    .from("mission_runs")
    .insert({
      intent_text: intent,
      title: (plan.title ?? intent).slice(0, 160),
      objective: plan.objective ?? null,
      desired_outcome: plan.desired_outcome ?? null,
      constraints: (plan.constraints ?? []) as unknown as Json,
      success_criteria: (plan.success_criteria ?? []) as unknown as Json,
      priority,
      status: needsClarification ? "planning" : "ready",
      clarification_question: needsClarification ? (plan.clarification_question ?? null) : null,
      plan_rationale: plan.plan_rationale ?? null,
      current_action: needsClarification ? "Waiting for your answer" : "Plan ready",
      created_by: userId,
    })
    .select("id")
    .single();
  if (error || !mission) throw new Error(error?.message ?? "Could not save the mission.");

  const steps = (plan.steps ?? []).slice(0, 8).map((step, index) => {
    const kind = (
      EXECUTOR_KINDS.includes((step.executor_kind ?? "") as AtlasExecutorKind)
        ? step.executor_kind
        : "system"
    ) as AtlasExecutorKind;
    const capability = step.executor_id ? known.get(step.executor_id) : undefined;
    const available =
      kind === "system"
        ? true
        : step.executor_id
          ? Boolean(capability?.available)
          : step.capability_available !== false && (kind === "ai_brain" || kind === "skill")
            ? false
            : false;
    return {
      mission_id: mission.id,
      order_index: index,
      title: step.title ?? `Step ${index + 1}`,
      description: step.blocked_reason && !available ? step.blocked_reason : (step.description ?? null),
      executor_kind: kind,
      executor_id: capability ? step.executor_id : null,
      executor_label: capability?.label ?? step.executor_label ?? "Atlas",
      capability_available: available,
      requires_approval: Boolean(step.requires_approval),
      instruction: step.instruction ?? step.description ?? step.title ?? "",
      status: "pending" as const,
    };
  });

  if (steps.length) {
    const { error: stepError } = await supabase.from("mission_run_steps").insert(steps);
    if (stepError) throw new Error(stepError.message);
  }

  await logEvent(supabase, mission.id, null, "mission.planned", "Atlas generated an execution plan.", {
    steps: steps.length,
  });
  if (needsClarification) {
    await addMessage(supabase, mission.id, "atlas", plan.clarification_question ?? "", userId);
  }

  return {
    missionId: mission.id,
    needsClarification,
    ...(needsClarification ? { clarificationQuestion: plan.clarification_question ?? "" } : {}),
  };
}

/* --------------------------------------------------------------- audit ---- */

export async function logEvent(
  supabase: Sb,
  missionId: string,
  stepId: string | null,
  kind: string,
  message: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await supabase.from("mission_run_events").insert({
    mission_id: missionId,
    step_id: stepId,
    kind,
    message,
    metadata: metadata as unknown as Json,
  });
}

export async function addMessage(
  supabase: Sb,
  missionId: string,
  role: "user" | "atlas",
  content: string,
  userId?: string,
): Promise<void> {
  await supabase.from("mission_run_messages").insert({
    mission_id: missionId,
    role,
    content,
    created_by: userId ?? null,
  });
}

/* ----------------------------------------------------------- executors ---- */

interface StepRow {
  id: string;
  order_index: number;
  title: string;
  description: string | null;
  executor_kind: AtlasExecutorKind;
  executor_id: string | null;
  executor_label: string | null;
  capability_available: boolean;
  requires_approval: boolean;
  status: Database["public"]["Enums"]["mission_step_status"];
  instruction: string | null;
  input: Json;
  output: Json | null;
  retry_count: number;
}

const STEP_COLUMNS =
  "id, order_index, title, description, executor_kind, executor_id, executor_label, capability_available, requires_approval, status, instruction, input, output, retry_count";

/** Real workforce read — no invented numbers. */
async function runWorkforceData(supabase: Sb): Promise<Record<string, unknown>> {
  const [employees, departments, workflows, brains] = await Promise.all([
    supabase
      .from("employees")
      .select("kind, status, revenue_goal, expected_roi, department_id, role_title, priority"),
    supabase.from("departments").select("id, name"),
    supabase.from("workflows").select("id, status, execution_count"),
    supabase.from("brains").select("id, status, category"),
  ]);
  const rows = employees.data ?? [];
  const byName = new Map((departments.data ?? []).map((d) => [d.id, d.name] as const));
  const byDepartment: Record<string, number> = {};
  for (const row of rows) {
    const name = row.department_id ? (byName.get(row.department_id) ?? "Unassigned") : "Unassigned";
    byDepartment[name] = (byDepartment[name] ?? 0) + 1;
  }
  const sum = (key: "revenue_goal" | "expected_roi") =>
    rows.reduce((total, row) => total + Number(row[key] ?? 0), 0);

  return {
    source: "workspace database (live)",
    employees_total: rows.length,
    employees_active: rows.filter((r) => r.status === "active").length,
    employees_by_kind: {
      human: rows.filter((r) => r.kind === "human").length,
      ai: rows.filter((r) => r.kind === "ai").length,
      hybrid: rows.filter((r) => r.kind === "hybrid").length,
    },
    employees_by_department: byDepartment,
    revenue_goal_total: sum("revenue_goal"),
    expected_roi_total: sum("expected_roi"),
    workflows_total: (workflows.data ?? []).length,
    workflows_active: (workflows.data ?? []).filter((w) => w.status === "active").length,
    workflow_executions: (workflows.data ?? []).reduce(
      (total, w) => total + (w.execution_count ?? 0),
      0,
    ),
    brains_total: (brains.data ?? []).length,
    brains_published: (brains.data ?? []).filter(
      (b) => b.status === "published" || b.status === "stable",
    ).length,
    read_at: new Date().toISOString(),
  };
}

interface MissionRecord {
  id: string;
  intent_text: string;
  objective: string | null;
  desired_outcome: string | null;
  success_criteria: Json;
  constraints: Json;
  metadata: Json;
  status: Database["public"]["Enums"]["mission_run_status"];
}

async function brainPersona(supabase: Sb, brainId: string | null): Promise<string> {
  if (!brainId) return "";
  const { data } = await supabase
    .from("brains")
    .select("name, mission, tone, decision_style, response_depth, always_do, never_do")
    .eq("id", brainId)
    .maybeSingle();
  if (!data) return "";
  return `You are acting as the "${data.name}" AI brain.
Mission: ${data.mission ?? "not specified"}
Tone: ${data.tone}. Decision style: ${data.decision_style}. Response depth: ${data.response_depth}.
Always: ${(data.always_do ?? []).join("; ") || "n/a"}
Never: ${(data.never_do ?? []).join("; ") || "n/a"}`;
}

async function knowledgeContext(supabase: Sb): Promise<string> {
  const { data } = await supabase
    .from("knowledge_packs")
    .select("name, description, content")
    .eq("status", "active")
    .limit(4);
  if (!data?.length) return "";
  return data
    .map((pack) => `# ${pack.name}\n${(pack.content ?? pack.description ?? "").slice(0, 2000)}`)
    .join("\n\n");
}

/** AI execution for brain / skill / reasoning steps. Produces real content. */
async function runAiStep(
  supabase: Sb,
  mission: MissionRecord,
  step: StepRow,
  priorOutputs: readonly { title: string; output: Json | null }[],
): Promise<Record<string, unknown>> {
  const persona = step.executor_kind === "ai_brain" ? await brainPersona(supabase, step.executor_id) : "";
  const knowledge = await knowledgeContext(supabase);
  const priorText = priorOutputs
    .map((prior) => `### ${prior.title}\n${JSON.stringify(prior.output).slice(0, 4000)}`)
    .join("\n\n");

  const content = await callAi([
    {
      role: "system",
      content: `${persona || "You are ATLAS, an autonomous business operations executor."}
Execute exactly one step of a mission. Ground every statement in the data supplied below.
If the data needed for a claim is not present, state plainly that it is unavailable instead of inventing it.
Return ONLY JSON: {"output":string,"facts_used":string[],"data_gaps":string[]}`,
    },
    {
      role: "user",
      content: `MISSION: ${mission.intent_text}
OBJECTIVE: ${mission.objective ?? "n/a"}
DESIRED OUTCOME: ${mission.desired_outcome ?? "n/a"}
CONSTRAINTS: ${JSON.stringify(mission.constraints)}

STEP: ${step.title}
INSTRUCTION: ${step.instruction ?? step.description ?? step.title}

RESULTS OF PREVIOUS STEPS:
${priorText || "none"}

WORKSPACE KNOWLEDGE:
${knowledge || "none"}`,
    },
  ]);

  const parsed = parseJsonBlock<{ output?: string; facts_used?: string[]; data_gaps?: string[] }>(
    content,
  );
  return {
    kind: step.executor_kind === "ai_brain" ? "ai_brain" : "atlas_reasoning",
    executor: step.executor_label ?? "Atlas",
    output: parsed.output ?? content,
    facts_used: parsed.facts_used ?? [],
    data_gaps: parsed.data_gaps ?? [],
    produced_at: new Date().toISOString(),
  };
}

/* --------------------------------------------------------- orchestrator --- */

interface StopReason {
  readonly status: Database["public"]["Enums"]["mission_run_status"];
  readonly action: string;
  readonly error?: string;
}

async function setMission(
  supabase: Sb,
  missionId: string,
  patch: Partial<Database["public"]["Tables"]["mission_runs"]["Update"]>,
): Promise<void> {
  await supabase.from("mission_runs").update(patch).eq("id", missionId);
}

/**
 * Drives the mission forward until it completes or must stop.
 * Safe to call repeatedly (after approvals, human handoffs, retries).
 */
export async function advanceMission(supabase: Sb, missionId: string): Promise<void> {
  const { data: mission, error } = await supabase
    .from("mission_runs")
    .select("id, intent_text, objective, desired_outcome, success_criteria, constraints, metadata, status")
    .eq("id", missionId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!mission) throw new Error("Mission not found.");
  if (mission.status === "cancelled" || mission.status === "completed") return;

  const { data: allSteps } = await supabase
    .from("mission_run_steps")
    .select(STEP_COLUMNS)
    .eq("mission_id", missionId)
    .order("order_index");
  const steps = (allSteps ?? []) as StepRow[];
  if (!steps.length) {
    await setMission(supabase, missionId, {
      status: "blocked",
      current_action: "No executable plan",
      error: "Atlas could not build an executable plan for this mission.",
    });
    return;
  }

  await setMission(supabase, missionId, {
    status: "running",
    started_at: new Date().toISOString(),
    error: null,
    current_action: "Executing",
  });

  const done: { title: string; output: Json | null }[] = steps
    .filter((step) => step.status === "completed")
    .map((step) => ({ title: step.title, output: step.output }));
  let stop: StopReason | undefined;

  for (const step of steps) {
    if (step.status === "completed" || step.status === "skipped") continue;

    const approved =
      typeof step.input === "object" && step.input !== null && !Array.isArray(step.input)
        ? (step.input as Record<string, unknown>)["approved"] === true
        : false;

    if (step.requires_approval && !approved) {
      await supabase
        .from("mission_run_steps")
        .update({ status: "waiting_for_approval" })
        .eq("id", step.id);
      await logEvent(
        supabase,
        missionId,
        step.id,
        "step.approval_required",
        `Atlas needs your approval to: ${step.title}`,
      );
      stop = { status: "waiting_for_approval", action: `Approval required: ${step.title}` };
      break;
    }

    const isAi =
      step.executor_kind === "ai_brain" ||
      step.executor_kind === "skill" ||
      (step.executor_kind === "system" && step.executor_label !== "atlas.workforce_data");
    const isData = step.executor_kind === "system" && step.executor_label === "atlas.workforce_data";
    const executable = (isAi || isData) && step.capability_available !== false;

    if (!executable) {
      const handoff =
        step.executor_kind === "human" ||
        step.executor_kind === "employee" ||
        step.executor_kind === "workflow";
      await supabase
        .from("mission_run_steps")
        .update({ status: handoff ? "waiting_for_human" : "blocked" })
        .eq("id", step.id);
      const reason = handoff
        ? `This step requires human action: ${step.title}${
            step.executor_label ? ` (${step.executor_label})` : ""
          }.`
        : `Atlas can plan this step, but the required capability is not currently connected: ${
            step.executor_label ?? step.title
          }.`;
      await logEvent(
        supabase,
        missionId,
        step.id,
        handoff ? "step.human_required" : "step.capability_missing",
        reason,
      );
      stop = {
        status: handoff ? "waiting_for_human" : "blocked",
        action: step.title,
        error: reason,
      };
      break;
    }

    await supabase
      .from("mission_run_steps")
      .update({ status: "running", started_at: new Date().toISOString(), error: null })
      .eq("id", step.id);
    await setMission(supabase, missionId, { current_action: step.title });
    await logEvent(supabase, missionId, step.id, "step.started", `Started: ${step.title}`);

    let output: Record<string, unknown> | undefined;
    let lastError = "";
    for (let attempt = step.retry_count; attempt < MAX_STEP_ATTEMPTS; attempt += 1) {
      try {
        output = isData
          ? await runWorkforceData(supabase)
          : await runAiStep(supabase, mission as MissionRecord, step, done);
        break;
      } catch (cause) {
        lastError = cause instanceof Error ? cause.message : String(cause);
        await supabase
          .from("mission_run_steps")
          .update({ retry_count: attempt + 1, error: lastError })
          .eq("id", step.id);
        await logEvent(
          supabase,
          missionId,
          step.id,
          "step.retry",
          `Attempt ${attempt + 1} failed: ${lastError}`,
        );
      }
    }

    if (!output) {
      await supabase.from("mission_run_steps").update({ status: "failed" }).eq("id", step.id);
      stop = {
        status: "blocked",
        action: step.title,
        error: `Atlas tried "${step.title}" ${MAX_STEP_ATTEMPTS} times and it kept failing: ${lastError}. No approved alternative capability is available, so the mission is blocked until you resolve this.`,
      };
      await logEvent(supabase, missionId, step.id, "step.failed", stop.error ?? "Step failed");
      break;
    }

    await supabase
      .from("mission_run_steps")
      .update({
        status: "completed",
        output: output as unknown as Json,
        completed_at: new Date().toISOString(),
        error: null,
      })
      .eq("id", step.id);
    await logEvent(supabase, missionId, step.id, "step.completed", `Completed: ${step.title}`);
    done.push({ title: step.title, output: output as unknown as Json });
    await setMission(supabase, missionId, { progress_percent: progressOf(steps, done.length) });
  }

  if (stop) {
    await setMission(supabase, missionId, {
      status: stop.status,
      current_action: stop.action,
      error: stop.error ?? null,
      progress_percent: progressOf(steps, done.length),
    });
    return;
  }

  await verifyMission(supabase, missionId, mission as MissionRecord, done);
}

function progressOf(steps: readonly StepRow[], completed: number): number {
  if (!steps.length) return 0;
  return Math.min(99, Math.round((completed / steps.length) * 100));
}

/** A mission only completes when the intended outcome is verified. */
async function verifyMission(
  supabase: Sb,
  missionId: string,
  mission: MissionRecord,
  outputs: readonly { title: string; output: Json | null }[],
): Promise<void> {
  await setMission(supabase, missionId, { current_action: "Verifying the outcome" });

  const raw = await callAi([
    {
      role: "system",
      content: `You are ATLAS verifying whether a mission's intended outcome was actually achieved.
Judge strictly against the success criteria and the real step outputs. Do not accept "steps ran" as success.
Return ONLY JSON: {"verified":boolean,"missing":string[],"headline":string,"highlights":[{"label":string,"value":string}],"details":string,"recommended_next_action":string,"summary":string}
Every highlight value must be supported by the step outputs. Omit highlights you cannot support.`,
    },
    {
      role: "user",
      content: `MISSION: ${mission.intent_text}
DESIRED OUTCOME: ${mission.desired_outcome ?? "n/a"}
SUCCESS CRITERIA: ${JSON.stringify(mission.success_criteria)}

STEP OUTPUTS:
${outputs.map((o) => `### ${o.title}\n${JSON.stringify(o.output).slice(0, 5000)}`).join("\n\n")}`,
    },
  ]);

  const verdict = parseJsonBlock<{
    verified?: boolean;
    missing?: string[];
    headline?: string;
    highlights?: { label: string; value: string }[];
    details?: string;
    recommended_next_action?: string;
    summary?: string;
  }>(raw);

  const result: AtlasMissionResult = {
    ...(verdict.headline ? { headline: verdict.headline } : {}),
    highlights: verdict.highlights ?? [],
    ...(verdict.details ? { details: verdict.details } : {}),
    ...(verdict.recommended_next_action
      ? { recommended_next_action: verdict.recommended_next_action }
      : {}),
  };

  const verified = verdict.verified === true;
  await setMission(supabase, missionId, {
    status: verified ? "completed" : "blocked",
    progress_percent: verified ? 100 : 90,
    current_action: verified ? "Completed" : "Outcome could not be verified",
    result: result as unknown as Json,
    summary: verdict.summary ?? verdict.headline ?? null,
    verification: {
      verified,
      missing: verdict.missing ?? [],
      checked_at: new Date().toISOString(),
    } as unknown as Json,
    error: verified ? null : `Verification failed: ${(verdict.missing ?? []).join("; ") || "the intended outcome is not evidenced by the results."}`,
    completed_at: verified ? new Date().toISOString() : null,
  });

  await logEvent(
    supabase,
    missionId,
    null,
    verified ? "mission.completed" : "mission.verification_failed",
    verified
      ? `Verified and completed: ${verdict.headline ?? "outcome achieved"}`
      : `Verification failed: ${(verdict.missing ?? []).join("; ")}`,
  );
  await addMessage(
    supabase,
    missionId,
    "atlas",
    verified
      ? (verdict.summary ?? verdict.headline ?? "Mission completed.")
      : `I ran the plan but could not verify the outcome. Missing: ${(verdict.missing ?? []).join("; ") || "unclear"}.`,
  );
}

/* ------------------------------------------------- conversational control -- */

export type MissionCommand =
  | "start"
  | "pause"
  | "continue"
  | "cancel"
  | "status"
  | "result"
  | "answer"
  | "unknown";

export async function interpretCommand(text: string): Promise<{ action: MissionCommand; reply: string }> {
  const raw = await callAi(
    [
      {
        role: "system",
        content: `Map a user's message about a running mission to one action.
Actions: start (begin/execute), pause, continue (resume/retry/keep going), cancel (stop/abort), status (what's happening), result (show me the result), answer (the user is answering a clarification or giving extra instructions), unknown.
Return ONLY JSON: {"action":"...","reply":"one short sentence confirming what you will do"}`,
      },
      { role: "user", content: text },
    ],
    0,
  );
  const parsed = parseJsonBlock<{ action?: MissionCommand; reply?: string }>(raw);
  return {
    action: parsed.action ?? "unknown",
    reply: parsed.reply ?? "Understood.",
  };
}
