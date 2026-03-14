import type {
  AnalysisResult,
  RoleRecommendation,
  DepartmentHealth,
  GapAnalysis,
  BudgetSuggestion,
  PipelineResult,
  BackendAnalysis,
  BackendRecommendation,
  BackendCompany,
} from "@/types/analysis";
import type { TreeNode } from "@/types/tree";

/**
 * Maps urgency score (0-100) to priority level
 */
function urgencyToPriority(urgencyScore: number): RoleRecommendation["priority"] {
  if (urgencyScore >= 80) return "critical";
  if (urgencyScore >= 60) return "high";
  if (urgencyScore >= 40) return "medium";
  return "low";
}

/**
 * Generates a salary range based on role type
 * In a real app, this could come from the backend or a salary database
 */
function estimateSalaryRange(roleTitle: string): { min: number; max: number } {
  const title = roleTitle.toLowerCase();
  
  if (title.includes("senior") || title.includes("staff") || title.includes("lead")) {
    return { min: 150000, max: 200000 };
  }
  if (title.includes("director") || title.includes("head") || title.includes("vp")) {
    return { min: 180000, max: 250000 };
  }
  if (title.includes("engineer") || title.includes("developer")) {
    return { min: 120000, max: 170000 };
  }
  if (title.includes("manager")) {
    return { min: 100000, max: 150000 };
  }
  if (title.includes("recruiter")) {
    return { min: 75000, max: 120000 };
  }
  // Default range
  return { min: 80000, max: 130000 };
}

/**
 * Extracts department from role title or defaults to "General"
 */
function extractDepartment(roleTitle: string, analysis: BackendAnalysis): string {
  const title = roleTitle.toLowerCase();
  
  if (title.includes("engineer") || title.includes("developer") || title.includes("devops") || title.includes("sre") || title.includes("data")) {
    return "Engineering";
  }
  if (title.includes("product manager") || title.includes("pm")) {
    return "Product";
  }
  if (title.includes("designer") || title.includes("ux") || title.includes("ui")) {
    return "Design";
  }
  if (title.includes("sales") || title.includes("account")) {
    return "Sales";
  }
  if (title.includes("marketing") || title.includes("growth") || title.includes("content")) {
    return "Marketing";
  }
  if (title.includes("recruiter") || title.includes("hr") || title.includes("people") || title.includes("ops")) {
    return "Operations";
  }
  
  // Try to infer from hiring focus
  const focus = analysis.recommendedHiringFocus?.toLowerCase() ?? "";
  if (focus.includes("engineering") || focus.includes("technical")) return "Engineering";
  if (focus.includes("product")) return "Product";
  if (focus.includes("design")) return "Design";
  if (focus.includes("sales")) return "Sales";
  if (focus.includes("marketing")) return "Marketing";
  
  return "General";
}

/**
 * Extracts skills from signals and role title
 */
function extractSkills(recommendation: BackendRecommendation): string[] {
  const skills: string[] = [];
  const title = recommendation.roleToHire.toLowerCase();
  
  // Add skills based on role type
  if (title.includes("frontend") || title.includes("react")) {
    skills.push("React", "TypeScript", "CSS", "Performance Optimization");
  } else if (title.includes("backend")) {
    skills.push("Node.js", "Python", "APIs", "Databases");
  } else if (title.includes("fullstack")) {
    skills.push("React", "Node.js", "TypeScript", "Databases");
  } else if (title.includes("devops") || title.includes("sre")) {
    skills.push("AWS/GCP", "Kubernetes", "CI/CD", "Terraform", "Monitoring");
  } else if (title.includes("data")) {
    skills.push("Python", "SQL", "Data Pipelines", "Analytics");
  } else if (title.includes("ml") || title.includes("machine learning")) {
    skills.push("Python", "TensorFlow/PyTorch", "ML Ops", "Statistics");
  } else if (title.includes("designer")) {
    skills.push("Figma", "UI Design", "User Research", "Design Systems");
  } else if (title.includes("product")) {
    skills.push("Product Strategy", "User Research", "Analytics", "Roadmapping");
  } else if (title.includes("sales")) {
    skills.push("Sales Strategy", "Negotiation", "CRM", "Communication");
  } else if (title.includes("marketing")) {
    skills.push("Marketing Strategy", "Content", "Analytics", "Growth");
  } else if (title.includes("recruiter")) {
    skills.push("Technical Recruiting", "Sourcing", "ATS", "Interviewing");
  }
  
  // Add from signals if available
  recommendation.signalsUsed.slice(0, 2).forEach((signal) => {
    if (signal.length < 30 && !skills.includes(signal)) {
      skills.push(signal);
    }
  });
  
  return skills.slice(0, 5);
}

