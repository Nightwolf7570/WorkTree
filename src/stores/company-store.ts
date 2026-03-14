import { create } from "zustand";

interface CompanyProfile {
  name: string;
  industry: string;
  size: string;
  description: string;
}

interface CompanyStore {
  profile: CompanyProfile;
  setProfile: (profile: Partial<CompanyProfile>) => void;
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
}));
