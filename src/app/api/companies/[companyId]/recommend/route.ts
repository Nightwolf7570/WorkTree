import { NextRequest, NextResponse } from "next/server";
import { getCompany, getAnalysis, saveRecommendation, getRecommendation } from "@/lib/server/store";
import { generateRecommendation } from "@/lib/server/openai";
import { requireAuth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ companyId: string }>;
}

// POST /api/companies/:companyId/recommend - Generate hiring recommendation
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  try {
    const { companyId } = await params;
    
    const company = getCompany(companyId);
    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    const analysis = getAnalysis(companyId);
    if (!analysis) {
      return NextResponse.json(
        { error: "Analysis not found. Run pipeline first." },
        { status: 404 }
      );
    }

    // Check if recommendation already exists
    const existing = getRecommendation(companyId);
    if (existing) {
      return NextResponse.json(existing);
    }

    // Generate new recommendation
    const recommendation = await generateRecommendation(companyId, analysis, company.name);
    saveRecommendation(recommendation);

    return NextResponse.json(recommendation);
  } catch (error) {
    console.error("[Recommend] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate recommendation";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