/**
 * Transform a BackendRecommendation to a RoleRecommendation
 */
export function transformRecommendation(
  recommendation: BackendRecommendation,
  analysis: BackendAnalysis
): RoleRecommendation {
  return {
    id: recommendation.id,
    title: recommendation.roleToHire,
    department: extractDepartment(recommendation.roleToHire, analysis),
    priority: urgencyToPriority(recommendation.urgencyScore),
    reasoning: recommendation.summary,
    salaryRange: estimateSalaryRange(recommendation.roleToHire),
    skills: extractSkills(recommendation),
  };
}

/**
 * Generate department health scores from backend analysis
 * Maps backend state descriptions to numerical scores
 */
function generateDepartmentHealth(
  analysis: BackendAnalysis,
  company: BackendCompany
): DepartmentHealth[] {
  const departments = ["Engineering", "Product", "Design", "Sales", "Marketing", "Operations"];
  const employeeCount = company.employeeCount ?? 30;
  
  // Map analysis states to base scores
  const stateToScore: Record<string, number> = {
    "excellent": 90,
    "strong": 85,
    "good": 75,
    "healthy": 75,
    "adequate": 65,
    "developing": 55,
    "growing": 60,
    "weak": 45,
    "struggling": 35,
    "critical": 25,
  };
  
  const getScoreFromState = (state: string): number => {
    const lower = state.toLowerCase();
    for (const [key, score] of Object.entries(stateToScore)) {
      if (lower.includes(key)) return score;
    }
    return 60; // Default
  };
  
  // Check if department is in weakest or strongest areas
  const isWeak = (dept: string) => 
    analysis.weakestAreas.some(a => a.toLowerCase().includes(dept.toLowerCase()));
  const isStrong = (dept: string) => 
    analysis.strongestAreas.some(a => a.toLowerCase().includes(dept.toLowerCase()));
  
  return departments.map((dept) => {
    let baseScore = 60;
    
    // Adjust based on specific state fields
    if (dept === "Engineering") {
      baseScore = getScoreFromState(analysis.engineeringState);
    } else if (dept === "Product") {
      baseScore = getScoreFromState(analysis.productState);
    } else if (dept === "Sales" || dept === "Marketing") {
      baseScore = getScoreFromState(analysis.growthState);
    }
    
    // Adjust based on strongest/weakest areas
    if (isStrong(dept)) baseScore = Math.min(baseScore + 15, 95);
    if (isWeak(dept)) baseScore = Math.max(baseScore - 15, 25);
    
    // Estimate headcount distribution
    const deptDistribution: Record<string, number> = {
      "Engineering": 0.35,
      "Product": 0.10,
      "Design": 0.10,
      "Sales": 0.18,
      "Marketing": 0.12,
      "Operations": 0.15,
    };
    
    const headcount = Math.round(employeeCount * (deptDistribution[dept] ?? 0.10));
    const optimalMultiplier = baseScore < 60 ? 1.4 : baseScore < 75 ? 1.2 : 1.0;
    const optimalHeadcount = Math.ceil(headcount * optimalMultiplier);
    
    return {
      department: dept,
      score: baseScore,
      headcount,
      optimalHeadcount,
      status: headcount < optimalHeadcount ? "understaffed" : 
              headcount > optimalHeadcount * 1.1 ? "overstaffed" : "optimal",
    };
  });
}

/**
 * Generate gap analysis from department health data
 */
function generateGapAnalysis(departmentHealth: DepartmentHealth[]): GapAnalysis[] {
  return departmentHealth.map((dh) => ({
    department: dh.department,
    currentCapacity: Math.round((dh.headcount / dh.optimalHeadcount) * 100),
    requiredCapacity: 100,
  }));
}

/**
 * Generate budget suggestions based on hiring priorities
 */
function generateBudgetSuggestions(
  departmentHealth: DepartmentHealth[],
  recommendation: BackendRecommendation
): BudgetSuggestion[] {
  const totalBudget = 1000000; // Assume $1M hiring budget
  
  // Calculate weights based on how understaffed each dept is
  const gaps = departmentHealth.map((dh) => ({
    department: dh.department,
    gap: Math.max(0, dh.optimalHeadcount - dh.headcount),
    score: dh.score,
  }));
  
  // Boost the department of the primary recommendation
  const recDept = extractDepartment(recommendation.roleToHire, {} as BackendAnalysis);
  
  const totalGap = gaps.reduce((sum, g) => sum + g.gap, 0) || 1;
  
  return gaps.map((g) => {
    let percentage = Math.round((g.gap / totalGap) * 100);
    
    // Boost recommended department
    if (g.department === recDept) {
      percentage = Math.min(percentage + 10, 50);
    }
    
    // Ensure minimum allocation for all depts
    percentage = Math.max(percentage, 5);
    
    return {
      department: g.department,
      percentage,
      amount: Math.round(totalBudget * (percentage / 100)),
    };
  }).sort((a, b) => b.percentage - a.percentage);
}

