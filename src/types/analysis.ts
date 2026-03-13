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
