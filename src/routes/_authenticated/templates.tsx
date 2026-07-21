import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LayoutTemplate } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBrainTemplatesQuery } from "@/lib/templates/service";
import { useCreateBrainFromTemplate } from "@/lib/brains/hooks";
import { useCan } from "@/lib/rbac";

export const Route = createFileRoute("/_authenticated/templates")({ component: TemplatesPage });

function TemplatesPage() {
  const q = useBrainTemplatesQuery();
  const { canManageEmployees } = useCan();
  const create = useCreateBrainFromTemplate();
  const nav = useNavigate();
  const rows = q.data ?? [];

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader title="Template Library" description="Cloneable brain templates — start from a proven blueprint." />
      {rows.length === 0 && !q.isLoading ? (
        <EmptyState icon={LayoutTemplate} title="No templates yet" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((t) => (
            <Card key={t.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{t.name}</CardTitle>
                  {t.is_official && <Badge className="bg-primary/15 text-primary text-[11px]">Official</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{t.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-[11px]">{t.category}</Badge>
                  {t.tags?.slice(0, 3).map((tag) => <Badge key={tag} variant="outline" className="text-[11px]">{tag}</Badge>)}
                </div>
                {canManageEmployees && (
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={create.isPending}
                    onClick={async () => {
                      const r = await create.mutateAsync({ templateId: t.id });
                      nav({ to: "/brains/$brainId", params: { brainId: r.id } });
                    }}
                  >
                    Use template
                  </Button>
                )}
                <p className="text-[11px] text-muted-foreground">Used {t.usage_count} times</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}