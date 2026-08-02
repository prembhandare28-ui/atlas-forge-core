import { describeError } from "./errors";
import type { KernelClock, KernelHealthLevel, KernelHealthProbe, KernelHealthReport } from "./types";

export type IdentifiedHealthReport = KernelHealthReport & { readonly id: string };

const SEVERITY: Record<KernelHealthLevel, number> = {
  healthy: 0,
  unknown: 1,
  degraded: 2,
  unhealthy: 3,
};

/** Aggregates independent probes into a single health level. */
export class KernelHealthMonitor {
  private readonly probes = new Map<string, KernelHealthProbe>();

  constructor(private readonly clock: KernelClock) {}

  add(probe: KernelHealthProbe): () => void {
    this.probes.set(probe.id, probe);
    return () => this.probes.delete(probe.id);
  }

  remove(probeId: string): void {
    this.probes.delete(probeId);
  }

  async collect(): Promise<readonly IdentifiedHealthReport[]> {
    const results: IdentifiedHealthReport[] = [];
    for (const probe of this.probes.values()) {
      try {
        const report = await probe.check();
        results.push({ ...report, id: probe.id });
      } catch (error) {
        results.push({
          id: probe.id,
          level: "unhealthy",
          message: describeError(error),
          checkedAt: this.clock.now(),
        });
      }
    }
    return results;
  }

  static worst(reports: readonly KernelHealthReport[]): KernelHealthLevel {
    return reports.reduce<KernelHealthLevel>(
      (worst, report) => (SEVERITY[report.level] > SEVERITY[worst] ? report.level : worst),
      "healthy",
    );
  }
}
