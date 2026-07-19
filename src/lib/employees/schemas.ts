import { z } from "zod";

export const employeeStep1Schema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(120, "Name is too long"),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(254),
  phone: z
    .string()
    .trim()
    .max(40, "Phone is too long")
    .optional()
    .or(z.literal("")),
  avatar_url: z.string().url().nullable().optional(),
  kind: z.enum(["human", "ai", "hybrid"]).default("human"),
  status: z.enum(["active", "on_leave", "inactive", "archived"]).default("active"),
});

export const employeeStep2Schema = z.object({
  department_id: z.string().uuid().nullable().optional(),
  role_title: z.string().trim().max(120).optional().or(z.literal("")),
  manager_id: z.string().uuid().nullable().optional(),
  employment_type: z.enum(["full_time", "part_time", "contract", "intern", "consultant"]),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  timezone: z.string().trim().max(80).optional().or(z.literal("")),
});

export const employeeStep3Schema = z.object({
  responsibilities: z.string().trim().max(2000).optional().or(z.literal("")),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  skills: z.array(z.string().trim().min(1).max(40)).max(30),
  kpis: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(80),
        target: z.string().trim().max(80).optional().or(z.literal("")),
      }),
    )
    .max(10),
  experience_level: z
    .enum(["junior", "mid", "senior", "lead", "principal"])
    .nullable()
    .optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const employeeStep4Schema = z.object({
  revenue_goal: z.number().nonnegative().max(1_000_000_000).nullable().optional(),
  expected_roi: z.number().min(-100).max(100_000).nullable().optional(),
  cost_center: z.string().trim().max(80).optional().or(z.literal("")),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  revenue_category: z
    .enum(["sales", "marketing", "support", "operations", "research", "custom"])
    .nullable()
    .optional(),
  revenue_category_custom: z.string().trim().max(80).optional().or(z.literal("")),
});

export const employeeFormSchema = employeeStep1Schema
  .merge(employeeStep2Schema)
  .merge(employeeStep3Schema)
  .merge(employeeStep4Schema);

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export const employeeUpdateSchema = employeeFormSchema.partial();
export type EmployeeUpdateValues = z.infer<typeof employeeUpdateSchema>;

export const departmentSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(400).optional().or(z.literal("")),
});
export type DepartmentFormValues = z.infer<typeof departmentSchema>;