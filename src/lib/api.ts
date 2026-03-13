import type { TreeNode } from "@/types/tree";
import type { AnalysisResult } from "@/types/analysis";
import { mockTreeData, mockAnalysisResult } from "./mock-data";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(): number {
  return 800 + Math.random() * 1200;
}

export async function uploadDocuments(
  files: File[]
): Promise<{ jobId: string }> {
  await delay(randomDelay());
  return { jobId: `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` };
}

const processingState: Record<string, number> = {};

export async function getProcessingStatus(
  jobId: string
): Promise<{ status: string; progress: number }> {
  await delay(600);
  if (!processingState[jobId]) {
    processingState[jobId] = 0;
  }
  processingState[jobId] += 25 + Math.random() * 10;
  if (processingState[jobId] >= 100) {
    processingState[jobId] = 100;
    return { status: "complete", progress: 100 };
  }
  return { status: "processing", progress: Math.min(processingState[jobId], 95) };
}

export async function getAnalysisResult(
  jobId: string
): Promise<AnalysisResult> {
  await delay(randomDelay());
  return mockAnalysisResult;
}

export async function getCompanyTree(
  companyId: string
): Promise<TreeNode> {
  await delay(randomDelay());
  return mockTreeData;
}

export async function saveCompanyProfile(profile: {
  name: string;
  industry: string;
  size: string;
  description: string;
}): Promise<void> {
  await delay(randomDelay());
}
