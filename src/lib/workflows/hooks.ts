import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  assignEmployeeToWorkflow,
  cloneWorkflow,
  createWorkflow,
  deleteWorkflow,
  getWorkflow,
  listWorkflowActivity,
  listWorkflowVersions,
  listWorkflows,
  removeWorkflowAssignment,
  replaceWorkflowSteps,
  setWorkflowStatus,
  updateWorkflow,
  type ListWorkflowsParams,
} from "./service";
import type { WorkflowFormValues, WorkflowStepItem } from "./schemas";
import type { WorkflowAssignmentRole, WorkflowStatus } from "./constants";

export const workflowKeys = {
  all: ["workflows"] as const,
  list: (p: ListWorkflowsParams) => [...workflowKeys.all, "list", p] as const,
  detail: (id: string) => [...workflowKeys.all, "detail", id] as const,
  activity: (id: string) => [...workflowKeys.all, "activity", id] as const,
  versions: (id: string) => [...workflowKeys.all, "versions", id] as const,
};

export function useWorkflowsQuery(params: ListWorkflowsParams) {
  return useQuery({
    queryKey: workflowKeys.list(params),
    queryFn: () => listWorkflows(params),
    placeholderData: keepPreviousData,
  });
}

export function useWorkflowQuery(id: string | undefined) {
  return useQuery({
    queryKey: workflowKeys.detail(id ?? ""),
    queryFn: () => getWorkflow(id as string),
    enabled: !!id,
  });
}

export function useWorkflowActivityQuery(id: string | undefined) {
  return useQuery({
    queryKey: workflowKeys.activity(id ?? ""),
    queryFn: () => listWorkflowActivity(id as string),
    enabled: !!id,
  });
}

export function useWorkflowVersionsQuery(id: string | undefined) {
  return useQuery({
    queryKey: workflowKeys.versions(id ?? ""),
    queryFn: () => listWorkflowVersions(id as string),
    enabled: !!id,
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: workflowKeys.all });
}

export function useCreateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: WorkflowFormValues) => createWorkflow(values),
    onSuccess: (row) => {
      toast.success(`${row.name} created`);
      invalidate(qc);
    },
    onError: (err: Error) => toast.error(err.message || "Could not create workflow"),
  });
}

export function useUpdateWorkflow(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<WorkflowFormValues>) => updateWorkflow(id, patch),
    onSuccess: () => {
      toast.success("Workflow updated");
      invalidate(qc);
    },
    onError: (err: Error) => toast.error(err.message || "Could not update workflow"),
  });
}

export function useReplaceWorkflowSteps(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (steps: WorkflowStepItem[]) => replaceWorkflowSteps(id, steps),
    onSuccess: () => {
      toast.success("Steps saved");
      invalidate(qc);
    },
    onError: (err: Error) => toast.error(err.message || "Could not save steps"),
  });
}

export function useSetWorkflowStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: WorkflowStatus }) =>
      setWorkflowStatus(id, status),
    onSuccess: () => {
      toast.success("Status updated");
      invalidate(qc);
    },
    onError: (err: Error) => toast.error(err.message || "Could not update status"),
  });
}

export function useDeleteWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWorkflow(id),
    onSuccess: () => {
      toast.success("Workflow deleted");
      invalidate(qc);
    },
    onError: (err: Error) => toast.error(err.message || "Could not delete workflow"),
  });
}

export function useCloneWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cloneWorkflow(id),
    onSuccess: (row) => {
      toast.success(`${row.name} cloned`);
      invalidate(qc);
    },
    onError: (err: Error) => toast.error(err.message || "Could not clone workflow"),
  });
}

export function useAssignEmployee(workflowId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, role }: { employeeId: string; role?: WorkflowAssignmentRole }) =>
      assignEmployeeToWorkflow(workflowId, employeeId, role ?? "assignee"),
    onSuccess: () => {
      toast.success("Assignment added");
      invalidate(qc);
    },
    onError: (err: Error) => toast.error(err.message || "Could not assign"),
  });
}

export function useRemoveAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) => removeWorkflowAssignment(assignmentId),
    onSuccess: () => {
      toast.success("Assignment removed");
      invalidate(qc);
    },
    onError: (err: Error) => toast.error(err.message || "Could not remove"),
  });
}