import { create } from "zustand";
import type { PipelineResult } from "@/types/analysis";

interface CompanyProfile {
  name: string;
  industry: string;
  size: string;
  description: string;
}

interface CompanyStore {
  profile: CompanyProfile;
  setProfile: (profile: Partial<CompanyProfile>) => void;
  // Backend pipeline result
  pipelineResult: PipelineResult | null;
  setPipelineResult: (result: PipelineResult | null) => void;
  companyId: string | null;
  recommendationId: string | null;
}

export const useCompanyStore = create<CompanyStore>((set) => ({
  profile: {
    name: "Acme Technologies",
    industry: "SaaS / Developer Tools",
    size: "40",
    description: "Series A startup building developer productivity tools.",
  },
  setProfile: (profile) =>
    set((state) => ({ profile: { ...state.profile, ...profile } })),
  pipelineResult: null,
  setPipelineResult: (result) =>
    set({
      pipelineResult: result,
      companyId: result?.company.id ?? null,
      recommendationId: result?.recommendation.id ?? null,
    }),
  companyId: null,
  recommendationId: null,
}));
