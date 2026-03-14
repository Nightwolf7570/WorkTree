"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { RoleRecommendations } from "@/components/analysis/role-recommendations";
import { GapAnalysis } from "@/components/analysis/gap-analysis";
import { HealthScores } from "@/components/analysis/health-scores";
import { BudgetAllocation } from "@/components/analysis/budget-allocation";
import { CandidateDiscovery } from "@/components/analysis/candidate-discovery";
import { useCompanyStore } from "@/stores/company-store";
import { transformPipelineResult } from "@/lib/adapters";
import { discoverCandidates, runPipeline } from "@/lib/api";
import { FileUp, BarChart3, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { BackendCandidate } from "@/types/analysis";

export default function AnalysisPage() {
  const { pipelineResult, recommendationId, setPipelineResult } = useCompanyStore();
  const [candidates, setCandidates] = useState<BackendCandidate[]>(
    pipelineResult?.candidates ?? []
  );
  const [autoDiscovered, setAutoDiscovered] = useState(false);
  const [runningDemo, setRunningDemo] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  // Transform backend data to frontend format
  const data = useMemo(() => {
    if (pipelineResult) {
      return transformPipelineResult(pipelineResult);
    }
    return null;
  }, [pipelineResult]);

  // Auto-discover candidates if we have a recommendationId but no candidates
  useEffect(() => {
    if (recommendationId && candidates.length === 0 && !autoDiscovered) {
      setAutoDiscovered(true);
      discoverCandidates(recommendationId)
        .then(setCandidates)
        .catch(console.error);
    }
  }, [recommendationId, candidates.length, autoDiscovered]);

  const handleCandidatesUpdated = useCallback((newCandidates: BackendCandidate[]) => {
    setCandidates(newCandidates);
  }, []);

  // Run a demo pipeline for quick testing
  const handleRunDemo = useCallback(async () => {
    setRunningDemo(true);
    setDemoError(null);
    try {
      const result = await runPipeline(
        {
          name: "StackAuth",
          description: "Open-source authentication platform (YC S24) providing secure, developer-friendly auth solutions",
          employeeCount: 5,
          industry: "Developer Tools / Security",
          stage: "Seed",
        },
        [{
          source: "team_overview",
          title: "Team Overview",
          content: `StackAuth (YC S24) is an open-source authentication company with 5 employees:

1. Konstantin Wohlwend - Co-founder (prev Google, Jane Street, YC W23 & S24)
2. Zai Shi - Co-Founder (ETH Zurich)
3. Aadesh Kheria - Founding Engineer
4. Bilal Godil - Software Engineer
5. Madison Kennedy - Customer Support Engineer

Tech stack: TypeScript, Next.js, PostgreSQL

Current situation:
- Very small engineering team (2 co-founders + 2 engineers)
- Only 1 customer support person
- No dedicated DevOps, security, or marketing roles
- Growing open-source community needs more developer relations
- Need to scale infrastructure as customer base grows`,
        }]
      );
      setPipelineResult(result);
      setCandidates(result.candidates);
    } catch (err) {
      setDemoError(err instanceof Error ? err.message : "Failed to run demo");
    } finally {
      setRunningDemo(false);
    }
  }, [setPipelineResult]);

  // No data - show upload prompt
  if (!data) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <BarChart3 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mb-2">
            No Analysis Data
          </h1>
          <p className="text-muted-foreground mb-6 max-w-md">
            Upload your company documents to get AI-powered hiring recommendations and candidate discovery.
          </p>
          {demoError && (
            <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg mb-4 max-w-md">
              {demoError}
            </p>
          )}
          <div className="flex gap-3">
            <Button onClick={handleRunDemo} disabled={runningDemo} className="gap-2">
              {runningDemo ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {runningDemo ? "Analyzing..." : "Run Demo Analysis"}
            </Button>
            <Link href="/upload">
              <Button variant="outline" className="gap-2">
                <FileUp className="h-4 w-4" />
                Upload Documents
              </Button>
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

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
          <div className="space-y-6">
            <RoleRecommendations recommendations={data.recommendations} />
            <CandidateDiscovery 
              candidates={candidates}
              recommendationId={recommendationId}
              onCandidatesUpdated={handleCandidatesUpdated}
            />
          </div>
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
