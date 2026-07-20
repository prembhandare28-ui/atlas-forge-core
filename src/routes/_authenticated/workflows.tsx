import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpDown,
  Copy,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Workflow as WorkflowIcon,
  X,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

import { MultiFilter } from "@/components/employees/employees-filters";
import { WorkflowWizard } from "@/components/workflows/workflow-wizard";
import { WorkflowStatusBadge } from "@/components/workflows/workflow-status-badge";
import {
  WORKFLOW_CATEGORIES,
  WORKFLOW_STATUSES,
  workflowLabelFor,
} from "@/lib/workflows/constants";
import {
  useCloneWorkflow,
  useDeleteWorkflow,
  useWorkflowsQuery,
} from "@/lib/workflows/hooks";
import { useDepartmentsQuery } from "@/lib/employees/hooks";
import { formatRelative } from "@/lib/employees/constants";
import type { WorkflowWithRelations } from "@/lib/workflows/service";
import { useCan } from "@/lib/rbac";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/workflows")({
  component: WorkflowsPage,
});

type Sort = { column: "name" | "updated_at" | "created_at" | "status"; ascending: boolean };

function WorkflowsPage() {
  const { canManageEmployees, canDeleteEmployees } = useCan();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sort, setSort] = useState<Sort>({ column: "updated_at", ascending: false });
  const [confirmDelete, setConfirmDelete] = useState<WorkflowWithRelations | null>(null);

  const { data: departments = [] } = useDepartmentsQuery();
  const clone = useCloneWorkflow();
  const del = useDeleteWorkflow();

  const query = useWorkflowsQuery({
    search: search || undefined,
    departmentIds: deptFilter.length ? deptFilter : undefined,
    categories: categoryFilter.length ? (categoryFilter as never) : undefined,
    statuses: statusFilter.length ? (statusFilter as never) : undefined,
    sort,
  });

  const rows = query.data?.rows ?? [];
  const total = query.data?.total ?? 0;

  const activeFilters =
    deptFilter.length +
    categoryFilter.length +
    statusFilter.length +
    (search ? 1 : 0);

  const clear = () => {
    setSearch("");
    setDeptFilter([]);
    setCategoryFilter([]);
    setStatusFilter([]);
  };

  const sortBy = (column: Sort["column"]) =>
    setSort((s) =>
      s.column === column ? { column, ascending: !s.ascending } : { column, ascending: true },
    );

  const showEmptyState = !query.isLoading && total === 0 && activeFilters === 0;

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Workflows"
        description="Design revenue-generating workflows — human, AI, or hybrid can execute."
        actions={
          canManageEmployees ? (
            <Button
              className="bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]"
              onClick={() => setWizardOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> New workflow
            </Button>
          ) : null
        }
      />

      {showEmptyState ? (
        <EmptyState
          icon={WorkflowIcon}
          title="No workflows yet"
          description="Design your first revenue workflow. You can wire up humans today and swap in AI employees later."
          action={
            canManageEmployees ? (
              <Button
                onClick={() => setWizardOpen(true)}
                className="bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]"
              >
                <Plus className="mr-2 h-4 w-4" /> Create workflow
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="relative min-w-[240px] flex-1 max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search workflows…"
                  className="h-9 pl-9"
                />
              </div>
              <MultiFilter
                label="Department"
                options={departments.map((d) => ({ value: d.id, label: d.name }))}
                value={deptFilter}
                onChange={setDeptFilter}
              />
              <MultiFilter
                label="Category"
                options={WORKFLOW_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
                value={categoryFilter}
                onChange={setCategoryFilter}
              />
              <MultiFilter
                label="Status"
                options={WORKFLOW_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
                value={statusFilter}
                onChange={setStatusFilter}
              />
              {activeFilters > 0 && (
                <Button variant="ghost" size="sm" className="h-9" onClick={clear}>
                  <X className="mr-1.5 h-3.5 w-3.5" /> Reset
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-card/40">
            <div className="max-h-[calc(100vh-320px)] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur">
                  <TableRow>
                    <TableHead>
                      <SortButton
                        active={sort.column === "name"}
                        asc={sort.ascending}
                        onClick={() => sortBy("name")}
                      >
                        Workflow
                      </SortButton>
                    </TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>
                      <SortButton
                        active={sort.column === "status"}
                        asc={sort.ascending}
                        onClick={() => sortBy("status")}
                      >
                        Status
                      </SortButton>
                    </TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead>
                      <SortButton
                        active={sort.column === "updated_at"}
                        asc={sort.ascending}
                        onClick={() => sortBy("updated_at")}
                      >
                        Updated
                      </SortButton>
                    </TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Runs</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.isLoading && rows.length === 0 ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={`s-${i}`}>
                        <TableCell colSpan={9}>
                          <Skeleton className="h-8 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-14 text-center text-sm text-muted-foreground">
                        No workflows match your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((w) => (
                      <WorkflowRow
                        key={w.id}
                        workflow={w}
                        canManage={canManageEmployees}
                        canDelete={canDeleteEmployees}
                        onClone={() => clone.mutate(w.id)}
                        onDelete={() => setConfirmDelete(w)}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      <WorkflowWizard open={wizardOpen} onOpenChange={setWizardOpen} />

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{confirmDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Removes the workflow, its steps, assignments, and version history.
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

function WorkflowRow({
  workflow,
  canManage,
  canDelete,
  onClone,
  onDelete,
}: {
  workflow: WorkflowWithRelations;
  canManage: boolean;
  canDelete: boolean;
  onClone: () => void;
  onDelete: () => void;
}) {
  const assignmentCount = workflow.assignments?.length ?? 0;
  const assignedPreview = useMemo(
    () =>
      (workflow.assignments ?? [])
        .slice(0, 2)
        .map((a) => a.employee?.full_name)
        .filter(Boolean)
        .join(", "),
    [workflow.assignments],
  );
  return (
    <TableRow className="group">
      <TableCell>
        <Link
          to="/workflows/$workflowId"
          params={{ workflowId: workflow.id }}
          className="flex flex-col hover:opacity-90"
        >
          <span className="text-sm font-medium">{workflow.name}</span>
          {workflow.description ? (
            <span className="line-clamp-1 text-xs text-muted-foreground">
              {workflow.description}
            </span>
          ) : null}
        </Link>
      </TableCell>
      <TableCell className="text-sm">{workflow.department?.name ?? "—"}</TableCell>
      <TableCell>
        <Badge variant="secondary" className="text-[11px]">
          {workflowLabelFor(WORKFLOW_CATEGORIES, workflow.category)}
        </Badge>
      </TableCell>
      <TableCell>
        <WorkflowStatusBadge status={workflow.status} />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {assignmentCount === 0
          ? "Unassigned"
          : assignmentCount <= 2
            ? assignedPreview
            : `${assignedPreview} +${assignmentCount - 2}`}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {formatRelative(workflow.updated_at)}
      </TableCell>
      <TableCell className="font-mono text-xs">v{workflow.version}</TableCell>
      <TableCell className="tabular-nums text-xs text-muted-foreground">
        {workflow.execution_count}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100"
              aria-label="Actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link to="/workflows/$workflowId" params={{ workflowId: workflow.id }}>
                Open
              </Link>
            </DropdownMenuItem>
            {canManage && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onClone}>
                  <Copy className="mr-2 h-4 w-4" /> Clone
                </DropdownMenuItem>
              </>
            )}
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    onDelete();
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
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
      <ArrowUpDown className={cn("h-3 w-3", active && (asc ? "" : "rotate-180"))} />
    </button>
  );
}