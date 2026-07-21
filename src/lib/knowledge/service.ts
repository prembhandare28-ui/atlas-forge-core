import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type KnowledgePackRow = Database["public"]["Tables"]["knowledge_packs"]["Row"];
export type KnowledgeCategory = Database["public"]["Enums"]["knowledge_category"];
export type KnowledgeSourceType = Database["public"]["Enums"]["knowledge_source_type"];
export type KnowledgeStatus = Database["public"]["Enums"]["knowledge_status"];

export const KNOWLEDGE_CATEGORIES: { value: KnowledgeCategory; label: string }[] = [
  { value: "general", label: "General" },
  { value: "product", label: "Product" },
  { value: "sales", label: "Sales" },
  { value: "support", label: "Support" },
  { value: "marketing", label: "Marketing" },
  { value: "operations", label: "Operations" },
  { value: "finance", label: "Finance" },
  { value: "hr", label: "HR" },
  { value: "legal", label: "Legal" },
  { value: "engineering", label: "Engineering" },
  { value: "custom", label: "Custom" },
];
export const KNOWLEDGE_SOURCE_TYPES: { value: KnowledgeSourceType; label: string; future?: boolean }[] = [
  { value: "text", label: "Plain Text" },
  { value: "markdown", label: "Markdown" },
  { value: "faq", label: "FAQ" },
  { value: "sop", label: "SOP" },
  { value: "pricing", label: "Pricing" },
  { value: "policy", label: "Policy" },
  { value: "notes", label: "Internal Notes" },
  { value: "pdf", label: "PDF", future: true },
  { value: "docx", label: "DOCX", future: true },
  { value: "url", label: "URL", future: true },
];

export interface KnowledgePackWithUsage extends KnowledgePackRow {
  brain_count?: number;
}

export interface ListKnowledgeParams {
  search?: string;
  categories?: KnowledgeCategory[];
  statuses?: KnowledgeStatus[];
  sourceTypes?: KnowledgeSourceType[];
}

export async function listKnowledgePacks(params: ListKnowledgeParams = {}): Promise<KnowledgePackRow[]> {
  let q = supabase.from("knowledge_packs").select("*").order("updated_at", { ascending: false });
  const term = params.search?.trim();
  if (term) {
    const esc = term.replace(/[,%]/g, "");
    q = q.or(`name.ilike.%${esc}%,description.ilike.%${esc}%`);
  }
  if (params.categories?.length) q = q.in("category", params.categories);
  if (params.statuses?.length) q = q.in("status", params.statuses);
  if (params.sourceTypes?.length) q = q.in("source_type", params.sourceTypes);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getKnowledgePack(id: string): Promise<KnowledgePackRow> {
  const { data, error } = await supabase.from("knowledge_packs").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Knowledge pack not found");
  return data;
}

export interface KnowledgeFormValues {
  name: string;
  description?: string;
  category: KnowledgeCategory;
  source_type: KnowledgeSourceType;
  content?: string;
  source_url?: string;
  tags?: string[];
  status?: KnowledgeStatus;
}

export async function createKnowledgePack(v: KnowledgeFormValues): Promise<KnowledgePackRow> {
  const { data: user } = await supabase.auth.getUser();
  const uid = user.user?.id ?? null;
  const { data, error } = await supabase.from("knowledge_packs").insert({
    name: v.name.trim(),
    description: v.description?.trim() || null,
    category: v.category,
    source_type: v.source_type,
    content: v.content?.trim() || null,
    source_url: v.source_url?.trim() || null,
    tags: v.tags ?? [],
    status: v.status ?? "active",
    owner_id: uid,
    created_by: uid,
  }).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateKnowledgePack(id: string, patch: Partial<KnowledgeFormValues>): Promise<KnowledgePackRow> {
  const payload: Database["public"]["Tables"]["knowledge_packs"]["Update"] = {};
  if (patch.name !== undefined) payload.name = patch.name.trim();
  if (patch.description !== undefined) payload.description = patch.description?.trim() || null;
  if (patch.category !== undefined) payload.category = patch.category;
  if (patch.source_type !== undefined) payload.source_type = patch.source_type;
  if (patch.content !== undefined) payload.content = patch.content?.trim() || null;
  if (patch.source_url !== undefined) payload.source_url = patch.source_url?.trim() || null;
  if (patch.tags !== undefined) payload.tags = patch.tags;
  if (patch.status !== undefined) payload.status = patch.status;
  const { data, error } = await supabase.from("knowledge_packs").update(payload).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function duplicateKnowledgePack(id: string): Promise<KnowledgePackRow> {
  const src = await getKnowledgePack(id);
  return createKnowledgePack({
    name: `${src.name} (Copy)`,
    description: src.description ?? "",
    category: src.category,
    source_type: src.source_type,
    content: src.content ?? "",
    source_url: src.source_url ?? "",
    tags: src.tags,
    status: "draft",
  });
}

export async function archiveKnowledgePack(id: string): Promise<KnowledgePackRow> {
  return updateKnowledgePack(id, { status: "archived" });
}

export async function deleteKnowledgePack(id: string): Promise<void> {
  const { error } = await supabase.from("knowledge_packs").delete().eq("id", id);
  if (error) throw error;
}

// hooks
const KEY = ["knowledge"] as const;

export function useKnowledgePacksQuery(params: ListKnowledgeParams = {}) {
  return useQuery({
    queryKey: [...KEY, "list", params],
    queryFn: () => listKnowledgePacks(params),
    placeholderData: keepPreviousData,
  });
}
export function useKnowledgePackQuery(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, "detail", id],
    queryFn: () => getKnowledgePack(id as string),
    enabled: !!id,
  });
}
export function useCreateKnowledgePack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: KnowledgeFormValues) => createKnowledgePack(v),
    onSuccess: (r) => { toast.success(`${r.name} created`); qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useUpdateKnowledgePack(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Partial<KnowledgeFormValues>) => updateKnowledgePack(id, p),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useDuplicateKnowledgePack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => duplicateKnowledgePack(id),
    onSuccess: () => { toast.success("Duplicated"); qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useArchiveKnowledgePack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveKnowledgePack(id),
    onSuccess: () => { toast.success("Archived"); qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useDeleteKnowledgePack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteKnowledgePack(id),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: Error) => toast.error(e.message),
  });
}