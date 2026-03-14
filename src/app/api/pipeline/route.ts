import { NextRequest, NextResponse } from "next/server";
import type { BackendDocument, PipelineResult } from "@/types/analysis";
import { generateId, saveCompany, saveAnalysis, saveRecommendation, saveCandidates } from "@/lib/server/store";
import { analyzeCompany, generateRecommendation } from "@/lib/server/openai";
import { discoverCandidates } from "@/lib/server/serpapi";
import { requireAuth } from "@/lib/auth";

interface PipelineRequest {
  company: {
    name: string;
    website?: string;
    stage?: string;
    employeeCount?: number;
    industry?: string;
    description?: string;
  };
  documents: BackendDocument[];
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  try {
    const body: PipelineRequest = await request.json();
    const { company, documents } = body;

    if (!company?.name) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    // 1. Create company record
    const companyId = generateId();
    const companyRecord = {
      id: companyId,
      name: company.name,
      website: company.website,
      stage: company.stage,
      employeeCount: company.employeeCount,
      industry: company.industry,
      description: company.description,
    };
    saveCompany(companyRecord);

    // 2. Run AI analysis
    console.log(`[Pipeline] Analyzing company: ${company.name}`);
    const analysis = await analyzeCompany(companyId, company, documents);
    saveAnalysis(analysis);

    // 3. Generate hiring recommendation
    console.log(`[Pipeline] Generating recommendation for: ${company.name}`);
    const recommendation = await generateRecommendation(companyId, analysis, company.name);
    saveRecommendation(recommendation);

    // 4. Discover candidates
    console.log(`[Pipeline] Discovering candidates for: ${recommendation.roleToHire}`);
    const candidates = await discoverCandidates(recommendation);
    saveCandidates(recommendation.id, candidates);

    // 5. Return complete pipeline result
    const result: PipelineResult = {
      company: companyRecord,
      analysis,
      recommendation,
      candidates,
    };

    console.log(`[Pipeline] Complete for ${company.name}. Recommended: ${recommendation.roleToHire}`);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Pipeline] Error:", error);
    
    const message = error instanceof Error ? error.message : "Pipeline processing failed";
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
