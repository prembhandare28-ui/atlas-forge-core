import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  ClipboardCheck,
  Info,
  Loader2,
  ListChecks,
  Zap,
  Workflow as WorkflowIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import {
  workflowFormSchema,
  type WorkflowFormValues,
} from "@/lib/workflows/schemas";
import {
  WORKFLOW_CATEGORIES,
  WORKFLOW_TRIGGERS,
  workflowLabelFor,
} from "@/lib/workflows/constants";
import { EMPLOYEE_PRIORITIES } from "@/lib/employees/constants";
import { useCreateWorkflow } from "@/lib/workflows/hooks";
import {
  useDepartmentsQuery,
  useManagerOptionsQuery,
} from "@/lib/employees/hooks";
import { StepListEditor } from "./step-list-editor";

const STEPS = [
  { id: 1, title: "Basics", icon: Info, description: "Name, category, owner" },
  { id: 2, title: "Trigger", icon: Zap, description: "How it starts" },
  { id: 3, title: "Builder", icon: ListChecks, description: "Design the steps" },
  { id: 4, title: "Review", icon: ClipboardCheck, description: "Confirm & save" },
] as const;

const NONE = "__none__";

const DEFAULT_VALUES: WorkflowFormValues = {
  name: "",
  description: "",
  department_id: null,
  category: "operations",
  priority: "medium",
  owner_id: null,
  trigger_type: "manual",
  trigger_schedule: "",
  trigger_notes: "",
  steps: [],
  assignments: [],
};

