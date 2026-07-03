import type { Database } from "@/integrations/supabase/types";

export type EmploymentType = Database["public"]["Enums"]["employment_type"];
export type EmployeeStatus = Database["public"]["Enums"]["employee_status"];
export type EmployeeKind = Database["public"]["Enums"]["employee_kind"];

export const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "intern", label: "Intern" },
  { value: "consultant", label: "Consultant" },
];

export const EMPLOYEE_STATUSES: {
  value: EmployeeStatus;
  label: string;
  tone: "success" | "warning" | "muted" | "destructive";
}[] = [
  { value: "active", label: "Active", tone: "success" },
  { value: "on_leave", label: "On leave", tone: "warning" },
  { value: "inactive", label: "Inactive", tone: "muted" },
  { value: "archived", label: "Archived", tone: "destructive" },
];

export const EMPLOYEE_KINDS: { value: EmployeeKind; label: string }[] = [
  { value: "human", label: "Human" },
  { value: "ai", label: "AI" },
];

export function labelFor<T extends { value: string; label: string }>(
  items: T[],
  value: string | null | undefined,
): string {
  if (!value) return "—";
  return items.find((i) => i.value === value)?.label ?? value;
}

export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const min = 60_000, hr = 60 * min, day = 24 * hr;
  if (diff < min) return "just now";
  if (diff < hr) return `${Math.floor(diff / min)}m ago`;
  if (diff < day) return `${Math.floor(diff / hr)}h ago`;
  if (diff < 30 * day) return `${Math.floor(diff / day)}d ago`;
  return new Date(iso).toLocaleDateString();
}