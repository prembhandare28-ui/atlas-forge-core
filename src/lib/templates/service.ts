import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { BrainCategory } from "@/lib/brains/constants";

export type BrainTemplateRow = Database["public"]["Tables"]["brain_templates"]["Row"];

export async function listBrainTemplates(category?: BrainCategory): Promise<BrainTemplateRow[]> {
  let q = supabase.from("brain_templates").select("*").order("is_official", { ascending: false }).order("name");
  if (category) q = q.eq("category", category);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getBrainTemplate(id: string): Promise<BrainTemplateRow> {
  const { data, error } = await supabase.from("brain_templates").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Template not found");
  return data;
}

export async function deleteBrainTemplate(id: string): Promise<void> {
  const { error } = await supabase.from("brain_templates").delete().eq("id", id);
  if (error) throw error;
}

const KEY = ["brain-templates"] as const;

export function useBrainTemplatesQuery(category?: BrainCategory) {
  return useQuery({
    queryKey: [...KEY, category ?? "all"],
    queryFn: () => listBrainTemplates(category),
  });
}
export function useDeleteBrainTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBrainTemplate(id),
    onSuccess: () => { toast.success("Template deleted"); qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: Error) => toast.error(e.message),
  });
}