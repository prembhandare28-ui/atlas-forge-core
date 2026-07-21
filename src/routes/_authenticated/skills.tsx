import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  SKILL_CATEGORIES, SKILL_DIFFICULTIES,
  useCreateSkill, useDeleteSkill, useSkillsQuery,
  type SkillCategory, type SkillDifficulty,
} from "@/lib/skills/service";
import { useCan } from "@/lib/rbac";

export const Route = createFileRoute("/_authenticated/skills")({ component: SkillsPage });

function SkillsPage() {
  const { canManageEmployees, canDeleteEmployees } = useCan();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const q = useSkillsQuery({ search: search || undefined });
  const create = useCreateSkill();
  const del = useDeleteSkill();
  const skills = q.data ?? [];

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState<SkillCategory>("custom");
  const [diff, setDiff] = useState<SkillDifficulty>("intermediate");

  const submit = async () => {
    await create.mutateAsync({ name, description: desc, category: cat, difficulty: diff });
    setOpen(false); setName(""); setDesc("");
  };

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Skills Library"
        description="Reusable skills — shared across brains and employees."
        actions={canManageEmployees ? <Button onClick={() => setOpen(true)} className="bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]"><Plus className="mr-2 h-4 w-4" /> New skill</Button> : null}
      />
      <div className="mb-4 relative min-w-[240px] max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search skills…" className="h-9 pl-9" />
      </div>

      {skills.length === 0 && !q.isLoading ? (
        <EmptyState icon={Sparkles} title="No skills yet" description="Add your first skill." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((s) => (
            <Card key={s.id}><CardContent className="space-y-2 pt-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{s.name}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{s.description ?? "—"}</p>
                </div>
                {canDeleteEmployees && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => del.mutate(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="text-[11px]">{s.category}</Badge>
                <Badge variant="outline" className="text-[11px]">{s.difficulty}</Badge>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New skill</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Category</Label>
                <Select value={cat} onValueChange={(x) => setCat(x as SkillCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SKILL_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Difficulty</Label>
                <Select value={diff} onValueChange={(x) => setDiff(x as SkillDifficulty)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SKILL_DIFFICULTIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter><Button onClick={submit} disabled={!name.trim() || create.isPending}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}