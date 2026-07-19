import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createEmployee,
  cloneEmployee,
  deleteEmployee,
  getEmployee,
  listDepartments,
  listEmployeeAuditLog,
  listEmployees,
  listManagerOptions,
  setEmployeeStatus,
  updateEmployee,
  type ListEmployeesParams,
} from "./service";
import type { EmployeeFormValues } from "./schemas";
import type { EmployeeStatus } from "./constants";

export const employeeKeys = {
  all: ["employees"] as const,
  list: (params: ListEmployeesParams) => [...employeeKeys.all, "list", params] as const,
  detail: (id: string) => [...employeeKeys.all, "detail", id] as const,
  audit: (id: string) => [...employeeKeys.all, "audit", id] as const,
  managers: () => [...employeeKeys.all, "managers"] as const,
  departments: () => ["departments"] as const,
};

export function useEmployeesQuery(params: ListEmployeesParams) {
  return useQuery({
    queryKey: employeeKeys.list(params),
    queryFn: () => listEmployees(params),
    placeholderData: keepPreviousData,
  });
}

export function useEmployeeQuery(id: string | undefined) {
  return useQuery({
    queryKey: employeeKeys.detail(id ?? ""),
    queryFn: () => getEmployee(id as string),
    enabled: !!id,
  });
}

export function useDepartmentsQuery() {
  return useQuery({ queryKey: employeeKeys.departments(), queryFn: listDepartments });
}

export function useManagerOptionsQuery() {
  return useQuery({ queryKey: employeeKeys.managers(), queryFn: listManagerOptions });
}

export function useEmployeeAuditQuery(id: string | undefined) {
  return useQuery({
    queryKey: employeeKeys.audit(id ?? ""),
    queryFn: () => listEmployeeAuditLog(id as string),
    enabled: !!id,
  });
}

function invalidateEmployees(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: employeeKeys.all });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: EmployeeFormValues) => createEmployee(values),
    onSuccess: (row) => {
      toast.success(`${row.full_name} added to the workforce`);
      invalidateEmployees(qc);
    },
    onError: (err: Error) => toast.error(err.message || "Could not create employee"),
  });
}

export function useUpdateEmployee(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<EmployeeFormValues>) => updateEmployee(id, patch),
    onSuccess: () => {
      toast.success("Employee updated");
      invalidateEmployees(qc);
    },
    onError: (err: Error) => toast.error(err.message || "Could not update employee"),
  });
}

export function useSetEmployeeStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: EmployeeStatus }) =>
      setEmployeeStatus(id, status),
    onSuccess: (_row, vars) => {
      toast.success(vars.status === "archived" ? "Employee archived" : "Status updated");
      invalidateEmployees(qc);
    },
    onError: (err: Error) => toast.error(err.message || "Could not update status"),
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEmployee(id),
    onSuccess: () => {
      toast.success("Employee deleted");
      invalidateEmployees(qc);
    },
    onError: (err: Error) => toast.error(err.message || "Could not delete employee"),
  });
}

export function useCloneEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cloneEmployee(id),
    onSuccess: (row) => {
      toast.success(`${row.full_name} cloned`);
      invalidateEmployees(qc);
    },
    onError: (err: Error) => toast.error(err.message || "Could not clone employee"),
  });
}