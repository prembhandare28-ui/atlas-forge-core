import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type SkillRow = Database["public"]["Tables"]["skills"]["Row"];
export type SkillCategory = Database["public"]["Enums"]["skill_category"];
export type SkillDifficulty = Database["public"]["Enums"]["skill_difficulty"];

export const SKILL_CATEGORIES: { value: SkillCategory; label: string }[] = [
  { value: "sales", label: "Sales" },
  { value: "support", label: "Support" },
  { value: "research", label: "Research" },
  { value: "marketing", label: "Marketing" },
  { value: "recruitment", label: "Recruitment" },
  { value: "operations", label: "Operations" },
  { value: "finance", label: "Finance" },
  { value: "negotiation", label: "Negotiation" },
  { value: "planning", label: "Planning" },
  { value: "analysis", label: "Analysis" },
  { value: "writing", label: "Writing" },
  { value: "translation", label: "Translation" },
  { value: "coding", label: "Coding" },
  { value: "custom", label: "Custom" },
];
export const SKILL_DIFFICULTIES: { value: SkillDifficulty; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
];

export interface SkillFormValues {
  name: string;
  category: SkillCategory;
  description?: string;
  difficulty: SkillDifficulty;
  tags?: string[];
}

export interface ListSkillsParams {
  search?: string;
  categories?: SkillCategory[];
  difficulties?: SkillDifficulty[];
}

export async function listSkills(p: ListSkillsParams = {}): Promise<SkillRow[]> {
  let q = supabase.from("skills").select("*").order("name", { ascending: true });
  const term = p.search?.trim();
  if (term) {
    const esc = term.replace(/[,%]/g, "");
    q = q.or(`name.ilike.%${esc}%,description.ilike.%${esc}%`);
  }
  if (p.categories?.length) q = q.in("category", p.categories);
  if (p.difficulties?.length) q = q.in("difficulty", p.difficulties);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createSkill(v: SkillFormValues): Promise<SkillRow> {
  const { data: user } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("skills").insert({
    name: v.name.trim(),
    category: v.category,
    description: v.description?.trim() || null,
    difficulty: v.difficulty,
    tags: v.tags ?? [],
    created_by: user.user?.id ?? null,
  }).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateSkill(id: string, patch: Partial<SkillFormValues>): Promise<SkillRow> {
  const payload: Database["public"]["Tables"]["skills"]["Update"] = {};
  if (patch.name !== undefined) payload.name = patch.name.trim();
  if (patch.category !== undefined) payload.category = patch.category;
  if (patch.description !== undefined) payload.description = patch.description?.trim() || null;
  if (patch.difficulty !== undefined) payload.difficulty = patch.difficulty;
  if (patch.tags !== undefined) payload.tags = patch.tags;
  const { data, error } = await supabase.from("skills").update(payload).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function deleteSkill(id: string): Promise<void> {
  const { error } = await supabase.from("skills").delete().eq("id", id);
  if (error) throw error;
}

const KEY = ["skills"] as const;

export function useSkillsQuery(params: ListSkillsParams = {}) {
  return useQuery({
    queryKey: [...KEY, "list", params],
    queryFn: () => listSkills(params),
    placeholderData: keepPreviousData,
  });
}
export function useCreateSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: SkillFormValues) => createSkill(v),
    onSuccess: () => { toast.success("Skill created"); qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useUpdateSkill(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Partial<SkillFormValues>) => updateSkill(id, p),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useDeleteSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSkill(id),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: Error) => toast.error(e.message),
  });
}