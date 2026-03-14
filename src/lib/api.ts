import type { TreeNode } from "@/types/tree";
import type { AnalysisResult } from "@/types/analysis";

// ── Pipeline API (calls our Hono backend via Next.js rewrite) ────

export interface PipelineInput {
  company: {
    name: string;
    website?: string;
    stage?: string;
    employeeCount?: number;
    industry?: string;
    description?: string;
  };
}

export interface PipelineResponse {
  company: { id: string; name: string };
  documentsIngested: number;
  analysis: {
    id: string;
    companyStage: string;
    productState: string;
    growthState: string;
    engineeringState: string;
    strongestAreas: string[];
    weakestAreas: string[];
    strategicBottlenecks: string[];
    executionRisks: string[];
    topBottleneck: string;
    recommendedHiringFocus: string;
    evidence: Array<{ claim: string; supportingContext: string }>;
  };
  recommendation: {
    id: string;
    roleToHire: string;
    summary: string;
    whyNow: string;
    expectedImpact: string[];
    urgencyScore: number;
    confidenceScore: number;
    signalsUsed: string[];
    risksIfDelayed: string[];
  };
  candidates: Array<{
    name: string;
    title?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    score: number;
    reasoning: string;
  }>;
}

/**
 * Run the full WorkTree pipeline: analyze company -> recommend role -> find candidates
 */
export async function runPipeline(input: PipelineInput): Promise<PipelineResponse> {
  const res = await fetch("/api/pipeline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Pipeline failed: ${res.status}`);
  }

  return res.json();
}

// ── Transform pipeline response → TreeNode for visualization ─────

export function pipelineToTree(data: PipelineResponse): TreeNode {
  const { company, analysis, recommendation, candidates } = data;

  // Build department structure from analysis
  const departments: TreeNode[] = [];

  // Create departments from strongest/weakest areas
  const allAreas = new Set<string>();
  for (const area of [...(analysis.strongestAreas ?? []), ...(analysis.weakestAreas ?? [])]) {
    // Extract department-like names
    const dept = area.split(/[:(,]/)[0].trim();
    if (dept.length > 2 && dept.length < 40) allAreas.add(dept);
  }

  // If no clear departments, create some from common functions
  if (allAreas.size === 0) {
    allAreas.add("Engineering");
    allAreas.add("Product");
    allAreas.add("Growth");
  }

  let deptIndex = 0;
  for (const area of allAreas) {
    deptIndex++;
    departments.push({
      id: `dept-${deptIndex}`,
      name: area,
      type: "department",
      children: [],
    });
    if (departments.length >= 6) break; // cap at 6 departments
  }

  // Add recommended role as a bud
  if (recommendation.roleToHire) {
    const targetDept = departments[0]; // attach to first department
    if (targetDept && targetDept.children) {
      targetDept.children.push({
        id: `rec-${recommendation.id ?? "1"}`,
        name: recommendation.roleToHire,
        type: "recommended_role",
        priority: recommendation.urgencyScore >= 8 ? "critical" : recommendation.urgencyScore >= 6 ? "high" : "medium",
        description: recommendation.summary,
      });
    }
  }

  // Add candidates as employees/recommended_roles
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const dept = departments[i % departments.length];
    if (dept && dept.children) {
      dept.children.push({
        id: `candidate-${i}`,
        name: c.name,
        type: "recommended_role",
        role: c.title ?? recommendation.roleToHire,
        priority: c.score >= 8 ? "critical" : c.score >= 6 ? "high" : c.score >= 4 ? "medium" : "low",
        description: c.reasoning,
        socials: {
          linkedin: c.linkedinUrl,
          github: c.githubUrl,
        },
      });
    }
  }

  return {
    id: company.id,
    name: company.name,
    type: "company",
    children: departments,
  };
}

// ── Transform pipeline response → AnalysisResult for charts ──────

export function pipelineToAnalysis(data: PipelineResponse): AnalysisResult {
  const { company, analysis, recommendation, candidates } = data;

  // Build role recommendations from our recommendation + candidates
  const recommendations = [
    {
      id: recommendation.id ?? "rec-1",
      title: recommendation.roleToHire,
      department: analysis.recommendedHiringFocus?.split(/[:(]/)[0]?.trim() ?? "Engineering",
      priority: (recommendation.urgencyScore >= 8 ? "critical" : recommendation.urgencyScore >= 6 ? "high" : "medium") as "critical" | "high" | "medium" | "low",
      reasoning: recommendation.summary + (recommendation.whyNow ? ` ${recommendation.whyNow}` : ""),
      salaryRange: { min: 100000, max: 180000 },
      skills: recommendation.signalsUsed ?? [],
    },
    // Add top candidates as additional "recommendations"
    ...candidates.slice(0, 4).map((c, i) => ({
      id: `cand-rec-${i}`,
      title: `${c.title ?? recommendation.roleToHire} (${c.name})`,
      department: "Candidate",
      priority: (c.score >= 8 ? "high" : "medium") as "critical" | "high" | "medium" | "low",
      reasoning: c.reasoning,
      salaryRange: { min: 80000, max: 160000 },
      skills: [] as string[],
    })),
  ];

  // Build department health from analysis areas
  const deptHealth = [
    ...(analysis.strongestAreas ?? []).slice(0, 3).map((area, i) => ({
      department: area.slice(0, 30),
      score: 80 - i * 10,
      headcount: 5 - i,
      optimalHeadcount: 5 - i,
      status: "optimal" as const,
    })),
    ...(analysis.weakestAreas ?? []).slice(0, 3).map((area, i) => ({
      department: area.slice(0, 30),
      score: 40 - i * 10,
      headcount: 1,
      optimalHeadcount: 3 + i,
      status: "understaffed" as const,
    })),
  ];

  // Gap analysis
  const gapAnalysis = deptHealth.map((d) => ({
    department: d.department,
    currentCapacity: d.headcount * 20,
    requiredCapacity: d.optimalHeadcount * 20,
  }));

  // Budget suggestions
  const totalDepts = deptHealth.length || 1;
  const budgetSuggestions = deptHealth.map((d) => ({
    department: d.department,
    percentage: Math.round(100 / totalDepts),
    amount: Math.round(500000 / totalDepts),
  }));

  return {
    companyName: company.name,
    totalEmployees: data.documentsIngested,
    recommendations,
    departmentHealth: deptHealth,
    gapAnalysis,
    budgetSuggestions,
  };
}

// ── Legacy mock API functions (kept for compatibility) ────────────

export async function uploadDocuments(files: File[]): Promise<{ jobId: string }> {
  return { jobId: `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` };
}

export async function getProcessingStatus(jobId: string): Promise<{ status: string; progress: number }> {
  return { status: "complete", progress: 100 };
}

export async function getAnalysisResult(jobId: string): Promise<AnalysisResult> {
  const { mockAnalysisResult } = await import("./mock-data");
  return mockAnalysisResult;
}

export async function getCompanyTree(companyId: string): Promise<TreeNode> {
  const { mockTreeData } = await import("./mock-data");
  return mockTreeData;
}

export async function saveCompanyProfile(profile: {
  name: string;
  industry: string;
  size: string;
  description: string;
}): Promise<void> {
  // Could call our backend here in the future
}
