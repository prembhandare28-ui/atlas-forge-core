import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Copy, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  KNOWLEDGE_CATEGORIES, KNOWLEDGE_SOURCE_TYPES,
  useCreateKnowledgePack, useDeleteKnowledgePack, useDuplicateKnowledgePack, useKnowledgePacksQuery,
  type KnowledgeCategory, type KnowledgeSourceType,
} from "@/lib/knowledge/service";
import { formatRelative } from "@/lib/employees/constants";
import { useCan } from "@/lib/rbac";

export const Route = createFileRoute("/_authenticated/knowledge")({ component: KnowledgePage });

function KnowledgePage() {
  const { canManageEmployees, canDeleteEmployees } = useCan();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const q = useKnowledgePacksQuery({ search: search || undefined });
  const create = useCreateKnowledgePack();
  const dup = useDuplicateKnowledgePack();
  const del = useDeleteKnowledgePack();
  const rows = q.data ?? [];

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState<KnowledgeCategory>("general");
  const [source, setSource] = useState<KnowledgeSourceType>("text");
  const [content, setContent] = useState("");

  const submit = async () => {
    await create.mutateAsync({ name, description: desc, category, source_type: source, content });
    setOpen(false); setName(""); setDesc(""); setContent("");
  };

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Knowledge Engine"
        description="Reusable knowledge packs — attach to any brain, employee, or workflow."
        actions={canManageEmployees ? <Button onClick={() => setOpen(true)} className="bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]"><Plus className="mr-2 h-4 w-4" /> New pack</Button> : null}
      />

      <div className="mb-4 flex items-center gap-2">
        <div className="relative min-w-[240px] flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search knowledge…" className="h-9 pl-9" />
        </div>
      </div>

      {rows.length === 0 && !q.isLoading ? (
        <EmptyState icon={BookOpen} title="No knowledge yet" description="Create your first pack — SOPs, FAQs, pricing, policies, notes." />
      ) : (
        <div className="rounded-xl border bg-card/40">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Source</TableHead>
              <TableHead>Status</TableHead><TableHead>Version</TableHead><TableHead>Updated</TableHead><TableHead className="w-12" />
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((k) => (
                <TableRow key={k.id}>
                  <TableCell className="text-sm font-medium">{k.name}<div className="line-clamp-1 text-xs text-muted-foreground">{k.description}</div></TableCell>
                  <TableCell><Badge variant="secondary" className="text-[11px]">{k.category}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{k.source_type}</TableCell>
                  <TableCell className="text-xs">{k.status}</TableCell>
                  <TableCell className="font-mono text-xs">v{k.version}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatRelative(k.updated_at)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canManageEmployees && <DropdownMenuItem onClick={() => dup.mutate(k.id)}><Copy className="mr-2 h-4 w-4" /> Duplicate</DropdownMenuItem>}
                        {canDeleteEmployees && <><DropdownMenuSeparator /><DropdownMenuItem className="text-destructive" onClick={() => del.mutate(k.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem></>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>New knowledge pack</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Category</Label>
                <Select value={category} onValueChange={(x) => setCategory(x as KnowledgeCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{KNOWLEDGE_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Source</Label>
                <Select value={source} onValueChange={(x) => setSource(x as KnowledgeSourceType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{KNOWLEDGE_SOURCE_TYPES.map((c) => <SelectItem key={c.value} value={c.value} disabled={c.future}>{c.label}{c.future ? " (soon)" : ""}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Content</Label><Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} /></div>
          </div>
          <DialogFooter><Button onClick={submit} disabled={!name.trim() || create.isPending}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}