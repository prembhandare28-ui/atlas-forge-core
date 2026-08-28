/**
 * ATLAS autonomous mission contracts (client-safe).
 * Mirrors the persisted `mission_runs` / `mission_run_steps` model.
 */
import type { Database } from "@/integrations/supabase/types";

export type AtlasMissionStatus = Database["public"]["Enums"]["mission_run_status"];
export type AtlasStepStatus = Database["public"]["Enums"]["mission_step_status"];
export type AtlasExecutorKind = Database["public"]["Enums"]["mission_executor_kind"];

export type AtlasMissionRow = Database["public"]["Tables"]["mission_runs"]["Row"];
export type AtlasStepRow = Database["public"]["Tables"]["mission_run_steps"]["Row"];
export type AtlasEventRow = Database["public"]["Tables"]["mission_run_events"]["Row"];
export type AtlasMessageRow = Database["public"]["Tables"]["mission_run_messages"]["Row"];

export interface AtlasMissionDetail {
  readonly mission: AtlasMissionRow;
  readonly steps: readonly AtlasStepRow[];
  readonly events: readonly AtlasEventRow[];
  readonly messages: readonly AtlasMessageRow[];
}

export interface AtlasHighlight {
  readonly label: string;
  readonly value: string;
}

/** Shape Atlas writes into `mission_runs.result`. */
export interface AtlasMissionResult {
  readonly headline?: string;
  readonly highlights?: readonly AtlasHighlight[];
  readonly details?: string;
  readonly recommended_next_action?: string;
}

export const ATLAS_MISSION_STATUS_LABELS: Readonly<Record<AtlasMissionStatus, string>> = {
  planning: "Planning",
  ready: "Ready",
  running: "Running",
  waiting_for_human: "Needs a human",
  waiting_for_approval: "Needs your approval",
  blocked: "Blocked",
  failed: "Failed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const ATLAS_STEP_STATUS_LABELS: Readonly<Record<AtlasStepStatus, string>> = {
  pending: "Pending",
  running: "Running",
  waiting_for_human: "Waiting for a human",
  waiting_for_approval: "Waiting for approval",
  blocked: "Blocked",
  failed: "Failed",
  skipped: "Skipped",
  completed: "Done",
};

export const ATLAS_EXECUTOR_LABELS: Readonly<Record<AtlasExecutorKind, string>> = {
  ai_brain: "AI Brain",
  skill: "Skill",
  tool: "Tool",
  workflow: "Workflow",
  employee: "Employee",
  human: "Human",
  system: "Atlas",
};

export type AtlasTone = "neutral" | "primary" | "success" | "warning" | "danger";

export const ATLAS_MISSION_TONES: Readonly<Record<AtlasMissionStatus, AtlasTone>> = {
  planning: "primary",
  ready: "neutral",
  running: "primary",
  waiting_for_human: "warning",
  waiting_for_approval: "warning",
  blocked: "danger",
  failed: "danger",
  completed: "success",
  cancelled: "neutral",
};

export const ATLAS_TONE_CLASSES: Readonly<Record<AtlasTone, string>> = {
  neutral: "border-border bg-muted text-muted-foreground",
  primary: "border-primary/30 bg-primary/10 text-primary",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-500",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function isMissionSettled(status: AtlasMissionStatus): boolean {
  return status === "completed" || status === "failed" || status === "cancelled";
}

export function isMissionWaiting(status: AtlasMissionStatus): boolean {
  return (
    status === "waiting_for_approval" || status === "waiting_for_human" || status === "blocked"
  );
}
