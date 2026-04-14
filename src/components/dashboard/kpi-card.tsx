import type { DashboardKpi } from "@/lib/types/domain";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export function KpiCard({ kpi, index }: { kpi: DashboardKpi; index: number }) {
  return (
    <Card
      className="animate-[fade-up_0.5s_ease_forwards] opacity-0"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <CardDescription className="uppercase tracking-[0.12em]">{kpi.label}</CardDescription>
      <CardTitle className="mt-2 text-3xl">{kpi.value}</CardTitle>
      <CardDescription className="mt-2">{kpi.hint}</CardDescription>
    </Card>
  );
}