/**
 * Transform a PipelineResult to frontend AnalysisResult
 */
export function transformPipelineResult(result: PipelineResult): AnalysisResult {
  const { company, analysis, recommendation } = result;
  
  // Transform the single recommendation to an array
  const recommendations: RoleRecommendation[] = [
    transformRecommendation(recommendation, analysis),
  ];
  
  // If there are bottlenecks, add additional recommendations
  analysis.strategicBottlenecks.slice(0, 3).forEach((bottleneck, index) => {
    const roleTitle = inferRoleFromBottleneck(bottleneck);
    if (roleTitle && !recommendations.some(r => r.title.toLowerCase() === roleTitle.toLowerCase())) {
      recommendations.push({
        id: `bottleneck-${index}`,
        title: roleTitle,
        department: extractDepartment(roleTitle, analysis),
        priority: index === 0 ? "high" : "medium",
        reasoning: bottleneck,
        salaryRange: estimateSalaryRange(roleTitle),
        skills: extractSkillsFromBottleneck(bottleneck),
      });
    }
  });
  
  const departmentHealth = generateDepartmentHealth(analysis, company);
  const gapAnalysis = generateGapAnalysis(departmentHealth);
  const budgetSuggestions = generateBudgetSuggestions(departmentHealth, recommendation);
  
  return {
    companyName: company.name,
    totalEmployees: company.employeeCount ?? 30,
    recommendations,
    departmentHealth,
    gapAnalysis,
    budgetSuggestions,
  };
}

/**
 * Infer a role title from a bottleneck description
 */
function inferRoleFromBottleneck(bottleneck: string): string | null {
  const lower = bottleneck.toLowerCase();
  
  if (lower.includes("infrastructure") || lower.includes("devops") || lower.includes("deployment")) {
    return "DevOps Engineer";
  }
  if (lower.includes("frontend") || lower.includes("ui") || lower.includes("user interface")) {
    return "Frontend Engineer";
  }
  if (lower.includes("backend") || lower.includes("api") || lower.includes("server")) {
    return "Backend Engineer";
  }
  if (lower.includes("data") || lower.includes("analytics") || lower.includes("pipeline")) {
    return "Data Engineer";
  }
  if (lower.includes("design") || lower.includes("ux") || lower.includes("user experience")) {
    return "Product Designer";
  }
  if (lower.includes("product") || lower.includes("roadmap") || lower.includes("prioritization")) {
    return "Product Manager";
  }
  if (lower.includes("sales") || lower.includes("revenue") || lower.includes("customer acquisition")) {
    return "Sales Representative";
  }
  if (lower.includes("marketing") || lower.includes("growth") || lower.includes("brand")) {
    return "Marketing Manager";
  }
  if (lower.includes("hiring") || lower.includes("recruiting") || lower.includes("talent")) {
    return "Technical Recruiter";
  }
  if (lower.includes("security") || lower.includes("compliance")) {
    return "Security Engineer";
  }
  
  return null;
}

/**
 * Extract skills from a bottleneck description
 */
function extractSkillsFromBottleneck(bottleneck: string): string[] {
  const skills: string[] = [];
  const lower = bottleneck.toLowerCase();
  
  const skillMap: Record<string, string[]> = {
    "infrastructure": ["AWS/GCP", "Docker", "Kubernetes"],
    "scaling": ["System Design", "Performance", "Load Balancing"],
    "data": ["SQL", "Python", "Data Pipelines"],
    "security": ["Security", "Compliance", "Auditing"],
    "frontend": ["React", "TypeScript", "CSS"],
    "backend": ["Node.js", "APIs", "Databases"],
    "mobile": ["iOS", "Android", "React Native"],
    "design": ["Figma", "UI/UX", "User Research"],
    "product": ["Strategy", "Analytics", "Roadmapping"],
    "sales": ["CRM", "Negotiation", "Outreach"],
    "marketing": ["Content", "SEO", "Analytics"],
  };
  
  for (const [keyword, relatedSkills] of Object.entries(skillMap)) {
    if (lower.includes(keyword)) {
      skills.push(...relatedSkills);
    }
  }
  
  return [...new Set(skills)].slice(0, 5);
}

// ── Tree Transformation ─────────────────────────────────────────────

/**
 * Generate a unique ID for tree nodes
 */
