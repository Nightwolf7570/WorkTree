export interface RoleRecommendation {
  id: string;
  title: string;
  department: string;
  priority: "critical" | "high" | "medium" | "low";
  reasoning: string;
  salaryRange: { min: number; max: number };
  skills: string[];
}

export interface DepartmentHealth {
  department: string;
  score: number;
  headcount: number;
  optimalHeadcount: number;
  status: "understaffed" | "optimal" | "overstaffed";
}

export interface GapAnalysis {
  department: string;
  currentCapacity: number;
  requiredCapacity: number;
}

export interface BudgetSuggestion {
  department: string;
  percentage: number;
  amount: number;
}

export interface AnalysisResult {
  companyName: string;
  totalEmployees: number;
  recommendations: RoleRecommendation[];
  departmentHealth: DepartmentHealth[];
  gapAnalysis: GapAnalysis[];
  budgetSuggestions: BudgetSuggestion[];
}

// ── Backend API types ─────────────────────────────────────────────

export interface BackendCompany {
  id: string;
  name: string;
  website?: string;
  stage?: string;
  employeeCount?: number;
  industry?: string;
  description?: string;
}

export interface AnalysisEvidence {
  claim: string;
  supportingContext: string;
}

export interface BackendAnalysis {
  id: string;
  companyId: string;
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
  evidence: AnalysisEvidence[];
}

export interface BackendRecommendation {
  id: string;
  companyId: string;
  roleToHire: string;
  summary: string;
  whyNow: string;
  expectedImpact: string[];
  urgencyScore: number;
  confidenceScore: number;
  signalsUsed: string[];
  risksIfDelayed: string[];
}

export interface BackendCandidate {
  id: string;
  name: string;
  title?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  score: number;
  reasoning: string;
}

export interface PipelineResult {
  company: BackendCompany;
  analysis: BackendAnalysis;
  recommendation: BackendRecommendation;
  candidates: BackendCandidate[];
}

export interface BackendDocument {
  source: string;
  title: string;
  content: string;
}
