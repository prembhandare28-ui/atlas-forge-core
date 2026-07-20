import type { Database } from "@/integrations/supabase/types";

export type WorkflowCategory = Database["public"]["Enums"]["workflow_category"];
export type WorkflowStatus = Database["public"]["Enums"]["workflow_status"];
export type WorkflowTriggerType = Database["public"]["Enums"]["workflow_trigger_type"];
export type WorkflowStepType = Database["public"]["Enums"]["workflow_step_type"];
export type WorkflowAssignmentRole = Database["public"]["Enums"]["workflow_assignment_role"];

export const WORKFLOW_CATEGORIES: { value: WorkflowCategory; label: string }[] = [
  { value: "sales", label: "Sales" },
  { value: "marketing", label: "Marketing" },
  { value: "customer_success", label: "Customer Success" },
  { value: "support", label: "Support" },
  { value: "operations", label: "Operations" },
  { value: "finance", label: "Finance" },
  { value: "hr", label: "HR" },
  { value: "research", label: "Research" },
  { value: "custom", label: "Custom" },
];

export const WORKFLOW_STATUSES: {
  value: WorkflowStatus;
  label: string;
  tone: "muted" | "success" | "warning" | "destructive";
}[] = [
  { value: "draft", label: "Draft", tone: "muted" },
  { value: "active", label: "Active", tone: "success" },
  { value: "paused", label: "Paused", tone: "warning" },
  { value: "archived", label: "Archived", tone: "destructive" },
];

export const WORKFLOW_TRIGGERS: {
  value: WorkflowTriggerType;
  label: string;
  description: string;
  future?: boolean;
}[] = [
  { value: "manual", label: "Manual", description: "Run on demand from the studio" },
  { value: "schedule", label: "Schedule", description: "Cron / recurring schedule" },
  { value: "webhook", label: "Webhook", description: "Triggered by an inbound HTTP call", future: true },
  { value: "crm_event", label: "CRM Event", description: "Deal, contact or pipeline events", future: true },
  { value: "email_event", label: "Email Event", description: "Inbound or transactional email", future: true },
  { value: "customer_event", label: "Customer Event", description: "Product / behavioral signal", future: true },
];

export const WORKFLOW_STEP_TYPES: {
  value: WorkflowStepType;
  label: string;
  description: string;
  future?: boolean;
}[] = [
  { value: "task", label: "Task", description: "Work an employee performs" },
  { value: "approval", label: "Approval", description: "Requires sign-off" },
  { value: "decision", label: "Decision", description: "Branches the flow" },
  { value: "notification", label: "Notification", description: "Sends an update" },
  { value: "delay", label: "Delay", description: "Waits before continuing" },
  { value: "integration", label: "Integration", description: "External system call", future: true },
];

export const WORKFLOW_ASSIGNMENT_ROLES: { value: WorkflowAssignmentRole; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "assignee", label: "Assignee" },
  { value: "reviewer", label: "Reviewer" },
];

export function workflowLabelFor<T extends { value: string; label: string }>(
  items: T[],
  value: string | null | undefined,
): string {
  if (!value) return "—";
  return items.find((i) => i.value === value)?.label ?? value;
}