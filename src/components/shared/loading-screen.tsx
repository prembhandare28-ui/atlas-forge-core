export function LoadingScreen({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      <p className="text-sm text-muted-foreground">{label}…</p>
    </div>
  );
}