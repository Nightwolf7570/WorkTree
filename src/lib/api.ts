import type {
  BackendAnalysis,
  BackendRecommendation,
  BackendCandidate,
  PipelineResult,
  BackendDocument,
} from "@/types/analysis";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

async function backendFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

// ── Pipeline API ──────────────────────────────────────────────────

export async function runPipeline(
  company: {
    name: string;
    website?: string;
    stage?: string;
    employeeCount?: number;
    industry?: string;
    description?: string;
  },
  documents: BackendDocument[]
): Promise<PipelineResult> {
  return backendFetch<PipelineResult>("/api/pipeline", {
    method: "POST",
    body: JSON.stringify({ company, documents }),
  });
}

// ── Company API ───────────────────────────────────────────────────

export async function getBackendAnalysis(companyId: string): Promise<BackendAnalysis> {
  return backendFetch<BackendAnalysis>(`/api/companies/${companyId}/analysis`);
}

export async function getHireRecommendation(companyId: string): Promise<BackendRecommendation> {
  return backendFetch<BackendRecommendation>(`/api/companies/${companyId}/recommend`, {
    method: "POST",
  });
}

// ── Candidates API ────────────────────────────────────────────────

export async function getCandidates(recommendationId: string): Promise<BackendCandidate[]> {
  const data = await backendFetch<{ candidates: BackendCandidate[] }>(
    `/api/recommendations/${recommendationId}/candidates`
  );
  return data.candidates;
}

export async function discoverCandidates(recommendationId: string): Promise<BackendCandidate[]> {
  const data = await backendFetch<{ candidates: BackendCandidate[] }>(
    `/api/recommendations/${recommendationId}/candidates`,
    { method: "POST" }
  );
  return data.candidates;
}

// ── Settings API ──────────────────────────────────────────────────

export interface CompanyProfilePayload {
  name: string;
  industry: string;
  size: string;
  description: string;
}

export async function saveCompanyProfile(
  profile: CompanyProfilePayload,
  companyId?: string | null
): Promise<{ id: string }> {
  if (companyId) {
    return backendFetch<{ id: string }>(`/api/companies/${companyId}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: profile.name,
        industry: profile.industry,
        employeeCount: parseInt(profile.size, 10) || undefined,
        description: profile.description,
      }),
    });
  }
  
  return backendFetch<{ id: string }>("/api/companies", {
    method: "POST",
    body: JSON.stringify({
      name: profile.name,
      industry: profile.industry,
      employeeCount: parseInt(profile.size, 10) || undefined,
      description: profile.description,
    }),
  });
}
