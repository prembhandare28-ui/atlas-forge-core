import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain, Copy, MoreHorizontal, Plus, Search, Trash2, X } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MultiFilter } from "@/components/employees/employees-filters";
import { BrainStatusBadge } from "@/components/brains/brain-status-badge";
import { BrainWizard } from "@/components/brains/brain-wizard";
import { BRAIN_CATEGORIES, BRAIN_STATUSES, labelFor } from "@/lib/brains/constants";
import { useBrainsQuery, useCloneBrain, useDeleteBrain } from "@/lib/brains/hooks";
import { formatRelative } from "@/lib/employees/constants";
import { useCan } from "@/lib/rbac";

export const Route = createFileRoute("/_authenticated/brains")({ component: BrainsPage });

function BrainsPage() {
  const { canManageEmployees, canDeleteEmployees } = useCan();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [cats, setCats] = useState<string[]>([]);
  const [sts, setSts] = useState<string[]>([]);
  const clone = useCloneBrain();
  const del = useDeleteBrain();

  const q = useBrainsQuery({
    search: search || undefined,
    categories: cats.length ? (cats as never) : undefined,
    statuses: sts.length ? (sts as never) : undefined,
  });
  const rows = q.data?.rows ?? [];
  const total = q.data?.total ?? 0;
  const active = cats.length + sts.length + (search ? 1 : 0);
  const showEmpty = !q.isLoading && total === 0 && active === 0;

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Brain Studio"
        description="The operating brain of every intelligent asset — identity, mission, behaviour, knowledge, skills, tools."
        actions={canManageEmployees ? (
          <Button onClick={() => setWizardOpen(true)} className="bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
            <Plus className="mr-2 h-4 w-4" /> New brain
          </Button>
        ) : null}
      />

      {showEmpty ? (
        <EmptyState
          icon={Brain}
          title="No brains yet"
          description="Design your first brain. Assign it to human employees, AI employees, or entire workflows."
          action={canManageEmployees ? (
            <Button onClick={() => setWizardOpen(true)} className="bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
              <Plus className="mr-2 h-4 w-4" /> Create brain
            </Button>
          ) : null}
        />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[240px] flex-1 max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search brains…" className="h-9 pl-9" />
            </div>
            <MultiFilter label="Category" options={BRAIN_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))} value={cats} onChange={setCats} />
            <MultiFilter label="Status" options={BRAIN_STATUSES.map((c) => ({ value: c.value, label: c.label }))} value={sts} onChange={setSts} />
            {active > 0 && (
              <Button variant="ghost" size="sm" className="h-9" onClick={() => { setSearch(""); setCats([]); setSts([]); }}>
                <X className="mr-1.5 h-3.5 w-3.5" /> Reset
              </Button>
            )}
          </div>

          <div className="rounded-xl border bg-card/40">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur">
                <TableRow>
                  <TableHead>Brain</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.isLoading && rows.length === 0 ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="py-14 text-center text-sm text-muted-foreground">No brains match your filters.</TableCell></TableRow>
                ) : rows.map((b) => (
                  <TableRow key={b.id} className="group">
                    <TableCell>
                      <Link to="/brains/$brainId" params={{ brainId: b.id }} className="flex flex-col">
                        <span className="text-sm font-medium">{b.name}</span>
                        {b.description && <span className="line-clamp-1 text-xs text-muted-foreground">{b.description}</span>}
                      </Link>
                    </TableCell>
                    <TableCell><Badge variant="secondary" className="text-[11px]">{labelFor(BRAIN_CATEGORIES, b.category)}</Badge></TableCell>
                    <TableCell><BrainStatusBadge status={b.status} /></TableCell>
                    <TableCell className="font-mono text-xs">v{b.version}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{b.assignments?.length ?? 0}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatRelative(b.updated_at)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to="/brains/$brainId" params={{ brainId: b.id }}>Open</Link>
                          </DropdownMenuItem>
                          {canManageEmployees && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => clone.mutate(b.id)}><Copy className="mr-2 h-4 w-4" /> Clone</DropdownMenuItem>
                            </>
                          )}
                          {canDeleteEmployees && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => del.mutate(b.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <BrainWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}