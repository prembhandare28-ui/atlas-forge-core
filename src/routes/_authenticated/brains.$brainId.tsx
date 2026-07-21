import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Brain as BrainIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingScreen } from "@/components/shared/loading-screen";
import { BrainStatusBadge } from "@/components/brains/brain-status-badge";
import { BRAIN_CATEGORIES, BRAIN_DECISION_STYLES, BRAIN_RESPONSE_DEPTHS, BRAIN_TONES, labelFor } from "@/lib/brains/constants";
import { useBrainActivityQuery, useBrainQuery, useBrainVersionsQuery, useSnapshotBrain } from "@/lib/brains/hooks";
import { formatRelative } from "@/lib/employees/constants";
import { useCan } from "@/lib/rbac";

export const Route = createFileRoute("/_authenticated/brains/$brainId")({ component: BrainDetail });

function BrainDetail() {
  const { brainId } = Route.useParams();
  const { canManageEmployees } = useCan();
  const q = useBrainQuery(brainId);
  const versions = useBrainVersionsQuery(brainId);
  const activity = useBrainActivityQuery(brainId);
  const snap = useSnapshotBrain(brainId);

  if (q.isLoading) return <LoadingScreen />;
  if (!q.data) return <div className="p-8 text-sm text-muted-foreground">Brain not found.</div>;
  const b = q.data;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <Button asChild variant="ghost" size="sm" className="mb-4"><Link to="/brains"><ArrowLeft className="mr-1.5 h-4 w-4" /> All brains</Link></Button>
      <PageHeader
        title={b.name}
        description={b.description ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            <BrainStatusBadge status={b.status} />
            <Badge variant="secondary">v{b.version}</Badge>
            {canManageEmployees && (
              <Button variant="outline" size="sm" onClick={() => snap.mutate(undefined)} disabled={snap.isPending}>
                Snapshot version
              </Button>
            )}
          </div>
        }
      />

      <Tabs defaultValue="overview" className="mt-2">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="behaviour">Behaviour</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><BrainIcon className="h-4 w-4 text-primary" /> Mission</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row k="Category" v={labelFor(BRAIN_CATEGORIES, b.category)} />
              <Row k="Mission" v={b.mission ?? "—"} />
              <Row k="Success" v={b.success_definition ?? "—"} />
              <Row k="Goals" v={b.goals.length ? b.goals.join(" · ") : "—"} />
              <Row k="Expected ROI" v={b.expected_roi != null ? String(b.expected_roi) : "—"} />
              <Row k="Tags" v={b.tags.length ? b.tags.join(", ") : "—"} />
              <Row k="Visibility" v={b.visibility} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behaviour">
          <Card><CardContent className="space-y-2 pt-6 text-sm">
            <Row k="Tone" v={labelFor(BRAIN_TONES, b.tone)} />
            <Row k="Decision style" v={labelFor(BRAIN_DECISION_STYLES, b.decision_style)} />
            <Row k="Response depth" v={labelFor(BRAIN_RESPONSE_DEPTHS, b.response_depth)} />
            <Row k="Creativity" v={`${b.creativity_level}/100`} />
            <Row k="Risk" v={`${b.risk_level}/100`} />
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="rules">
          <Card><CardContent className="space-y-3 pt-6 text-sm">
            <div><p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Always do</p>{b.always_do.length ? <ul className="list-disc pl-5">{b.always_do.map((x) => <li key={x}>{x}</li>)}</ul> : <p className="text-muted-foreground">—</p>}</div>
            <div><p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Never do</p>{b.never_do.length ? <ul className="list-disc pl-5">{b.never_do.map((x) => <li key={x}>{x}</li>)}</ul> : <p className="text-muted-foreground">—</p>}</div>
            <Row k="Escalation" v={b.escalation_rules ?? "—"} />
            <Row k="Approval" v={b.approval_rules ?? "—"} />
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="memory">
          <Card><CardContent className="space-y-2 pt-6 text-sm">
            <Row k="Session memory" v={b.session_memory_enabled ? "Enabled" : "Disabled"} />
            <Row k="Long-term memory" v={b.long_term_memory_enabled ? "Enabled" : "Disabled"} />
            <Row k="Context window" v={`${b.context_window_tokens.toLocaleString()} tokens`} />
            <Row k="Retention" v={`${b.memory_retention_days} days`} />
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="knowledge"><ListCard title="Knowledge packs" empty="No knowledge attached." items={b.knowledge.map((x) => x.pack?.name).filter(Boolean) as string[]} /></TabsContent>
        <TabsContent value="skills"><ListCard title="Skills" empty="No skills attached." items={b.skills.map((x) => x.skill?.name).filter(Boolean) as string[]} /></TabsContent>
        <TabsContent value="tools"><ListCard title="Tools" empty="No tools attached." items={b.tools.map((x) => x.tool?.name).filter(Boolean) as string[]} /></TabsContent>
        <TabsContent value="assignments">
          <Card><CardContent className="space-y-2 pt-6 text-sm">
            {b.assignments.length === 0 ? <p className="text-muted-foreground">Not assigned yet.</p> :
              b.assignments.map((a) => (
                <div key={a.id} className="flex items-center justify-between border-b py-2 last:border-0">
                  <span>{a.target_type === "employee" ? `Employee · ${a.employee?.full_name ?? "?"}` : `Workflow · ${a.workflow?.name ?? "?"}`}</span>
                </div>
              ))}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="versions">
          <Card><CardContent className="space-y-2 pt-6 text-sm">
            {(versions.data ?? []).map((v) => (
              <div key={v.id} className="flex items-center justify-between border-b py-2 last:border-0">
                <div><span className="font-mono">v{v.version}</span> · {v.status} <span className="ml-2 text-muted-foreground">{v.notes ?? ""}</span></div>
                <span className="text-xs text-muted-foreground">{formatRelative(v.created_at)}</span>
              </div>
            ))}
            {(!versions.data || versions.data.length === 0) && <p className="text-muted-foreground">No versions yet.</p>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card><CardContent className="space-y-2 pt-6 text-sm">
            {(activity.data ?? []).map((a) => (
              <div key={a.id} className="flex items-center justify-between border-b py-2 last:border-0">
                <span>{a.action}</span>
                <span className="text-xs text-muted-foreground">{formatRelative(a.created_at)}</span>
              </div>
            ))}
            {(!activity.data || activity.data.length === 0) && <p className="text-muted-foreground">No activity yet.</p>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card><CardContent className="pt-6 text-sm text-muted-foreground">
            Analytics rollups appear here once runtime executions begin.
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="marketplace">
          <Card><CardContent className="space-y-2 pt-6 text-sm">
            <Row k="Marketplace ready" v={b.marketplace_ready ? "Yes" : "No"} />
            <Row k="License" v={b.marketplace_license ?? "—"} />
            <Row k="Pricing model" v={b.marketplace_pricing_model ?? "—"} />
            <Row k="Compatibility" v={b.compatibility_version} />
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b py-2 last:border-0">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{k}</span>
      <span className="text-right text-sm">{v}</span>
    </div>
  );
}

function ListCard({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <Card><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        {items.length ? <div className="flex flex-wrap gap-2">{items.map((x) => <Badge key={x} variant="secondary">{x}</Badge>)}</div> : <p className="text-sm text-muted-foreground">{empty}</p>}
      </CardContent>
    </Card>
  );
}