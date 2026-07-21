import { z } from "zod";
import type {
  BrainCategory,
  BrainDecisionStyle,
  BrainResponseDepth,
  BrainStatus,
  BrainTone,
  BrainVisibility,
} from "./constants";

export const brainIdentitySchema = z.object({
  name: z.string().min(2, "Name is required").max(120),
  description: z.string().max(2000).optional().default(""),
  category: z.string() as unknown as z.ZodType<BrainCategory>,
  tags: z.array(z.string()).default([]),
  status: z.string().default("draft") as unknown as z.ZodType<BrainStatus>,
  visibility: z.string().default("organization") as unknown as z.ZodType<BrainVisibility>,
});

export const brainMissionSchema = z.object({
  mission: z.string().max(4000).optional().default(""),
  goals: z.array(z.string()).default([]),
  success_definition: z.string().max(2000).optional().default(""),
  expected_roi: z.coerce.number().nullable().optional(),
});

export const brainBehaviourSchema = z.object({
  tone: z.string() as unknown as z.ZodType<BrainTone>,
  decision_style: z.string() as unknown as z.ZodType<BrainDecisionStyle>,
  creativity_level: z.coerce.number().min(0).max(100).default(50),
  risk_level: z.coerce.number().min(0).max(100).default(30),
  response_depth: z.string() as unknown as z.ZodType<BrainResponseDepth>,
});

export const brainRulesSchema = z.object({
  always_do: z.array(z.string()).default([]),
  never_do: z.array(z.string()).default([]),
  escalation_rules: z.string().max(4000).optional().default(""),
  approval_rules: z.string().max(4000).optional().default(""),
});

export const brainMemorySchema = z.object({
  session_memory_enabled: z.boolean().default(true),
  long_term_memory_enabled: z.boolean().default(false),
  context_window_tokens: z.coerce.number().min(1000).max(200000).default(8000),
  memory_retention_days: z.coerce.number().min(0).max(365).default(30),
});

export const brainFormSchema = brainIdentitySchema
  .merge(brainMissionSchema)
  .merge(brainBehaviourSchema)
  .merge(brainRulesSchema)
  .merge(brainMemorySchema);

export type BrainFormValues = z.infer<typeof brainFormSchema>;

export const brainFormDefaults: BrainFormValues = {
  name: "",
  description: "",
  category: "custom",
  tags: [],
  status: "draft",
  visibility: "organization",
  mission: "",
  goals: [],
  success_definition: "",
  expected_roi: null,
  tone: "friendly",
  decision_style: "balanced",
  creativity_level: 50,
  risk_level: 30,
  response_depth: "standard",
  always_do: [],
  never_do: [],
  escalation_rules: "",
  approval_rules: "",
  session_memory_enabled: true,
  long_term_memory_enabled: false,
  context_window_tokens: 8000,
  memory_retention_days: 30,
};