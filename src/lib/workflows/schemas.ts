import { z } from "zod";

export const workflowStep1Schema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  department_id: z.string().uuid().nullable().optional(),
  category: z.enum([
    "sales",
    "marketing",
    "customer_success",
    "support",
    "operations",
    "finance",
    "hr",
    "research",
    "custom",
  ]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  owner_id: z.string().uuid().nullable().optional(),
});

export const workflowStep2Schema = z.object({
  trigger_type: z.enum([
    "manual",
    "schedule",
    "webhook",
    "crm_event",
    "email_event",
    "customer_event",
  ]),
  trigger_schedule: z.string().trim().max(120).optional().or(z.literal("")),
  trigger_notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const workflowStepItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  step_type: z.enum(["task", "approval", "decision", "notification", "delay", "integration"]),
  estimated_minutes: z.number().int().nonnegative().max(100_000).nullable().optional(),
  assigned_employee_id: z.string().uuid().nullable().optional(),
});
export type WorkflowStepItem = z.infer<typeof workflowStepItemSchema>;

export const workflowStep3Schema = z.object({
  steps: z.array(workflowStepItemSchema).min(1, "Add at least one step").max(50),
});

export const workflowFormSchema = workflowStep1Schema
  .merge(workflowStep2Schema)
  .merge(workflowStep3Schema)
  .extend({
    assignments: z.array(z.string().uuid()).max(50).optional(),
  });

export type WorkflowFormValues = z.infer<typeof workflowFormSchema>;

export const workflowUpdateSchema = workflowFormSchema.partial();
export type WorkflowUpdateValues = z.infer<typeof workflowUpdateSchema>;