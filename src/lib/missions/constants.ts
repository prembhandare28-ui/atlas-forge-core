import type { MissionStatus } from "@/kernel";

export const MISSION_STATUSES: readonly MissionStatus[] = [
  "created",
  "queued",
  "running",
  "paused",
  "completed",
  "failed",
  "cancelled",
];

export const MISSION_STATUS_LABELS: Readonly<Record<MissionStatus, string>> = {
  created: "Created",
  queued: "Queued",
  running: "Running",
  paused: "Paused",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

export type MissionTone = "neutral" | "primary" | "success" | "warning" | "danger";

export const MISSION_STATUS_TONES: Readonly<Record<MissionStatus, MissionTone>> = {
  created: "neutral",
  queued: "primary",
  running: "primary",
  paused: "warning",
  completed: "success",
  failed: "danger",
  cancelled: "neutral",
};

export const MISSION_TONE_CLASSES: Readonly<Record<MissionTone, string>> = {
  neutral: "border-border bg-muted text-muted-foreground",
  primary: "border-primary/30 bg-primary/10 text-primary",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-500",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function formatMissionTime(value?: number): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export function formatMissionDuration(from?: number, to?: number): string {
  if (!from) return "—";
  const end = to ?? Date.now();
  const seconds = Math.max(0, Math.round((end - from) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
}