import type { Database } from "@/integrations/supabase/types";

export type BrainStatus = Database["public"]["Enums"]["brain_status"];
export type BrainCategory = Database["public"]["Enums"]["brain_category"];
export type BrainVisibility = Database["public"]["Enums"]["brain_visibility"];
export type BrainTone = Database["public"]["Enums"]["brain_tone"];
export type BrainDecisionStyle = Database["public"]["Enums"]["brain_decision_style"];
export type BrainResponseDepth = Database["public"]["Enums"]["brain_response_depth"];
export type BrainAssignmentTarget = Database["public"]["Enums"]["brain_assignment_target"];

export const BRAIN_STATUSES: {
  value: BrainStatus;
  label: string;
  tone: "muted" | "success" | "warning" | "destructive" | "primary";
}[] = [
  { value: "draft", label: "Draft", tone: "muted" },
  { value: "experimental", label: "Experimental", tone: "warning" },
  { value: "published", label: "Published", tone: "primary" },
  { value: "stable", label: "Stable", tone: "success" },
  { value: "archived", label: "Archived", tone: "destructive" },
];

export const BRAIN_CATEGORIES: { value: BrainCategory; label: string }[] = [
  { value: "sales", label: "Sales" },
  { value: "support", label: "Support" },
  { value: "operations", label: "Operations" },
  { value: "marketing", label: "Marketing" },
  { value: "research", label: "Research" },
  { value: "finance", label: "Finance" },
  { value: "growth", label: "Growth" },
  { value: "recruitment", label: "Recruitment" },
  { value: "executive", label: "Executive" },
  { value: "custom", label: "Custom" },
];

export const BRAIN_VISIBILITIES: { value: BrainVisibility; label: string; description: string }[] = [
  { value: "private", label: "Private", description: "Only the owner" },
  { value: "organization", label: "Organization", description: "Everyone in your org" },
  { value: "public", label: "Public", description: "Marketplace / shared" },
];

export const BRAIN_TONES: { value: BrainTone; label: string }[] = [
  { value: "formal", label: "Formal" },
  { value: "friendly", label: "Friendly" },
  { value: "concise", label: "Concise" },
  { value: "persuasive", label: "Persuasive" },
  { value: "empathetic", label: "Empathetic" },
  { value: "analytical", label: "Analytical" },
  { value: "playful", label: "Playful" },
];

export const BRAIN_DECISION_STYLES: { value: BrainDecisionStyle; label: string }[] = [
  { value: "conservative", label: "Conservative" },
  { value: "balanced", label: "Balanced" },
  { value: "aggressive", label: "Aggressive" },
  { value: "data_driven", label: "Data-driven" },
  { value: "intuitive", label: "Intuitive" },
];

export const BRAIN_RESPONSE_DEPTHS: { value: BrainResponseDepth; label: string }[] = [
  { value: "brief", label: "Brief" },
  { value: "standard", label: "Standard" },
  { value: "detailed", label: "Detailed" },
  { value: "exhaustive", label: "Exhaustive" },
];

export function labelFor<T extends { value: string; label: string }>(
  items: T[],
  value: string | null | undefined,
): string {
  if (!value) return "—";
  return items.find((i) => i.value === value)?.label ?? value;
}