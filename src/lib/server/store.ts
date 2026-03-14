// In-memory storage for the app (in production, use a database)
// This is a simple store that persists across API calls but resets on server restart

import type {
  BackendCompany,
  BackendAnalysis,
  BackendRecommendation,
  BackendCandidate,
  PipelineResult,
} from "@/types/analysis";

interface AppStore {
  companies: Map<string, BackendCompany>;
  analyses: Map<string, BackendAnalysis>;
  recommendations: Map<string, BackendRecommendation>;
  candidates: Map<string, BackendCandidate[]>;
}

// Global store instance
const store: AppStore = {
  companies: new Map(),
  analyses: new Map(),
  recommendations: new Map(),
  candidates: new Map(),
};

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// Company operations
export function saveCompany(company: BackendCompany): void {
  store.companies.set(company.id, company);
}

export function getCompany(id: string): BackendCompany | undefined {
  return store.companies.get(id);
}

export function updateCompany(id: string, updates: Partial<BackendCompany>): BackendCompany | null {
  const existing = store.companies.get(id);
  if (!existing) return null;
  const updated = { ...existing, ...updates };
  store.companies.set(id, updated);
  return updated;
}

// Analysis operations
export function saveAnalysis(analysis: BackendAnalysis): void {
  store.analyses.set(analysis.id, analysis);
}

export function getAnalysis(companyId: string): BackendAnalysis | undefined {
  // Find analysis by companyId
  for (const analysis of store.analyses.values()) {
    if (analysis.companyId === companyId) {
      return analysis;
    }
  }
  return undefined;
}

export function getAnalysisById(id: string): BackendAnalysis | undefined {
  return store.analyses.get(id);
}

// Recommendation operations
export function saveRecommendation(recommendation: BackendRecommendation): void {
  store.recommendations.set(recommendation.id, recommendation);
}

export function getRecommendation(companyId: string): BackendRecommendation | undefined {
  for (const rec of store.recommendations.values()) {
    if (rec.companyId === companyId) {
      return rec;
    }
  }
  return undefined;
}

export function getRecommendationById(id: string): BackendRecommendation | undefined {
  return store.recommendations.get(id);
}

// Candidate operations
export function saveCandidates(recommendationId: string, candidates: BackendCandidate[]): void {
  store.candidates.set(recommendationId, candidates);
}

export function getCandidates(recommendationId: string): BackendCandidate[] {
  return store.candidates.get(recommendationId) ?? [];
}

export function addCandidates(recommendationId: string, newCandidates: BackendCandidate[]): BackendCandidate[] {
  const existing = store.candidates.get(recommendationId) ?? [];
  const updated = [...existing, ...newCandidates];
  store.candidates.set(recommendationId, updated);
  return updated;
}

// Full pipeline result retrieval
export function getPipelineResult(companyId: string): PipelineResult | null {
  const company = getCompany(companyId);
  const analysis = getAnalysis(companyId);
  const recommendation = getRecommendation(companyId);
  
  if (!company || !analysis || !recommendation) {
    return null;
  }
  
  const candidates = getCandidates(recommendation.id);
  
  return {
    company,
    analysis,
    recommendation,
    candidates,
  };
}
