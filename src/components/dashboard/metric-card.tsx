import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export interface MetricCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warning" | "muted" | "destructive" | "primary";
  loading?: boolean;
  to?: string;
  search?: Record<string, unknown>;
  onClick?: () => void;
  className?: string;
}

const toneRing: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  default: "text-foreground",
  success: "text-[color:var(--color-success)]",
  warning: "text-[color:var(--color-warning)]",
  muted: "text-muted-foreground",
  destructive: "text-destructive",
  primary: "text-primary",
};

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  loading,
  to,
  search,
  onClick,
  className,
}: MetricCardProps) {
  const inner = (
    <Card
      className={cn(
        "group relative h-full overflow-hidden border-border/60 transition-all",
        "hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]",
        (to || onClick) && "cursor-pointer",
        className,
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          {Icon ? (
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg bg-accent/60 transition-colors group-hover:bg-accent",
                toneRing[tone],
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
          ) : null}
        </div>
        <div className="mt-3">
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div className={cn("text-2xl font-semibold tracking-tight tabular-nums", toneRing[tone])}>
              {value}
            </div>
          )}
          {hint ? (
            <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );

  if (to) {
    return (
      <Link to={to} search={search as never} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
        {inner}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
        {inner}
      </button>
    );
  }
  return inner;
}