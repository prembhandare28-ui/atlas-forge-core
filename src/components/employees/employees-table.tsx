import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpDown,
  Archive,
  MoreHorizontal,
  Trash2,
  Undo2,
  UserRound,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { EmployeeAvatar } from "./employee-avatar";
import { StatusBadge } from "./status-badge";
import { formatRelative } from "@/lib/employees/constants";
import type { EmployeeWithRelations } from "@/lib/employees/service";
import {
  useDeleteEmployee,
  useSetEmployeeStatus,
} from "@/lib/employees/hooks";
import { useCan } from "@/lib/rbac";
import { cn } from "@/lib/utils";

export interface SortState {
  column: "full_name" | "created_at" | "last_active_at" | "employee_code";
  ascending: boolean;
}

interface EmployeesTableProps {
  rows: EmployeeWithRelations[];
  loading: boolean;
  sort: SortState;
  onSortChange: (s: SortState) => void;
  selection: Set<string>;
  onSelectionChange: (next: Set<string>) => void;
}

export function EmployeesTable({
  rows,
  loading,
  sort,
  onSortChange,
  selection,
  onSelectionChange,
}: EmployeesTableProps) {
  const { canManageEmployees, canDeleteEmployees } = useCan();
  const setStatus = useSetEmployeeStatus();
  const del = useDeleteEmployee();
  const [confirmDelete, setConfirmDelete] = useState<EmployeeWithRelations | null>(null);

  const allSelected = rows.length > 0 && rows.every((r) => selection.has(r.id));
  const someSelected = rows.some((r) => selection.has(r.id));

  const toggleAll = (checked: boolean) => {
    const next = new Set(selection);
    if (checked) rows.forEach((r) => next.add(r.id));
    else rows.forEach((r) => next.delete(r.id));
    onSelectionChange(next);
  };
  const toggleOne = (id: string) => {
    const next = new Set(selection);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  const sortBy = (column: SortState["column"]) => {
    onSortChange(
      sort.column === column ? { column, ascending: !sort.ascending } : { column, ascending: true },
    );
  };

  return (
    <div className="rounded-xl border bg-card/40">
      <div className="max-h-[calc(100vh-320px)] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur">
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  aria-label="Select all"
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={(v) => toggleAll(!!v)}
                />
              </TableHead>
              <TableHead className="w-20">
                <SortButton active={sort.column === "employee_code"} asc={sort.ascending} onClick={() => sortBy("employee_code")}>
                  ID
                </SortButton>
              </TableHead>
              <TableHead>
                <SortButton active={sort.column === "full_name"} asc={sort.ascending} onClick={() => sortBy("full_name")}>
                  Name
                </SortButton>
              </TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <SortButton active={sort.column === "last_active_at"} asc={sort.ascending} onClick={() => sortBy("last_active_at")}>
                  Last active
                </SortButton>
              </TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && rows.length === 0 ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={`s-${i}`}>
                  <TableCell colSpan={9}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-16 text-center text-sm text-muted-foreground">
                  No employees match your filters.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => {
                const checked = selection.has(r.id);
                return (
                  <TableRow
                    key={r.id}
                    data-state={checked ? "selected" : undefined}
                    className="group"
                  >
                    <TableCell>
                      <Checkbox
                        aria-label={`Select ${r.full_name}`}
                        checked={checked}
                        onCheckedChange={() => toggleOne(r.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {r.employee_code}
                    </TableCell>
                    <TableCell>
                      <Link
                        to="/employees/$employeeId"
                        params={{ employeeId: r.id }}
                        className="flex items-center gap-3 hover:opacity-90"
                      >
                        <EmployeeAvatar name={r.full_name} src={r.avatar_url} size="sm" />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{r.full_name}</div>
                          <div className="truncate text-xs text-muted-foreground">{r.email}</div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">{r.department?.name ?? "—"}</TableCell>
                    <TableCell className="text-sm">{r.role_title ?? "—"}</TableCell>
                    <TableCell className="text-sm">
                      {r.manager ? r.manager.full_name : "—"}
                    </TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatRelative(r.last_active_at ?? r.updated_at)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100"
                            aria-label={`Actions for ${r.full_name}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link to="/employees/$employeeId" params={{ employeeId: r.id }}>
                              <UserRound className="mr-2 h-4 w-4" /> Open profile
                            </Link>
                          </DropdownMenuItem>
                          {canManageEmployees && (
                            <>
                              <DropdownMenuSeparator />
                              {r.status !== "archived" ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    setStatus.mutate({ id: r.id, status: "archived" })
                                  }
                                >
                                  <Archive className="mr-2 h-4 w-4" /> Archive
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() =>
                                    setStatus.mutate({ id: r.id, status: "active" })
                                  }
                                >
                                  <Undo2 className="mr-2 h-4 w-4" /> Restore
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                          {canDeleteEmployees && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setConfirmDelete(r);
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete permanently
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {confirmDelete?.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the employee record. Consider archiving instead — that
              preserves history and can be restored.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={cn("bg-destructive text-destructive-foreground hover:bg-destructive/90")}
              onClick={() => {
                if (confirmDelete) del.mutate(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SortButton({
  active,
  asc,
  onClick,
  children,
}: {
  active: boolean;
  asc: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground",
        active && "text-foreground",
      )}
    >
      {children}
      <ArrowUpDown className={cn("h-3 w-3 transition-transform", active && (asc ? "" : "rotate-180"))} />
    </button>
  );
}