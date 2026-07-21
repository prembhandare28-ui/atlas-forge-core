import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  assignBrainToEmployee,
  assignBrainToWorkflow,
  attachKnowledge,
  attachSkill,
  attachTool,
  cloneBrain,
  createBrain,
  createBrainFromTemplate,
  deleteBrain,
  detachKnowledge,
  detachSkill,
  detachTool,
  getBrain,
  listBrainActivity,
  listBrainAnalytics,
  listBrainVersions,
  listBrains,
  removeBrainAssignment,
  rollbackBrainVersion,
  setBrainStatus,
  snapshotBrainVersion,
  updateBrain,
  type ListBrainsParams,
} from "./service";
import type { BrainFormValues } from "./schemas";
import type { BrainStatus } from "./constants";

export const brainKeys = {
  all: ["brains"] as const,
  list: (p: ListBrainsParams) => [...brainKeys.all, "list", p] as const,
  detail: (id: string) => [...brainKeys.all, "detail", id] as const,
  versions: (id: string) => [...brainKeys.all, "versions", id] as const,
  activity: (id: string) => [...brainKeys.all, "activity", id] as const,
  analytics: (id: string) => [...brainKeys.all, "analytics", id] as const,
};

export function useBrainsQuery(params: ListBrainsParams) {
  return useQuery({
    queryKey: brainKeys.list(params),
    queryFn: () => listBrains(params),
    placeholderData: keepPreviousData,
  });
}
export function useBrainQuery(id: string | undefined) {
  return useQuery({
    queryKey: brainKeys.detail(id ?? ""),
    queryFn: () => getBrain(id as string),
    enabled: !!id,
  });
}
export function useBrainVersionsQuery(id: string | undefined) {
  return useQuery({
    queryKey: brainKeys.versions(id ?? ""),
    queryFn: () => listBrainVersions(id as string),
    enabled: !!id,
  });
}
export function useBrainActivityQuery(id: string | undefined) {
  return useQuery({
    queryKey: brainKeys.activity(id ?? ""),
    queryFn: () => listBrainActivity(id as string),
    enabled: !!id,
  });
}
export function useBrainAnalyticsQuery(id: string | undefined, days = 30) {
  return useQuery({
    queryKey: [...brainKeys.analytics(id ?? ""), days],
    queryFn: () => listBrainAnalytics(id as string, days),
    enabled: !!id,
  });
}

function inv(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: brainKeys.all });
}

export function useCreateBrain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: BrainFormValues) => createBrain(v),
    onSuccess: (r) => { toast.success(`${r.name} created`); inv(qc); },
    onError: (e: Error) => toast.error(e.message || "Could not create brain"),
  });
}
export function useUpdateBrain(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Partial<BrainFormValues>) => updateBrain(id, p),
    onSuccess: () => { toast.success("Brain updated"); inv(qc); },
    onError: (e: Error) => toast.error(e.message || "Could not update"),
  });
}
export function useSetBrainStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BrainStatus }) => setBrainStatus(id, status),
    onSuccess: () => { toast.success("Status updated"); inv(qc); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useDeleteBrain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBrain(id),
    onSuccess: () => { toast.success("Brain deleted"); inv(qc); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useCloneBrain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cloneBrain(id),
    onSuccess: (r) => { toast.success(`${r.name} cloned`); inv(qc); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useCreateBrainFromTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, name }: { templateId: string; name?: string }) =>
      createBrainFromTemplate(templateId, name),
    onSuccess: (r) => { toast.success(`${r.name} created from template`); inv(qc); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useSnapshotBrain(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notes?: string) => snapshotBrainVersion(id, notes),
    onSuccess: () => { toast.success("Version snapshot saved"); inv(qc); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useRollbackBrain(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (versionId: string) => rollbackBrainVersion(id, versionId),
    onSuccess: () => { toast.success("Rolled back"); inv(qc); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useAttachKnowledge(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (kid: string) => attachKnowledge(id, kid),
    onSuccess: () => { toast.success("Knowledge attached"); inv(qc); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useDetachKnowledge(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (kid: string) => detachKnowledge(id, kid),
    onSuccess: () => inv(qc),
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useAttachSkill(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sid: string) => attachSkill(id, sid),
    onSuccess: () => { toast.success("Skill attached"); inv(qc); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useDetachSkill(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sid: string) => detachSkill(id, sid),
    onSuccess: () => inv(qc),
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useAttachTool(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ toolId, permissions }: { toolId: string; permissions?: string[] }) =>
      attachTool(id, toolId, permissions ?? []),
    onSuccess: () => { toast.success("Tool attached"); inv(qc); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useDetachTool(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (toolId: string) => detachTool(id, toolId),
    onSuccess: () => inv(qc),
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useAssignBrainToEmployee(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (employeeId: string) => assignBrainToEmployee(id, employeeId),
    onSuccess: () => { toast.success("Assigned to employee"); inv(qc); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useAssignBrainToWorkflow(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (workflowId: string) => assignBrainToWorkflow(id, workflowId),
    onSuccess: () => { toast.success("Assigned to workflow"); inv(qc); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useRemoveBrainAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) => removeBrainAssignment(assignmentId),
    onSuccess: () => inv(qc),
    onError: (e: Error) => toast.error(e.message),
  });
}