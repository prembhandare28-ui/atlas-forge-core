import type { LucideIcon } from "lucide-react";
import { Plug } from "lucide-react";
import { cn } from "@/lib/utils";

interface IntegrationEmptyProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  integrationHook?: string;
  className?: string;
}

export function IntegrationEmpty({
  icon: Icon = Plug,
  title,
  description,
  integrationHook,
  className,
}: IntegrationEmptyProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/40 p-8 text-center",
        className,
      )}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent">
        <Icon className="h-4 w-4 text-accent-foreground" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>
      {integrationHook ? (
        <span className="mt-3 rounded-full border bg-background px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Integration hook · {integrationHook}
        </span>
      ) : null}
    </div>
  );
}