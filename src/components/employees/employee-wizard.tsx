import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2, Plus, X, Check,
  Building2, User2, Sparkles, ClipboardCheck,
  DollarSign, Bot, Users2, Zap,
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
  employeeFormSchema,
  type EmployeeFormValues,
} from "@/lib/employees/schemas";
import {
  EMPLOYMENT_TYPES,
  EMPLOYEE_KINDS,
  EMPLOYEE_STATUSES,
  EMPLOYEE_PRIORITIES,
  EXPERIENCE_LEVELS,
  REVENUE_CATEGORIES,
  labelFor,
} from "@/lib/employees/constants";
import {
  useCreateEmployee,
  useDepartmentsQuery,
  useManagerOptionsQuery,
} from "@/lib/employees/hooks";
import { isEmailTaken, uploadEmployeePhoto } from "@/lib/employees/service";
import { AvatarUploader } from "./avatar-uploader";

const STEPS = [
  { id: 1, title: "Identity", icon: User2, description: "Who they are" },
  { id: 2, title: "Organization", icon: Building2, description: "Team & role" },
  { id: 3, title: "Skills", icon: Sparkles, description: "Skills & KPIs" },
  { id: 4, title: "Revenue", icon: DollarSign, description: "Revenue configuration" },
  { id: 5, title: "Review", icon: ClipboardCheck, description: "Confirm & create" },
] as const;

const NULLABLE_MANAGER = "__none__";
const NULLABLE_DEPT = "__none__";

const DEFAULT_VALUES: EmployeeFormValues = {
  full_name: "",
  email: "",
  phone: "",
  avatar_url: null,
  kind: "human",
  status: "active",
  department_id: null,
  role_title: "",
  manager_id: null,
  employment_type: "full_time",
  location: "",
  timezone: "",
  responsibilities: "",
  bio: "",
  skills: [],
  kpis: [],
  experience_level: null,
  notes: "",
  revenue_goal: null,
  expected_roi: null,
  cost_center: "",
  priority: "medium",
  revenue_category: null,
  revenue_category_custom: "",
};

