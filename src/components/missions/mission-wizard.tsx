import { useMemo, useState } from "react";
import { Rocket } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useMissionActions, useMissionDefinitions } from "@/lib/missions/hooks";

type Step = 0 | 1 | 2;

const STEPS = ["Definition", "Input", "Review"] as const;

export function MissionWizard() {
  const definitions = useMissionDefinitions();
  const actions = useMissionActions();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(0);
  const [definitionId, setDefinitionId] = useState("");
  const [label, setLabel] = useState("");
  const [inputJson, setInputJson] = useState("{}");
  const [autoStart, setAutoStart] = useState(true);

  const definition = useMemo(
    () => definitions.find((item) => item.id === definitionId),
    [definitions, definitionId],
  );

  const parsedInput = useMemo(() => {
    try {
      const value = JSON.parse(inputJson || "{}");
      if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
      return value as Record<string, unknown>;
    } catch {
      return null;
    }
  }, [inputJson]);

  const reset = () => {
    setStep(0);
    setDefinitionId("");
    setLabel("");
    setInputJson("{}");
    setAutoStart(true);
  };

  const submit = () => {
    if (!definition || !parsedInput) return;
    try {
      const metadata = label.trim() ? { label: label.trim() } : undefined;
      const mission = autoStart
        ? actions.dispatch(definition.id, parsedInput, metadata)
        : actions.create(definition.id, parsedInput);
      if (!mission) throw new Error("Mission runtime is not ready yet");
      toast.success(autoStart ? "Mission dispatched" : "Mission created");
      setOpen(false);
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  };

  const canAdvance = step === 0 ? Boolean(definition) : step === 1 ? Boolean(parsedInput) : true;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button disabled={!actions.ready}>
          <Rocket className="mr-2 h-4 w-4" /> New Mission
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Launch a mission</DialogTitle>
          <DialogDescription>
            Step {step + 1} of {STEPS.length} · {STEPS[step]}
          </DialogDescription>
        </DialogHeader>

        {step === 0 ? (
          <div className="space-y-3">
            <Label>Mission definition</Label>
            <Select value={definitionId} onValueChange={setDefinitionId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a registered mission" />
              </SelectTrigger>
              <SelectContent>
                {definitions.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {definition?.description ? (
              <p className="text-xs text-muted-foreground">{definition.description}</p>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="mission-label">Label (optional)</Label>
              <Input
                id="mission-label"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder="Nightly diagnostics"
              />
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-2">
            <Label htmlFor="mission-input">Input payload (JSON object)</Label>
            <Textarea
              id="mission-input"
              value={inputJson}
              onChange={(event) => setInputJson(event.target.value)}
              rows={8}
              className="font-mono text-xs"
            />
            {parsedInput ? null : (
              <p className="text-xs text-destructive">Enter a valid JSON object.</p>
            )}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4 text-sm">
            <div className="rounded-lg border p-3">
              <p className="font-medium">{definition?.name}</p>
              <p className="text-xs text-muted-foreground">
                {definition?.type} · v{definition?.version}
              </p>
            </div>
            <pre className="max-h-40 overflow-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs">
              {JSON.stringify(parsedInput ?? {}, null, 2)}
            </pre>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Queue immediately</p>
                <p className="text-xs text-muted-foreground">
                  Off keeps the mission in the created state.
                </p>
              </div>
              <Switch checked={autoStart} onCheckedChange={setAutoStart} />
            </div>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="ghost"
            disabled={step === 0}
            onClick={() => setStep((value) => (value - 1) as Step)}
          >
            Back
          </Button>
          {step < 2 ? (
            <Button disabled={!canAdvance} onClick={() => setStep((value) => (value + 1) as Step)}>
              Continue
            </Button>
          ) : (
            <Button onClick={submit}>{autoStart ? "Dispatch" : "Create"}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}