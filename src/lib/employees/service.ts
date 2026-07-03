import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { EmployeeFormValues } from "./schemas";
import type { EmployeeKind, EmployeeStatus, EmploymentType } from "./constants";

export type EmployeeRow = Database["public"]["Tables"]["employees"]["Row"];
export type DepartmentRow = Database["public"]["Tables"]["departments"]["Row"];
export type AuditLogRow = Database["public"]["Tables"]["audit_logs"]["Row"];

export interface EmployeeWithRelations extends EmployeeRow {
  department: Pick<DepartmentRow, "id" | "name"> | null;
  manager: Pick<EmployeeRow, "id" | "full_name" | "employee_code"> | null;
}

export interface ListEmployeesParams {
  search?: string;
  departmentIds?: string[];
  managerIds?: string[];
  statuses?: EmployeeStatus[];
  employmentTypes?: EmploymentType[];
  kinds?: EmployeeKind[];
  page?: number;
  pageSize?: number;
  sort?: { column: "full_name" | "created_at" | "last_active_at" | "employee_code"; ascending: boolean };
}

export interface ListEmployeesResult {
  rows: EmployeeWithRelations[];
  total: number;
}

const EMPLOYEE_SELECT = `
  *,
  department:departments(id, name),
  manager:manager_id(id, full_name, employee_code)
` as const;

function emptyToNull<T extends string | undefined | null>(value: T): string | null {
  const v = (value ?? "").toString().trim();
  return v.length ? v : null;
}

export async function listEmployees(
  params: ListEmployeesParams = {},
): Promise<ListEmployeesResult> {
  const {
    search,
    departmentIds,
    managerIds,
    statuses,
    employmentTypes,
    kinds,
    page = 1,
    pageSize = 25,
    sort = { column: "created_at", ascending: false },
  } = params;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let q = supabase
    .from("employees")
    .select(EMPLOYEE_SELECT, { count: "exact" })
    .order(sort.column, { ascending: sort.ascending })
    .range(from, to);

  const term = search?.trim();
  if (term) {
    const escaped = term.replace(/[,%]/g, "");
    q = q.or(
      `full_name.ilike.%${escaped}%,email.ilike.%${escaped}%,employee_code.ilike.%${escaped}%,role_title.ilike.%${escaped}%`,
    );
  }
  if (departmentIds?.length) q = q.in("department_id", departmentIds);
  if (managerIds?.length) q = q.in("manager_id", managerIds);
  if (statuses?.length) q = q.in("status", statuses);
  if (employmentTypes?.length) q = q.in("employment_type", employmentTypes);
  if (kinds?.length) q = q.in("kind", kinds);

  const { data, error, count } = await q;
  if (error) throw error;
  return {
    rows: (data ?? []) as unknown as EmployeeWithRelations[],
    total: count ?? 0,
  };
}