export function WorkflowWizard({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [step, setStep] = useState(1);
  const form = useForm<WorkflowFormValues>({
    resolver: zodResolver(workflowFormSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onBlur",
  });
  const { data: departments = [] } = useDepartmentsQuery();
  const { data: employees = [] } = useManagerOptionsQuery();
  const create = useCreateWorkflow();

  useEffect(() => {
    if (!open) {
      form.reset(DEFAULT_VALUES);
      setStep(1);
    }
  }, [open, form]);

  const values = form.watch();
  const totalMinutes = values.steps.reduce(
    (sum, s) => sum + (s.estimated_minutes ?? 0),
    0,
  );

  const validateStep = async (): Promise<boolean> => {
    if (step === 1) return form.trigger(["name", "description", "category", "priority"]);
    if (step === 2) return form.trigger(["trigger_type", "trigger_schedule", "trigger_notes"]);
    if (step === 3) return form.trigger(["steps"]);
    return true;
  };

  const next = async () => {
    if (await validateStep()) setStep((s) => Math.min(4, s + 1));
  };
  const back = () => setStep((s) => Math.max(1, s - 1));

  const submit = form.handleSubmit(async (data) => {
    await create.mutateAsync(data);
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <WorkflowIcon className="h-5 w-5 text-primary" /> Workflow Studio
          </DialogTitle>
          <DialogDescription>
            Design a revenue workflow — human, AI, or hybrid can execute it.
          </DialogDescription>
        </DialogHeader>

        <ol className="flex items-center gap-2 border-b px-6 py-4 overflow-x-auto">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const active = step === s.id;
            const done = step > s.id;
            return (
              <li key={s.id} className="flex min-w-0 flex-1 items-center gap-2">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                    active && "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-glow)]",
                    done && "border-primary bg-primary/10 text-primary",
                    !active && !done && "border-border bg-muted/40 text-muted-foreground",
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <div className="hidden min-w-0 md:block">
                  <div className={cn("truncate text-xs font-medium", active ? "text-foreground" : "text-muted-foreground")}>
                    {s.title}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">{s.description}</div>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          {step === 1 && (
            <div className="space-y-4">
              <Field label="Workflow name" required error={form.formState.errors.name?.message}>
                <Input {...form.register("name")} placeholder="Enterprise deal handoff" />
              </Field>
              <Field label="Description">
                <Textarea rows={3} {...form.register("description")} placeholder="What this workflow accomplishes…" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Department">
                  <Select
                    value={values.department_id ?? NONE}
                    onValueChange={(v) =>
                      form.setValue("department_id", v === NONE ? null : v, { shouldDirty: true })
                    }
                  >
                    <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Unassigned</SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Category" required>
                  <Select
                    value={values.category}
                    onValueChange={(v) => form.setValue("category", v as WorkflowFormValues["category"], { shouldDirty: true })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WORKFLOW_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Priority" required>
                  <Select
                    value={values.priority}
                    onValueChange={(v) => form.setValue("priority", v as WorkflowFormValues["priority"], { shouldDirty: true })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EMPLOYEE_PRIORITIES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Owner (fallback: you)">
                  <Select
                    value={values.owner_id ?? NONE}
                    onValueChange={(v) => form.setValue("owner_id", v === NONE ? null : v, { shouldDirty: true })}
                  >
                    <SelectTrigger><SelectValue placeholder="Choose owner" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Current user</SelectItem>
                      {employees.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.full_name} <span className="text-muted-foreground">· {e.employee_code}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <Label className="text-xs font-medium">Trigger type</Label>
                <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-3">
                  {WORKFLOW_TRIGGERS.map((t) => {
                    const selected = values.trigger_type === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() =>
                          form.setValue("trigger_type", t.value, { shouldDirty: true })
                        }
                        className={cn(
                          "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all",
                          selected
                            ? "border-primary bg-primary/5 shadow-[var(--shadow-glow)]"
                            : "hover:border-foreground/20 hover:bg-muted/40",
                          t.future && "opacity-80",
                        )}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="text-sm font-medium">{t.label}</span>
                          {t.future ? (
                            <Badge variant="outline" className="text-[10px]">Soon</Badge>
                          ) : null}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{t.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
              {values.trigger_type === "schedule" && (
                <Field label="Schedule">
                  <Input
                    {...form.register("trigger_schedule")}
                    placeholder="Every Monday 9am — or a cron expression"
                  />
                </Field>
              )}
              <Field label="Notes (optional)">
                <Textarea rows={3} {...form.register("trigger_notes")} placeholder="Context, business rules, integration ids…" />
              </Field>
            </div>
          )}

          {step === 3 && (
            <StepListEditor
              form={form}
              employees={employees}
            />
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div className="rounded-2xl border bg-card/40 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">{values.name || "Untitled workflow"}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {values.description || "No description."}
                    </p>
                  </div>
                  <Badge variant="outline">Draft</Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <SummaryTile label="Category" value={workflowLabelFor(WORKFLOW_CATEGORIES, values.category)} />
                  <SummaryTile label="Priority" value={workflowLabelFor(EMPLOYEE_PRIORITIES, values.priority)} />
                  <SummaryTile label="Trigger" value={workflowLabelFor(WORKFLOW_TRIGGERS, values.trigger_type)} />
                  <SummaryTile
                    label="Est. duration"
                    value={totalMinutes ? `${totalMinutes} min` : "—"}
                  />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium">Steps ({values.steps.length})</h4>
                <ol className="mt-2 space-y-2">
                  {values.steps.map((s, i) => (
                    <li key={i} className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                      <span className="mt-0.5 font-mono text-xs text-muted-foreground">{i + 1}</span>
                      <div className="flex-1">
                        <div className="font-medium">{s.title || "Untitled step"}</div>
                        {s.description ? (
                          <div className="text-xs text-muted-foreground">{s.description}</div>
                        ) : null}
                      </div>
                      <Badge variant="secondary" className="text-[10px] uppercase">
                        {s.step_type}
                      </Badge>
                    </li>
                  ))}
                  {values.steps.length === 0 && (
                    <p className="text-xs text-muted-foreground">No steps added.</p>
                  )}
                </ol>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-row items-center justify-between border-t bg-muted/20 px-6 py-3">
          <Button type="button" variant="ghost" onClick={back} disabled={step === 1}>
            Back
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Step {step} of {STEPS.length}
            </span>
            {step < STEPS.length ? (
              <Button type="button" onClick={next}>Continue</Button>
            ) : (
              <Button
                type="button"
                onClick={submit}
                disabled={create.isPending}
                className="bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]"
              >
                {create.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…
                  </>
                ) : (
                  "Create workflow"
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-medium">{value}</div>
    </div>
  );
}