export function EmployeeWizard({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [step, setStep] = useState(1);
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [skillDraft, setSkillDraft] = useState("");

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onBlur",
  });

  const { fields: kpiFields, append: appendKpi, remove: removeKpi } = useFieldArray({
    control: form.control,
    name: "kpis",
  });

  const { data: departments = [] } = useDepartmentsQuery();
  const { data: managers = [] } = useManagerOptionsQuery();
  const create = useCreateEmployee();

  useEffect(() => {
    if (!open) {
      form.reset(DEFAULT_VALUES);
      setStep(1);
      setPendingPhoto(null);
      setSkillDraft("");
    }
  }, [open, form]);

  const values = form.watch();

  const validateStep = async (): Promise<boolean> => {
    if (step === 1) {
      const ok = await form.trigger(["full_name", "email", "phone", "kind", "status"]);
      if (!ok) return false;
      const taken = await isEmailTaken(values.email);
      if (taken) {
        form.setError("email", { message: "An employee with this email already exists" });
        return false;
      }
      return true;
    }
    if (step === 2) {
      return form.trigger(["employment_type", "role_title", "location", "timezone"]);
    }
    if (step === 3) {
      return form.trigger(["skills", "kpis", "bio", "responsibilities", "experience_level", "notes"]);
    }
    if (step === 4) {
      return form.trigger([
        "revenue_goal",
        "expected_roi",
        "cost_center",
        "priority",
        "revenue_category",
        "revenue_category_custom",
      ]);
    }
    return true;
  };

  const next = async () => {
    const ok = await validateStep();
    if (!ok) return;
    setStep((s) => Math.min(5, s + 1));
  };

  const back = () => setStep((s) => Math.max(1, s - 1));

  const submit = form.handleSubmit(async (data) => {
    // Create the row first (photo needs the employee id for its storage path).
    const row = await create.mutateAsync({ ...data, avatar_url: null });
    if (pendingPhoto) {
      try {
        const url = await uploadEmployeePhoto(row.id, pendingPhoto);
        // Persist avatar_url after upload — fire and forget (audit trigger records it)
        const { supabase } = await import("@/integrations/supabase/client");
        await supabase.from("employees").update({ avatar_url: url }).eq("id", row.id);
      } catch (err) {
        console.error(err);
      }
    }
    onOpenChange(false);
  });

  const addSkill = () => {
    const s = skillDraft.trim();
    if (!s) return;
    const current = form.getValues("skills");
    if (current.includes(s)) return;
    form.setValue("skills", [...current, s], { shouldDirty: true });
    setSkillDraft("");
  };

  const removeSkill = (s: string) => {
    form.setValue("skills", form.getValues("skills").filter((x) => x !== s), {
      shouldDirty: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="text-lg">Employee Studio</DialogTitle>
          <DialogDescription>
            Design a revenue-generating employee — human, AI, or hybrid.
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
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

        <div className="max-h-[55vh] overflow-y-auto px-6 py-5">
          {step === 1 && (
            <div className="space-y-5">
              <AvatarUploader
                name={values.full_name || values.email}
                value={values.avatar_url ?? null}
                onChange={(file, preview) => {
                  setPendingPhoto(file);
                  form.setValue("avatar_url", preview, { shouldDirty: true });
                }}
              />
              <Field label="Full name" required error={form.formState.errors.full_name?.message}>
                <Input {...form.register("full_name")} placeholder="Ada Lovelace" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Work email" required error={form.formState.errors.email?.message}>
                  <Input type="email" {...form.register("email")} placeholder="ada@company.com" />
                </Field>
                <Field label="Phone" error={form.formState.errors.phone?.message}>
                  <Input {...form.register("phone")} placeholder="+1 555 010 4433" />
                </Field>
              </div>
              <div>
                <Label className="text-xs font-medium">Employee type</Label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {EMPLOYEE_KINDS.map((k) => {
                    const Icon = k.value === "human" ? Users2 : k.value === "ai" ? Bot : Zap;
                    const selected = values.kind === k.value;
                    return (
                      <button
                        key={k.value}
                        type="button"
                        onClick={() => form.setValue("kind", k.value, { shouldDirty: true })}
                        className={cn(
                          "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all",
                          selected
                            ? "border-primary bg-primary/5 shadow-[var(--shadow-glow)]"
                            : "hover:border-foreground/20 hover:bg-muted/40",
                        )}
                      >
                        <Icon className={cn("h-4 w-4", selected ? "text-primary" : "text-muted-foreground")} />
                        <div className="text-sm font-medium">{k.label}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {k.value === "human"
                            ? "Real teammate"
                            : k.value === "ai"
                              ? "Autonomous agent"
                              : "Human + AI"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <Field label="Status" required>
                <Select
                  value={values.status}
                  onValueChange={(v) => form.setValue("status", v as EmployeeFormValues["status"], { shouldDirty: true })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Department">
                  <Select
                    value={values.department_id ?? NULLABLE_DEPT}
                    onValueChange={(v) =>
                      form.setValue("department_id", v === NULLABLE_DEPT ? null : v, { shouldDirty: true })
                    }
                  >
                    <SelectTrigger><SelectValue placeholder="Choose department" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NULLABLE_DEPT}>Unassigned</SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Role / Title" error={form.formState.errors.role_title?.message}>
                  <Input {...form.register("role_title")} placeholder="Staff Engineer" />
                </Field>
                <Field label="Manager">
                  <Select
                    value={values.manager_id ?? NULLABLE_MANAGER}
                    onValueChange={(v) =>
                      form.setValue("manager_id", v === NULLABLE_MANAGER ? null : v, { shouldDirty: true })
                    }
                  >
                    <SelectTrigger><SelectValue placeholder="Reports to" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NULLABLE_MANAGER}>No manager</SelectItem>
                      {managers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.full_name}{" "}
                          <span className="text-muted-foreground">· {m.employee_code}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Employment type" required>
                  <Select
                    value={values.employment_type}
                    onValueChange={(v) => form.setValue("employment_type", v as EmployeeFormValues["employment_type"], { shouldDirty: true })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Location" error={form.formState.errors.location?.message}>
                  <Input {...form.register("location")} placeholder="Berlin, Germany" />
                </Field>
                <Field label="Timezone" error={form.formState.errors.timezone?.message}>
                  <Input {...form.register("timezone")} placeholder="Europe/Berlin" />
                </Field>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <Field label="Responsibilities" error={form.formState.errors.responsibilities?.message}>
                <Textarea rows={4} {...form.register("responsibilities")} placeholder="What this person owns…" />
              </Field>
              <div>
                <Label>Skills</Label>
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    value={skillDraft}
                    onChange={(e) => setSkillDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); addSkill(); }
                    }}
                    placeholder="Type a skill and press Enter"
                  />
                  <Button type="button" variant="secondary" onClick={addSkill}>Add</Button>
                </div>
                {values.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {values.skills.map((s) => (
                      <Badge key={s} variant="secondary" className="gap-1 pl-2 pr-1">
                        {s}
                        <button
                          type="button"
                          onClick={() => removeSkill(s)}
                          className="rounded-full p-0.5 hover:bg-background/60"
                          aria-label={`Remove ${s}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label>KPIs</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => appendKpi({ label: "", target: "" })}
                    disabled={kpiFields.length >= 10}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add KPI
                  </Button>
                </div>
                <div className="mt-2 space-y-2">
                  {kpiFields.map((f, i) => (
                    <div key={f.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                      <Input placeholder="KPI (e.g. NPS)" {...form.register(`kpis.${i}.label` as const)} />
                      <Input placeholder="Target (e.g. 60)" {...form.register(`kpis.${i}.target` as const)} />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeKpi(i)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {kpiFields.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Optional. Add measurable outcomes this person is accountable for.
                    </p>
                  )}
                </div>
              </div>
              <Field label="Bio" error={form.formState.errors.bio?.message}>
                <Textarea rows={3} {...form.register("bio")} placeholder="Short introduction (optional)" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Experience level">
                  <Select
                    value={values.experience_level ?? "__none__"}
                    onValueChange={(v) =>
                      form.setValue("experience_level", v === "__none__" ? null : (v as EmployeeFormValues["experience_level"]), { shouldDirty: true })
                    }
                  >
                    <SelectTrigger><SelectValue placeholder="Choose level" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Not specified</SelectItem>
                      {EXPERIENCE_LEVELS.map((l) => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Notes" error={form.formState.errors.notes?.message}>
                <Textarea rows={3} {...form.register("notes")} placeholder="Anything else worth capturing (optional)" />
              </Field>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div className="rounded-lg border bg-primary/5 p-3 text-xs text-muted-foreground">
                Revenue configuration turns this employee into a measurable business unit —
                every human, AI or hybrid contributor rolls up to a category and target.
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Revenue goal (annual, USD)" error={form.formState.errors.revenue_goal?.message}>
                  <Input
                    type="number"
                    min={0}
                    step="1000"
                    placeholder="250000"
                    value={values.revenue_goal ?? ""}
                    onChange={(e) =>
                      form.setValue(
                        "revenue_goal",
                        e.target.value === "" ? null : Number(e.target.value),
                        { shouldDirty: true },
                      )
                    }
                  />
                </Field>
                <Field label="Expected ROI (%)" error={form.formState.errors.expected_roi?.message}>
                  <Input
                    type="number"
                    step="1"
                    placeholder="120"
                    value={values.expected_roi ?? ""}
                    onChange={(e) =>
                      form.setValue(
                        "expected_roi",
                        e.target.value === "" ? null : Number(e.target.value),
                        { shouldDirty: true },
                      )
                    }
                  />
                </Field>
                <Field label="Cost center" error={form.formState.errors.cost_center?.message}>
                  <Input {...form.register("cost_center")} placeholder="CC-SALES-01" />
                </Field>
                <Field label="Priority" required>
                  <Select
                    value={values.priority}
                    onValueChange={(v) => form.setValue("priority", v as EmployeeFormValues["priority"], { shouldDirty: true })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EMPLOYEE_PRIORITIES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div>
                <Label className="text-xs font-medium">Revenue category</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {REVENUE_CATEGORIES.map((c) => {
                    const selected = values.revenue_category === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() =>
                          form.setValue(
                            "revenue_category",
                            selected ? null : c.value,
                            { shouldDirty: true },
                          )
                        }
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs transition-colors",
                          selected
                            ? "border-primary bg-primary/10 text-primary"
                            : "text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                        )}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
                {values.revenue_category === "custom" && (
                  <div className="mt-3">
                    <Field label="Custom category" error={form.formState.errors.revenue_category_custom?.message}>
                      <Input
                        {...form.register("revenue_category_custom")}
                        placeholder="e.g. Community, Partnerships"
                      />
                    </Field>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 5 && (
            <ReviewPanel
              values={values}
              departmentName={departments.find((d) => d.id === values.department_id)?.name ?? null}
              managerName={managers.find((m) => m.id === values.manager_id)?.full_name ?? null}
            />
          )}
        </div>

        <DialogFooter className="flex-row items-center justify-between border-t bg-muted/20 px-6 py-3">
          <span className="text-xs text-muted-foreground">Step {step} of {STEPS.length}</span>
          <div className="flex items-center gap-2">
            {step > 1 && (
              <Button type="button" variant="ghost" onClick={back} disabled={create.isPending}>
                Back
              </Button>
            )}
            {step < 5 ? (
              <Button type="button" onClick={next} className="bg-[image:var(--gradient-primary)]">
                Continue
              </Button>
            ) : (
              <Button
                type="button"
                onClick={submit}
                disabled={create.isPending}
                className="bg-[image:var(--gradient-primary)]"
              >
                {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create employee
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
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-[11px] font-medium text-destructive">{error}</p>}
    </div>
  );
}

function ReviewPanel({
  values,
  departmentName,
  managerName,
}: {
  values: EmployeeFormValues;
  departmentName: string | null;
  managerName: string | null;
}) {
  const rows = useMemo(
    () => [
      ["Name", values.full_name],
      ["Email", values.email],
      ["Phone", values.phone || "—"],
      ["Department", departmentName ?? "Unassigned"],
      ["Role", values.role_title || "—"],
      ["Manager", managerName ?? "None"],
      ["Employment", labelFor(EMPLOYMENT_TYPES, values.employment_type)],
      ["Location", values.location || "—"],
      ["Timezone", values.timezone || "—"],
      ["Skills", values.skills.length ? values.skills.join(", ") : "—"],
      ["KPIs", values.kpis.length ? values.kpis.map((k) => `${k.label}${k.target ? " → " + k.target : ""}`).join(" · ") : "—"],
    ],
    [values, departmentName, managerName],
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card/40 p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[image:var(--gradient-primary)]" />
          <div>
            <div className="text-sm font-semibold">{values.full_name || "New employee"}</div>
            <div className="text-xs text-muted-foreground">{values.email}</div>
          </div>
        </div>
      </div>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 rounded-lg border p-4 sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2 border-b border-dashed py-1.5 last:border-0">
            <dt className="text-xs text-muted-foreground">{k}</dt>
            <dd className="text-xs font-medium text-right text-foreground truncate">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}