export async function getEmployee(id: string): Promise<EmployeeWithRelations> {
  const { data, error } = await supabase
    .from("employees")
    .select(EMPLOYEE_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Employee not found");
  return data as unknown as EmployeeWithRelations;
}

export async function listDepartments(): Promise<DepartmentRow[]> {
  const { data, error } = await supabase.from("departments").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function listManagerOptions(): Promise<
  Pick<EmployeeRow, "id" | "full_name" | "employee_code">[]
> {
  const { data, error } = await supabase
    .from("employees")
    .select("id, full_name, employee_code")
    .in("status", ["active", "on_leave"])
    .order("full_name");
  if (error) throw error;
  return data ?? [];
}

export async function isEmailTaken(email: string, excludeId?: string): Promise<boolean> {
  let q = supabase
    .from("employees")
    .select("id", { count: "exact", head: true })
    .ilike("email", email.trim());
  if (excludeId) q = q.neq("id", excludeId);
  const { count, error } = await q;
  if (error) throw error;
  return (count ?? 0) > 0;
}

function toInsert(values: EmployeeFormValues) {
  return {
    employee_code: "", // trigger auto-generates
    full_name: values.full_name.trim(),
    email: values.email.trim().toLowerCase(),
    phone: emptyToNull(values.phone ?? null),
    avatar_url: values.avatar_url ?? null,
    department_id: values.department_id ?? null,
    role_title: emptyToNull(values.role_title ?? null),
    manager_id: values.manager_id ?? null,
    employment_type: values.employment_type,
    location: emptyToNull(values.location ?? null),
    timezone: emptyToNull(values.timezone ?? null),
    bio: emptyToNull(values.bio ?? null),
    responsibilities: emptyToNull(values.responsibilities ?? null),
    skills: values.skills ?? [],
    kpis: (values.kpis ?? []) as unknown as Database["public"]["Tables"]["employees"]["Insert"]["kpis"],
  } satisfies Database["public"]["Tables"]["employees"]["Insert"];
}

export async function createEmployee(values: EmployeeFormValues): Promise<EmployeeRow> {
  const { data, error } = await supabase
    .from("employees")
    .insert(toInsert(values))
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateEmployee(
  id: string,
  patch: Partial<EmployeeFormValues>,
): Promise<EmployeeRow> {
  const payload: Database["public"]["Tables"]["employees"]["Update"] = {};
  if (patch.full_name !== undefined) payload.full_name = patch.full_name.trim();
  if (patch.email !== undefined) payload.email = patch.email.trim().toLowerCase();
  if (patch.phone !== undefined) payload.phone = emptyToNull(patch.phone);
  if (patch.avatar_url !== undefined) payload.avatar_url = patch.avatar_url;
  if (patch.department_id !== undefined) payload.department_id = patch.department_id ?? null;
  if (patch.role_title !== undefined) payload.role_title = emptyToNull(patch.role_title);
  if (patch.manager_id !== undefined) payload.manager_id = patch.manager_id ?? null;
  if (patch.employment_type !== undefined) payload.employment_type = patch.employment_type;
  if (patch.location !== undefined) payload.location = emptyToNull(patch.location);
  if (patch.timezone !== undefined) payload.timezone = emptyToNull(patch.timezone);
  if (patch.bio !== undefined) payload.bio = emptyToNull(patch.bio);
  if (patch.responsibilities !== undefined)
    payload.responsibilities = emptyToNull(patch.responsibilities);
  if (patch.skills !== undefined) payload.skills = patch.skills;
  if (patch.kpis !== undefined)
    payload.kpis = patch.kpis as unknown as Database["public"]["Tables"]["employees"]["Update"]["kpis"];

  const { data, error } = await supabase
    .from("employees")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function setEmployeeStatus(
  id: string,
  status: EmployeeStatus,
): Promise<EmployeeRow> {
  const { data, error } = await supabase
    .from("employees")
    .update({
      status,
      archived_at: status === "archived" ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEmployee(id: string): Promise<void> {
  const { error } = await supabase.from("employees").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Photos ----------
const PHOTO_BUCKET = "employee-photos";

export async function uploadEmployeePhoto(
  employeeId: string,
  file: File,
): Promise<string> {
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const path = `${employeeId}/${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (upErr) throw upErr;
  const { data: signed, error: signErr } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
  if (signErr) throw signErr;
  return signed.signedUrl;
}

export async function deleteEmployeePhoto(url: string): Promise<void> {
  try {
    const match = url.match(/employee-photos\/([^?]+)/);
    const path = match?.[1];
    if (!path) return;
    await supabase.storage.from(PHOTO_BUCKET).remove([path]);
  } catch {
    // Best-effort cleanup
  }
}

// ---------- Audit log ----------
export async function listEmployeeAuditLog(employeeId: string): Promise<AuditLogRow[]> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("entity_type", "employee")
    .eq("entity_id", employeeId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function createDepartment(name: string, description?: string) {
  const { data, error } = await supabase
    .from("departments")
    .insert({ name: name.trim(), description: emptyToNull(description ?? null) })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}