function generateTreeId(prefix: string, name: string): string {
  return `${prefix}_${name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
}

/**
 * Transform a PipelineResult into a TreeNode structure
 * Creates a basic org structure based on the analysis
 */
export function transformPipelineToTree(result: PipelineResult): TreeNode {
  const { company, analysis, recommendation } = result;
  
  // Define standard departments based on analysis states
  const departments: Array<{
    name: string;
    state: string;
    teams: string[];
  }> = [
    { 
      name: "Engineering", 
      state: analysis.engineeringState,
      teams: ["Frontend", "Backend", "Infrastructure"]
    },
    { 
      name: "Product", 
      state: analysis.productState,
      teams: ["Core Product"]
    },
    { 
      name: "Design", 
      state: analysis.productState, // Design often follows product state
      teams: ["Design Team"]
    },
    { 
      name: "Sales", 
      state: analysis.growthState,
      teams: ["Sales Team"]
    },
    { 
      name: "Marketing", 
      state: analysis.growthState,
      teams: ["Marketing Team"]
    },
    { 
      name: "Operations", 
      state: "developing", // Default state
      teams: ["Operations Team"]
    },
  ];
  
  // Determine which departments need recommended roles
  const recDept = extractDepartment(recommendation.roleToHire, analysis);
  
  // Build department nodes
  const departmentNodes: TreeNode[] = departments.map((dept) => {
    const deptId = generateTreeId("dept", dept.name);
    
    // Create team nodes for this department
    const teamNodes: TreeNode[] = dept.teams.map((teamName) => {
      const teamId = generateTreeId(deptId, teamName);
      const teamChildren: TreeNode[] = [];
      
      // Add placeholder employees based on company size distribution
      const employeeCount = company.employeeCount ?? 30;
      const deptDistribution: Record<string, number> = {
        "Engineering": 0.35,
        "Product": 0.10,
        "Design": 0.10,
        "Sales": 0.18,
        "Marketing": 0.12,
        "Operations": 0.15,
      };
      
      const deptEmployees = Math.round(employeeCount * (deptDistribution[dept.name] ?? 0.10));
      const teamCount = dept.teams.length;
      const teamEmployees = Math.max(1, Math.round(deptEmployees / teamCount));
      
      // Add employees
      for (let i = 0; i < Math.min(teamEmployees, 5); i++) {
        teamChildren.push({
          id: `${teamId}_emp_${i}`,
          name: `Team Member ${i + 1}`,
          type: "employee",
          role: `${dept.name} Team Member`,
          department: dept.name,
        });
      }
      
      // Add recommended role if this is the target department/team
      if (dept.name === recDept) {
        teamChildren.push({
          id: `${teamId}_rec_${recommendation.id}`,
          name: recommendation.roleToHire,
          type: "recommended_role",
          role: recommendation.roleToHire,
          department: dept.name,
          priority: urgencyToPriority(recommendation.urgencyScore),
          description: recommendation.summary,
        });
      }
      
      return {
        id: teamId,
        name: teamName,
        type: "team" as const,
        children: teamChildren,
      };
    });
    
    return {
      id: deptId,
      name: dept.name,
      type: "department" as const,
      children: teamNodes,
    };
  });
  
  // Add additional recommended roles from bottlenecks
  analysis.strategicBottlenecks.slice(0, 3).forEach((bottleneck, index) => {
    const roleTitle = inferRoleFromBottleneck(bottleneck);
    if (roleTitle && roleTitle.toLowerCase() !== recommendation.roleToHire.toLowerCase()) {
      const roleDept = extractDepartment(roleTitle, analysis);
      const deptNode = departmentNodes.find(d => d.name === roleDept);
      if (deptNode && deptNode.children && deptNode.children.length > 0) {
        const firstTeam = deptNode.children[0];
        if (firstTeam.children) {
          firstTeam.children.push({
            id: `bottleneck_rec_${index}`,
            name: roleTitle,
            type: "recommended_role",
            role: roleTitle,
            department: roleDept,
            priority: index === 0 ? "high" : "medium",
            description: bottleneck,
          });
        }
      }
    }
  });
  
  // Build the root company node
  return {
    id: "company",
    name: company.name,
    type: "company",
    children: departmentNodes,
  };
}

/**
 * Merge backend tree data with existing tree, preserving user modifications
 * This is useful when you want to update the tree with new backend data
 * while keeping any custom nodes the user has added
 */
export function mergeTreeData(
  existingTree: TreeNode,
  backendTree: TreeNode
): TreeNode {
  // For now, we just return the backend tree
  // In a more sophisticated implementation, you could:
  // 1. Keep user-added nodes that don't exist in backend
  // 2. Update existing nodes with new backend data
  // 3. Mark removed nodes as "deleted" rather than removing them
  return backendTree;
}
