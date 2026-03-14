"use client";

import { PageShell } from "@/components/layout/page-shell";
import { RoleRecommendations } from "@/components/analysis/role-recommendations";
import { GapAnalysis } from "@/components/analysis/gap-analysis";
import { HealthScores } from "@/components/analysis/health-scores";
import { BudgetAllocation } from "@/components/analysis/budget-allocation";
import { mockAnalysisResult } from "@/lib/mock-data";

export default function AnalysisPage() {
  const data = mockAnalysisResult;

  return (
    <PageShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Hiring Analysis
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.companyName} &middot; {data.totalEmployees} employees &middot;{" "}
            {data.recommendations.length} recommended hires
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <RoleRecommendations recommendations={data.recommendations} />
          <div className="space-y-6">
            <HealthScores data={data.departmentHealth} />
            <GapAnalysis data={data.gapAnalysis} />
            <BudgetAllocation data={data.budgetSuggestions} />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
