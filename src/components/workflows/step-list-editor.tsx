import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { GripVertical, Plus, Trash2, ArrowUp, ArrowDown, ClipboardList, CheckSquare, GitBranch, Bell, Timer, Plug } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WORKFLOW_STEP_TYPES, type WorkflowStepType } from "@/lib/workflows/constants";
import type { WorkflowFormValues } from "@/lib/workflows/schemas";
import { cn } from "@/lib/utils";

const STEP_ICONS: Record<WorkflowStepType, typeof ClipboardList> = {
  task: ClipboardList,
  approval: CheckSquare,
  decision: GitBranch,
  notification: Bell,
  delay: Timer,
  integration: Plug,
};

interface Props {
  form: UseFormReturn<WorkflowFormValues>;
  employees: { id: string; full_name: string; employee_code: string }[];
}

const UNASSIGNED = "__unassigned__";

export function StepListEditor({ form, employees }: Props) {
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "steps",
  });
  const values = form.watch("steps");

  const addStep = () =>
    append({
      title: "",
      description: "",
      step_type: "task",
      estimated_minutes: null,
      assigned_employee_id: null,
    });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm">Steps</Label>
          <p className="text-xs text-muted-foreground">
            Order matters — steps run top to bottom.
          </p>
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={addStep}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add step
        </Button>
      </div>

      {fields.length === 0 && (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No steps yet — add the first task to start the workflow.
        </div>
      )}

      <ol className="space-y-2">
        {fields.map((field, i) => {
          const type = values?.[i]?.step_type ?? "task";
          const Icon = STEP_ICONS[type] ?? ClipboardList;
          return (
            <li
              key={field.id}
              className="group rounded-xl border bg-card/40 p-3 transition-colors hover:bg-card/70"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 flex flex-col items-center gap-1 text-muted-foreground">
                  <GripVertical className="h-4 w-4 opacity-60" />
                  <span className="text-[10px] font-mono">{i + 1}</span>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_160px_120px]">
                    <Input
                      placeholder="Step title"
                      {...form.register(`steps.${i}.title` as const)}
                    />
                    <Select
                      value={values?.[i]?.step_type ?? "task"}
                      onValueChange={(v) =>
                        form.setValue(`steps.${i}.step_type` as const, v as WorkflowStepType, {
                          shouldDirty: true,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WORKFLOW_STEP_TYPES.map((t) => {
                          const TIcon = STEP_ICONS[t.value];
                          return (
                            <SelectItem key={t.value} value={t.value}>
                              <span className="inline-flex items-center gap-2">
                                <TIcon className="h-3.5 w-3.5" /> {t.label}
                                {t.future ? (
                                  <span className="ml-1 text-[10px] uppercase text-muted-foreground">
                                    Soon
                                  </span>
                                ) : null}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Minutes"
                      value={values?.[i]?.estimated_minutes ?? ""}
                      onChange={(e) =>
                        form.setValue(
                          `steps.${i}.estimated_minutes` as const,
                          e.target.value === "" ? null : Number(e.target.value),
                          { shouldDirty: true },
                        )
                      }
                    />
                  </div>
                  <Textarea
                    rows={2}
                    placeholder="What happens in this step (optional)"
                    {...form.register(`steps.${i}.description` as const)}
                  />
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <Select
                        value={values?.[i]?.assigned_employee_id ?? UNASSIGNED}
                        onValueChange={(v) =>
                          form.setValue(
                            `steps.${i}.assigned_employee_id` as const,
                            v === UNASSIGNED ? null : v,
                            { shouldDirty: true },
                          )
                        }
                      >
                        <SelectTrigger className="h-8 w-[240px] text-xs">
                          <SelectValue placeholder="Responsible employee" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                          {employees.map((e) => (
                            <SelectItem key={e.id} value={e.id}>
                              {e.full_name}{" "}
                              <span className="text-muted-foreground">· {e.employee_code}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className={cn("flex items-center gap-1 opacity-60 group-hover:opacity-100")}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={i === 0}
                        onClick={() => move(i, i - 1)}
                        aria-label="Move up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={i === fields.length - 1}
                        onClick={() => move(i, i + 1)}
                        aria-label="Move down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => remove(i)}
                        aria-label="Remove step"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}