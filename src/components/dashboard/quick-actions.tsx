import { Link } from "@tanstack/react-router";
import {
  UserPlus, Building2, Upload, Bot, BarChart3, Sparkles, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardSection } from "./section";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ACTIONS = [
  { label: "Create employee",    icon: UserPlus,  to: "/employees" as const, primary: true },
  { label: "Create department",  icon: Building2, to: "/settings" as const },
  { label: "Import data",        icon: Upload,    to: "/settings" as const },
  { label: "Deploy AI employee", icon: Bot,       disabled: true, hint: "Sprint #004" },
  { label: "View reports",       icon: BarChart3, to: "/analytics" as const },
  { label: "Open Employee Studio", icon: Sparkles, disabled: true, hint: "Coming soon" },
] as const;

function ActionButton({
  label, icon: Icon, to, disabled, hint, primary,
}: {
  label: string;
  icon: typeof UserPlus;
  to?: "/employees" | "/settings" | "/analytics";
  disabled?: boolean;
  hint?: string;
  primary?: boolean;
}) {
  const cls = cn(
    "group flex h-auto w-full flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-all",
    disabled
      ? "cursor-not-allowed opacity-50"
      : "hover:-translate-y-0.5 hover:bg-accent hover:shadow-[var(--shadow-md)]",
    primary && "border-primary/40 bg-[image:var(--gradient-primary)]/5",
  );
  const body = (
    <>
      <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-accent/60", primary && "bg-primary/10 text-primary")}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-sm font-medium">{label}</span>
      {hint ? <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{hint}</span> : null}
    </>
  );
  if (disabled || !to) {
    return <div className={cls} aria-disabled>{body}</div>;
  }
  return <Link to={to} className={cls}>{body}</Link>;
}

export function QuickActions() {
  return (
    <DashboardSection title="CEO quick actions" icon={Zap}>
      <Card className="border-border/60">
        <CardContent className="p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ACTIONS.map((a) => (
              <ActionButton key={a.label} {...a} />
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardSection>
  );
}

QuickActions.Inline = function QuickActionsInline() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild variant="outline" size="sm">
        <Link to="/analytics"><BarChart3 className="mr-2 h-4 w-4" /> Reports</Link>
      </Button>
      <Button asChild size="sm" className="bg-[image:var(--gradient-primary)] shadow-[var(--shadow-md)] hover:opacity-95">
        <Link to="/employees"><UserPlus className="mr-2 h-4 w-4" /> Add employee</Link>
      </Button>
    </div>
  );
};