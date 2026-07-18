import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Archive,
  Search,
  Settings2,
  Undo2,
  UserPlus,
  X,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { EmployeeWizard } from "@/components/employees/employee-wizard";
import {
  EmployeesTable,
  type SortState,
} from "@/components/employees/employees-table";
import { MultiFilter } from "@/components/employees/employees-filters";
import {
  EMPLOYEE_STATUSES,
  EMPLOYMENT_TYPES,
} from "@/lib/employees/constants";
import {
  useDepartmentsQuery,
  useEmployeesQuery,
  useManagerOptionsQuery,
  useSetEmployeeStatus,
} from "@/lib/employees/hooks";
import { useCan } from "@/lib/rbac";

export const Route = createFileRoute("/_authenticated/employees")({
  validateSearch: (search: Record<string, unknown>) => {
    const asArray = (v: unknown): string[] => {
      if (Array.isArray(v)) return v.map(String);
      if (typeof v === "string" && v.length) return v.split(",");
      return [];
    };
    return {
      status: asArray(search.status),
      kind: asArray(search.kind),
      department: asArray(search.department),
    };
  },
  component: EmployeesPage,
});

type ColumnKey =
  | "employee_code"
  | "department"
  | "role"
  | "manager"
  | "status"
  | "last_active";

const COLUMN_OPTIONS: { key: ColumnKey; label: string }[] = [
  { key: "employee_code", label: "Employee ID" },
  { key: "department", label: "Department" },
  { key: "role", label: "Role" },
  { key: "manager", label: "Manager" },
  { key: "status", label: "Status" },
  { key: "last_active", label: "Last active" },
];

function EmployeesPage() {
  const { canManageEmployees } = useCan();
  const initial = Route.useSearch();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string[]>(initial.department ?? []);
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const [managerFilter, setManagerFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>(initial.status ?? []);
  const [employmentFilter, setEmploymentFilter] = useState<string[]>([]);
  const [kindFilter, setKindFilter] = useState<string[]>(initial.kind ?? []);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState<SortState>({ column: "created_at", ascending: false });
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [hiddenColumns, setHiddenColumns] = useState<Set<ColumnKey>>(new Set());

  const { data: departments = [] } = useDepartmentsQuery();
  const { data: managers = [] } = useManagerOptionsQuery();

  // Sync when navigating between dashboard cards while the page is mounted.
  useEffect(() => {
    setStatusFilter(initial.status ?? []);
    setKindFilter(initial.kind ?? []);
    setDeptFilter(initial.department ?? []);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.status?.join(","), initial.kind?.join(","), initial.department?.join(",")]);

  const query = useEmployeesQuery({
    search: search || undefined,
    departmentIds: deptFilter.length ? deptFilter : undefined,
    managerIds: managerFilter.length ? managerFilter : undefined,
    statuses: statusFilter.length ? (statusFilter as never) : undefined,
    employmentTypes: employmentFilter.length ? (employmentFilter as never) : undefined,
    kinds: kindFilter.length ? (kindFilter as never) : undefined,
    page,
    pageSize,
    sort,
  });

  const rows = query.data?.rows ?? [];
  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const roleOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.role_title && set.add(r.role_title));
    return Array.from(set).sort().map((r) => ({ value: r, label: r }));
  }, [rows]);

  // Role filter is client-side (union of visible page roles); keep as post-filter.
  const filteredRows = roleFilter.length
    ? rows.filter((r) => r.role_title && roleFilter.includes(r.role_title))
    : rows;

  const setStatus = useSetEmployeeStatus();

  const activeFiltersCount =
    deptFilter.length +
    roleFilter.length +
    managerFilter.length +
    statusFilter.length +
    employmentFilter.length +
    (search ? 1 : 0);

  const clearFilters = () => {
    setSearch("");
    setDeptFilter([]);
    setRoleFilter([]);
    setManagerFilter([]);
    setStatusFilter([]);
    setEmploymentFilter([]);
    setPage(1);
  };

  const selectedIds = Array.from(selection);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Employees"
        description="Your unified workforce directory — human today, AI-ready tomorrow."
        actions={
          canManageEmployees ? (
            <Button
              className="bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]"
              onClick={() => setWizardOpen(true)}
            >
              <UserPlus className="mr-2 h-4 w-4" /> Add employee
            </Button>
          ) : null
        }
      />

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search name, email, ID, role…"
              className="h-9 pl-9"
              aria-label="Search employees"
            />
          </div>
          <MultiFilter
            label="Department"
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
            value={deptFilter}
            onChange={(v) => {
              setDeptFilter(v);
              setPage(1);
            }}
          />
          <MultiFilter
            label="Role"
            options={roleOptions}
            value={roleFilter}
            onChange={setRoleFilter}
          />
          <MultiFilter
            label="Manager"
            options={managers.map((m) => ({ value: m.id, label: m.full_name }))}
            value={managerFilter}
            onChange={(v) => {
              setManagerFilter(v);
              setPage(1);
            }}
          />
          <MultiFilter
            label="Status"
            options={EMPLOYEE_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          />
          <MultiFilter
            label="Employment"
            options={EMPLOYMENT_TYPES.map((s) => ({ value: s.value, label: s.label }))}
            value={employmentFilter}
            onChange={(v) => {
              setEmploymentFilter(v);
              setPage(1);
            }}
          />
          {activeFiltersCount > 0 ? (
            <Button variant="ghost" size="sm" className="h-9" onClick={clearFilters}>
              <X className="mr-1.5 h-3.5 w-3.5" /> Reset
            </Button>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Settings2 className="mr-2 h-4 w-4" /> Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-xs">Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {COLUMN_OPTIONS.map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.key}
                  checked={!hiddenColumns.has(c.key)}
                  onCheckedChange={(v) => {
                    const next = new Set(hiddenColumns);
                    if (v) next.delete(c.key);
                    else next.add(c.key);
                    setHiddenColumns(next);
                  }}
                >
                  {c.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.length > 0 && canManageEmployees ? (
        <div className="mb-3 flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-sm animate-in fade-in slide-in-from-top-1">
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground">{selectedIds.length}</span> selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                selectedIds.forEach((id) => setStatus.mutate({ id, status: "archived" }));
                setSelection(new Set());
              }}
            >
              <Archive className="mr-2 h-3.5 w-3.5" /> Archive
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                selectedIds.forEach((id) => setStatus.mutate({ id, status: "active" }));
                setSelection(new Set());
              }}
            >
              <Undo2 className="mr-2 h-3.5 w-3.5" /> Restore
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelection(new Set())}>
              Clear
            </Button>
          </div>
        </div>
      ) : null}

      <EmployeesTable
        rows={filteredRows}
        loading={query.isLoading}
        sort={sort}
        onSortChange={setSort}
        selection={selection}
        onSelectionChange={setSelection}
        hiddenColumns={hiddenColumns}
      />

      {/* Pagination */}
      <div className="mt-4 flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground sm:flex-row">
        <div>
          {total === 0
            ? "0 employees"
            : `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
            <SelectTrigger className="h-8 w-[92px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="tabular-nums">
            Page {page} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>

      <EmployeeWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}