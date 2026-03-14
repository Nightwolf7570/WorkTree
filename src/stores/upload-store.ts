import { create } from "zustand";

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

type ProcessingStatus = "idle" | "uploading" | "processing" | "complete" | "error";

interface UploadStore {
  files: UploadedFile[];
  jobId: string | null;
  processingStatus: ProcessingStatus;
  progress: number;
  addFiles: (files: UploadedFile[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  setJobId: (id: string | null) => void;
  setProcessingStatus: (status: ProcessingStatus) => void;
  setProgress: (progress: number) => void;
  reset: () => void;
}

export const useUploadStore = create<UploadStore>((set) => ({
  files: [],
  jobId: null,
  processingStatus: "idle",
  progress: 0,
  addFiles: (files) => set((state) => ({ files: [...state.files, ...files] })),
  removeFile: (id) => set((state) => ({ files: state.files.filter((f) => f.id !== id) })),
  clearFiles: () => set({ files: [] }),
  setJobId: (id) => set({ jobId: id }),
  setProcessingStatus: (status) => set({ processingStatus: status }),
  setProgress: (progress) => set({ progress }),
  reset: () => set({ files: [], jobId: null, processingStatus: "idle", progress: 0 }),
}));
