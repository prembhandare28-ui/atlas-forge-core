import { useState } from "react";
import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { StringListEditor } from "@/components/shared/string-list-editor";
import {
  BRAIN_CATEGORIES, BRAIN_DECISION_STYLES, BRAIN_RESPONSE_DEPTHS, BRAIN_TONES, BRAIN_VISIBILITIES,
} from "@/lib/brains/constants";
import { brainFormDefaults, type BrainFormValues } from "@/lib/brains/schemas";
import { useCreateBrain } from "@/lib/brains/hooks";

const STEPS = ["Identity", "Mission", "Behaviour", "Rules", "Memory", "Review"] as const;

export function BrainWizard({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [step, setStep] = useState(0);
  const [v, setV] = useState<BrainFormValues>(brainFormDefaults);
  const create = useCreateBrain();
  const set = <K extends keyof BrainFormValues>(k: K, val: BrainFormValues[K]) =>
    setV((prev) => ({ ...prev, [k]: val }));

  const reset = () => { setStep(0); setV(brainFormDefaults); };
  const submit = async () => {
    await create.mutateAsync(v);
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" /> New Brain — {STEPS[step]}
          </DialogTitle>
          <DialogDescription>Step {step + 1} of {STEPS.length}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {step === 0 && (
            <>
              <Field label="Name"><Input value={v.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Sales Assistant" /></Field>
              <Field label="Description"><Textarea value={v.description ?? ""} onChange={(e) => set("description", e.target.value)} rows={3} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Category">
                  <Select value={v.category} onValueChange={(x) => set("category", x as BrainFormValues["category"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{BRAIN_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Visibility">
                  <Select value={v.visibility} onValueChange={(x) => set("visibility", x as BrainFormValues["visibility"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{BRAIN_VISIBILITIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Tags"><StringListEditor value={v.tags} onChange={(x) => set("tags", x)} placeholder="Add tag" /></Field>
            </>
          )}
          {step === 1 && (
            <>
              <Field label="Primary mission"><Textarea value={v.mission ?? ""} onChange={(e) => set("mission", e.target.value)} rows={3} /></Field>
              <Field label="Goals"><StringListEditor value={v.goals} onChange={(x) => set("goals", x)} placeholder="Add goal" /></Field>
              <Field label="Success definition"><Textarea value={v.success_definition ?? ""} onChange={(e) => set("success_definition", e.target.value)} rows={2} /></Field>
              <Field label="Expected ROI">
                <Input type="number" value={v.expected_roi ?? ""} onChange={(e) => set("expected_roi", e.target.value === "" ? null : Number(e.target.value))} />
              </Field>
            </>
          )}
          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tone">
                  <Select value={v.tone} onValueChange={(x) => set("tone", x as BrainFormValues["tone"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{BRAIN_TONES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Decision style">
                  <Select value={v.decision_style} onValueChange={(x) => set("decision_style", x as BrainFormValues["decision_style"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{BRAIN_DECISION_STYLES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label={`Creativity (${v.creativity_level})`}>
                  <Input type="range" min={0} max={100} value={v.creativity_level} onChange={(e) => set("creativity_level", Number(e.target.value))} />
                </Field>
                <Field label={`Risk (${v.risk_level})`}>
                  <Input type="range" min={0} max={100} value={v.risk_level} onChange={(e) => set("risk_level", Number(e.target.value))} />
                </Field>
              </div>
              <Field label="Response depth">
                <Select value={v.response_depth} onValueChange={(x) => set("response_depth", x as BrainFormValues["response_depth"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{BRAIN_RESPONSE_DEPTHS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </>
          )}
          {step === 3 && (
            <>
              <Field label="Always do"><StringListEditor value={v.always_do} onChange={(x) => set("always_do", x)} placeholder="Add rule" /></Field>
              <Field label="Never do"><StringListEditor value={v.never_do} onChange={(x) => set("never_do", x)} placeholder="Add rule" /></Field>
              <Field label="Escalation rules"><Textarea value={v.escalation_rules ?? ""} onChange={(e) => set("escalation_rules", e.target.value)} rows={2} /></Field>
              <Field label="Approval rules"><Textarea value={v.approval_rules ?? ""} onChange={(e) => set("approval_rules", e.target.value)} rows={2} /></Field>
            </>
          )}
          {step === 4 && (
            <>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div><Label>Session memory</Label><p className="text-xs text-muted-foreground">Remember within a session</p></div>
                <Switch checked={v.session_memory_enabled} onCheckedChange={(x) => set("session_memory_enabled", x)} />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div><Label>Long-term memory</Label><p className="text-xs text-muted-foreground">Persist across sessions</p></div>
                <Switch checked={v.long_term_memory_enabled} onCheckedChange={(x) => set("long_term_memory_enabled", x)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Context window (tokens)">
                  <Input type="number" value={v.context_window_tokens} onChange={(e) => set("context_window_tokens", Number(e.target.value))} />
                </Field>
                <Field label="Retention (days)">
                  <Input type="number" value={v.memory_retention_days} onChange={(e) => set("memory_retention_days", Number(e.target.value))} />
                </Field>
              </div>
            </>
          )}
          {step === 5 && (
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Name:</span> {v.name || "—"}</p>
              <p><span className="text-muted-foreground">Category:</span> {v.category}</p>
              <p><span className="text-muted-foreground">Tone / Style:</span> {v.tone} · {v.decision_style} · {v.response_depth}</p>
              <p><span className="text-muted-foreground">Goals:</span> {v.goals.length}</p>
              <p><span className="text-muted-foreground">Rules:</span> {v.always_do.length + v.never_do.length}</p>
              <p><span className="text-muted-foreground">Memory:</span> session {v.session_memory_enabled ? "on" : "off"} · long-term {v.long_term_memory_enabled ? "on" : "off"}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between gap-2">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Back</Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={step === 0 && !v.name.trim()}>Continue</Button>
          ) : (
            <Button onClick={submit} disabled={create.isPending} className="bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
              {create.isPending ? "Creating…" : "Create brain"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}