import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ToolRow = Database["public"]["Tables"]["tools"]["Row"];
export type ToolAuthType = Database["public"]["Enums"]["tool_auth_type"];
export type ToolStatus = Database["public"]["Enums"]["tool_status"];
export type ToolHealth = Database["public"]["Enums"]["tool_health"];
export type ToolEnvironment = Database["public"]["Enums"]["tool_environment"];

export const TOOL_AUTH_TYPES: { value: ToolAuthType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "api_key", label: "API Key" },
  { value: "oauth2", label: "OAuth 2.0" },
  { value: "basic", label: "Basic" },
  { value: "custom", label: "Custom" },
];
export const TOOL_STATUSES: { value: ToolStatus; label: string; tone: "muted" | "success" | "destructive" }[] = [
  { value: "inactive", label: "Inactive", tone: "muted" },
  { value: "active", label: "Active", tone: "success" },
  { value: "deprecated", label: "Deprecated", tone: "destructive" },
];
export const TOOL_HEALTHS: { value: ToolHealth; label: string; tone: "muted" | "success" | "warning" | "destructive" }[] = [
  { value: "unknown", label: "Unknown", tone: "muted" },
  { value: "healthy", label: "Healthy", tone: "success" },
  { value: "degraded", label: "Degraded", tone: "warning" },
  { value: "down", label: "Down", tone: "destructive" },
];
export const TOOL_ENVIRONMENTS: { value: ToolEnvironment; label: string }[] = [
  { value: "development", label: "Development" },
  { value: "staging", label: "Staging" },
  { value: "production", label: "Production" },
];

export interface ToolFormValues {
  name: string;
  provider: string;
  description?: string;
  auth_type: ToolAuthType;
  scopes?: string[];
  permissions?: string[];
  status: ToolStatus;
  environment: ToolEnvironment;
  base_url?: string;
  runtime_ready?: boolean;
}

export interface ListToolsParams {
  search?: string;
  providers?: string[];
  statuses?: ToolStatus[];
  environments?: ToolEnvironment[];
}

export async function listTools(p: ListToolsParams = {}): Promise<ToolRow[]> {
  let q = supabase.from("tools").select("*").order("name", { ascending: true });
  const term = p.search?.trim();
  if (term) {
    const esc = term.replace(/[,%]/g, "");
    q = q.or(`name.ilike.%${esc}%,provider.ilike.%${esc}%,description.ilike.%${esc}%`);
  }
  if (p.providers?.length) q = q.in("provider", p.providers);
  if (p.statuses?.length) q = q.in("status", p.statuses);
  if (p.environments?.length) q = q.in("environment", p.environments);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createTool(v: ToolFormValues): Promise<ToolRow> {
  const { data: user } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("tools").insert({
    name: v.name.trim(),
    provider: v.provider.trim(),
    description: v.description?.trim() || null,
    auth_type: v.auth_type,
    scopes: v.scopes ?? [],
    permissions: v.permissions ?? [],
    status: v.status,
    environment: v.environment,
    base_url: v.base_url?.trim() || null,
    runtime_ready: v.runtime_ready ?? false,
    created_by: user.user?.id ?? null,
  }).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateTool(id: string, patch: Partial<ToolFormValues>): Promise<ToolRow> {
  const payload: Database["public"]["Tables"]["tools"]["Update"] = {};
  if (patch.name !== undefined) payload.name = patch.name.trim();
  if (patch.provider !== undefined) payload.provider = patch.provider.trim();
  if (patch.description !== undefined) payload.description = patch.description?.trim() || null;
  if (patch.auth_type !== undefined) payload.auth_type = patch.auth_type;
  if (patch.scopes !== undefined) payload.scopes = patch.scopes;
  if (patch.permissions !== undefined) payload.permissions = patch.permissions;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.environment !== undefined) payload.environment = patch.environment;
  if (patch.base_url !== undefined) payload.base_url = patch.base_url?.trim() || null;
  if (patch.runtime_ready !== undefined) payload.runtime_ready = patch.runtime_ready;
  const { data, error } = await supabase.from("tools").update(payload).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function deleteTool(id: string): Promise<void> {
  const { error } = await supabase.from("tools").delete().eq("id", id);
  if (error) throw error;
}

const KEY = ["tools"] as const;

export function useToolsQuery(params: ListToolsParams = {}) {
  return useQuery({
    queryKey: [...KEY, "list", params],
    queryFn: () => listTools(params),
    placeholderData: keepPreviousData,
  });
}
export function useCreateTool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: ToolFormValues) => createTool(v),
    onSuccess: () => { toast.success("Tool added"); qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useUpdateTool(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Partial<ToolFormValues>) => updateTool(id, p),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useDeleteTool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTool(id),
    onSuccess: () => { toast.success("Removed"); qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: Error) => toast.error(e.message),
  });
}