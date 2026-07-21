import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plug, Plus, Search, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  TOOL_AUTH_TYPES, TOOL_ENVIRONMENTS, TOOL_STATUSES,
  useCreateTool, useDeleteTool, useToolsQuery,
  type ToolAuthType, type ToolEnvironment, type ToolStatus,
} from "@/lib/tools/service";
import { useCan } from "@/lib/rbac";

export const Route = createFileRoute("/_authenticated/tools")({ component: ToolsPage });

function ToolsPage() {
  const { canManageEmployees, isAdmin } = useCan();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const q = useToolsQuery({ search: search || undefined });
  const create = useCreateTool();
  const del = useDeleteTool();
  const rows = q.data ?? [];

  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [auth, setAuth] = useState<ToolAuthType>("none");
  const [status, setStatus] = useState<ToolStatus>("inactive");
  const [env, setEnv] = useState<ToolEnvironment>("production");
  const [runtime, setRuntime] = useState(false);

  const submit = async () => {
    await create.mutateAsync({ name, provider, auth_type: auth, status, environment: env, runtime_ready: runtime });
    setOpen(false); setName(""); setProvider("");
  };

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Tool Registry"
        description="Centralized registry of every external and internal tool a brain can call."
        actions={canManageEmployees ? <Button onClick={() => setOpen(true)} className="bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]"><Plus className="mr-2 h-4 w-4" /> New tool</Button> : null}
      />
      <div className="mb-4 relative min-w-[240px] max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tools…" className="h-9 pl-9" />
      </div>

      {rows.length === 0 && !q.isLoading ? (
        <EmptyState icon={Plug} title="No tools yet" description="Register a tool your brains can eventually call." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((t) => (
            <Card key={t.id}><CardContent className="space-y-2 pt-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.provider} · {t.auth_type}</p>
                </div>
                {isAdmin && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => del.mutate(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="text-[11px]">{t.status}</Badge>
                <Badge variant="outline" className="text-[11px]">{t.environment}</Badge>
                <Badge variant="outline" className="text-[11px]">Health: {t.health}</Badge>
                {t.runtime_ready && <Badge className="bg-primary/15 text-primary text-[11px]">Runtime</Badge>}
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Register tool</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Provider</Label><Input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="e.g. slack, google" /></div>
              <div className="space-y-1.5"><Label>Auth</Label>
                <Select value={auth} onValueChange={(x) => setAuth(x as ToolAuthType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TOOL_AUTH_TYPES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Status</Label>
                <Select value={status} onValueChange={(x) => setStatus(x as ToolStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TOOL_STATUSES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Environment</Label>
                <Select value={env} onValueChange={(x) => setEnv(x as ToolEnvironment)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TOOL_ENVIRONMENTS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div><Label>Runtime ready</Label><p className="text-xs text-muted-foreground">Prepared for future MCP / runtime</p></div>
              <Switch checked={runtime} onCheckedChange={setRuntime} />
            </div>
          </div>
          <DialogFooter><Button onClick={submit} disabled={!name.trim() || !provider.trim() || create.isPending}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}