import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AuditLogRow = Database["public"]["Tables"]["audit_logs"]["Row"];

export interface WorkforceStats {
  total: number;
  human: number;
  ai: number;
  hybrid: number;
  active: number;
  idle: number;      // on_leave (proxy for idle in V1)
  offline: number;   // inactive
  error: number;     // archived (proxy — real error state comes with AI runtime)
  departments: number;
  newThisMonth: number;
}

export function useWorkforceStats() {
  return useQuery({
    queryKey: ["dashboard", "workforce-stats"],
    staleTime: 30_000,
    queryFn: async (): Promise<WorkforceStats> => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [
        totalRes,
        humanRes,
        aiRes,
        activeRes,
        idleRes,
        offlineRes,
        errorRes,
        deptRes,
        newRes,
      ] = await Promise.all([
        supabase.from("employees").select("id", { count: "exact", head: true }),
        supabase.from("employees").select("id", { count: "exact", head: true }).eq("kind", "human"),
        supabase.from("employees").select("id", { count: "exact", head: true }).eq("kind", "ai"),
        supabase.from("employees").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("employees").select("id", { count: "exact", head: true }).eq("status", "on_leave"),
        supabase.from("employees").select("id", { count: "exact", head: true }).eq("status", "inactive"),
        supabase.from("employees").select("id", { count: "exact", head: true }).eq("status", "archived"),
        supabase.from("departments").select("id", { count: "exact", head: true }),
        supabase
          .from("employees")
          .select("id", { count: "exact", head: true })
          .gte("created_at", startOfMonth.toISOString()),
      ]);

      return {
        total: totalRes.count ?? 0,
        human: humanRes.count ?? 0,
        ai: aiRes.count ?? 0,
        hybrid: 0, // reserved for future hybrid classification
        active: activeRes.count ?? 0,
        idle: idleRes.count ?? 0,
        offline: offlineRes.count ?? 0,
        error: errorRes.count ?? 0,
        departments: deptRes.count ?? 0,
        newThisMonth: newRes.count ?? 0,
      };
    },
  });
}

export function useRecentActivity(limit = 12) {
  return useQuery({
    queryKey: ["dashboard", "activity", limit],
    staleTime: 15_000,
    queryFn: async (): Promise<AuditLogRow[]> => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/**
 * Revenue / pipeline / department-performance data is not yet wired to a
 * source of truth. These hooks return `null` so consumers render empty
 * states with clear integration hooks. Sprint #004 will replace the
 * `queryFn` body with a real integration (Stripe, HubSpot, warehouse, etc.).
 */
export function useRevenueOverview() {
  return useQuery({
    queryKey: ["dashboard", "revenue"],
    staleTime: 60_000,
    queryFn: async () => null as null | {
      today: number; week: number; month: number;
      mrr: number; arr: number; profit: number; expenses: number; growth: number;
    },
  });
}

export function usePipelineOverview() {
  return useQuery({
    queryKey: ["dashboard", "pipeline"],
    staleTime: 60_000,
    queryFn: async () => null as null | {
      leads: number; qualified: number; meetings: number;
      proposals: number; won: number; lost: number; potential: number;
    },
  });
}

export function useDepartmentPerformance() {
  return useQuery({
    queryKey: ["dashboard", "department-performance"],
    staleTime: 60_000,
    queryFn: async () =>
      null as null | Array<{
        name: string; revenue: number; cost: number; roi: number;
        employees: number; productivity: number;
      }>,
  });
}

export function useTopPerformers() {
  return useQuery({
    queryKey: ["dashboard", "top-performers"],
    staleTime: 60_000,
    queryFn: async () =>
      null as null | {
        topRevenueEmployee: { name: string; value: number } | null;
        topDepartment: { name: string; value: number } | null;
        mostProductive: { name: string; value: number } | null;
        highestRoi: { name: string; value: number } | null;
        fastestResponse: { name: string; value: string } | null;
      },
  });
}

export function useSystemAlerts() {
  return useQuery({
    queryKey: ["dashboard", "alerts"],
    staleTime: 30_000,
    queryFn: async () =>
      null as null | Array<{
        id: string; category: "system" | "revenue" | "workflow" | "approval" | "security";
        title: string; severity: "info" | "warning" | "critical"; created_at: string;
      }>,
  });
}