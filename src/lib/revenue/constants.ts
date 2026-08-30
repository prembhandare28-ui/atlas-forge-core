/**
 * Revenue Department — shared vocabulary (client-safe, no side effects).
 * Presentation code must read labels/tones from here, never hard-code them.
 */
import type { Database } from "@/integrations/supabase/types";

type Enums = Database["public"]["Enums"];

export type OfferStatus = Enums["offer_status"];
export type OfferPricingModel = Enums["offer_pricing_model"];
export type OfferBillingInterval = Enums["offer_billing_interval"];
export type LeadStatus = Enums["lead_status"];
export type LeadSource = Enums["lead_source"];
export type OpportunityStage = Enums["opportunity_stage"];
export type CustomerLifecycle = Enums["customer_lifecycle"];
export type ProposalStatus = Enums["proposal_status"];
export type PaymentStatus = Enums["payment_status"];
export type RevenueEventKind = Enums["revenue_event_kind"];

export type Tone = "neutral" | "primary" | "success" | "warning" | "danger";

export const TONE_CLASSES: Readonly<Record<Tone, string>> = {
  neutral: "border-border bg-muted text-muted-foreground",
  primary: "border-primary/30 bg-primary/10 text-primary",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-500",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
};

export interface Option<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly tone?: Tone;
}

export const OFFER_STATUSES: readonly Option<OfferStatus>[] = [
  { value: "draft", label: "Draft", tone: "neutral" },
  { value: "active", label: "Active", tone: "success" },
  { value: "paused", label: "Paused", tone: "warning" },
  { value: "retired", label: "Retired", tone: "neutral" },
];

export const OFFER_PRICING_MODELS: readonly Option<OfferPricingModel>[] = [
  { value: "one_time", label: "One-time" },
  { value: "subscription", label: "Subscription" },
  { value: "retainer", label: "Retainer" },
  { value: "usage_based", label: "Usage-based" },
  { value: "custom", label: "Custom" },
];

export const OFFER_BILLING_INTERVALS: readonly Option<OfferBillingInterval>[] = [
  { value: "none", label: "No interval" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
];

export const LEAD_STATUSES: readonly Option<LeadStatus>[] = [
  { value: "new", label: "New", tone: "primary" },
  { value: "contacted", label: "Contacted", tone: "neutral" },
  { value: "qualified", label: "Qualified", tone: "success" },
  { value: "unqualified", label: "Unqualified", tone: "warning" },
  { value: "converted", label: "Converted", tone: "success" },
  { value: "archived", label: "Archived", tone: "neutral" },
];

export const LEAD_SOURCES: readonly Option<LeadSource>[] = [
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "outbound", label: "Outbound" },
  { value: "inbound", label: "Inbound" },
  { value: "partner", label: "Partner" },
  { value: "event", label: "Event" },
  { value: "atlas_research", label: "Atlas research" },
  { value: "other", label: "Other" },
];

/** Canonical pipeline order — the Revenue Department's single source of truth. */
export const PIPELINE_STAGES: readonly Option<OpportunityStage>[] = [
  { value: "lead", label: "Lead", tone: "neutral" },
  { value: "qualified", label: "Qualified", tone: "primary" },
  { value: "discovery", label: "Discovery", tone: "primary" },
  { value: "proposal", label: "Proposal", tone: "primary" },
  { value: "negotiation", label: "Negotiation", tone: "warning" },
  { value: "won", label: "Won", tone: "success" },
  { value: "onboarding", label: "Onboarding", tone: "success" },
  { value: "delivery", label: "Delivery", tone: "success" },
  { value: "retention", label: "Retention", tone: "success" },
  { value: "expansion", label: "Expansion", tone: "success" },
  { value: "lost", label: "Lost", tone: "danger" },
];

export const OPEN_STAGES: readonly OpportunityStage[] = [
  "lead",
  "qualified",
  "discovery",
  "proposal",
  "negotiation",
];

export const CLOSED_WON_STAGES: readonly OpportunityStage[] = [
  "won",
  "onboarding",
  "delivery",
  "retention",
  "expansion",
];

export const CUSTOMER_LIFECYCLES: readonly Option<CustomerLifecycle>[] = [
  { value: "prospect", label: "Prospect", tone: "neutral" },
  { value: "customer", label: "Customer", tone: "primary" },
  { value: "onboarding", label: "Onboarding", tone: "primary" },
  { value: "active_delivery", label: "Active delivery", tone: "success" },
  { value: "completed", label: "Completed", tone: "success" },
  { value: "retention", label: "Retention", tone: "success" },
  { value: "expansion", label: "Expansion", tone: "success" },
  { value: "churned", label: "Churned", tone: "danger" },
];

export const PROPOSAL_STATUSES: readonly Option<ProposalStatus>[] = [
  { value: "draft", label: "Draft", tone: "neutral" },
  { value: "in_review", label: "In review", tone: "warning" },
  { value: "approved", label: "Approved", tone: "success" },
  { value: "sent", label: "Sent", tone: "primary" },
  { value: "accepted", label: "Accepted", tone: "success" },
  { value: "rejected", label: "Rejected", tone: "danger" },
];

export const PAYMENT_STATUSES: readonly Option<PaymentStatus>[] = [
  { value: "pending", label: "Pending", tone: "neutral" },
  { value: "requires_action", label: "Requires action", tone: "warning" },
  { value: "processing", label: "Processing", tone: "primary" },
  { value: "succeeded", label: "Succeeded", tone: "success" },
  { value: "failed", label: "Failed", tone: "danger" },
  { value: "refunded", label: "Refunded", tone: "warning" },
  { value: "cancelled", label: "Cancelled", tone: "neutral" },
];

export const REVENUE_EVENT_KINDS: readonly Option<RevenueEventKind>[] = [
  { value: "booking", label: "Booking" },
  { value: "invoice", label: "Invoice" },
  { value: "payment", label: "Payment" },
  { value: "recurring", label: "Recurring" },
  { value: "expansion", label: "Expansion" },
  { value: "refund", label: "Refund" },
  { value: "churn", label: "Churn" },
];

/** Default stage probabilities — a starting point, editable per opportunity. */
export const STAGE_PROBABILITY: Readonly<Record<OpportunityStage, number>> = {
  lead: 10,
  qualified: 25,
  discovery: 40,
  proposal: 60,
  negotiation: 75,
  won: 100,
  onboarding: 100,
  delivery: 100,
  retention: 100,
  expansion: 100,
  lost: 0,
};

export function labelFor<T extends string>(
  options: readonly Option<T>[],
  value: T | null | undefined,
): string {
  return options.find((option) => option.value === value)?.label ?? "—";
}

export function toneFor<T extends string>(
  options: readonly Option<T>[],
  value: T | null | undefined,
): Tone {
  return options.find((option) => option.value === value)?.tone ?? "neutral";
}

export function formatMoney(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
