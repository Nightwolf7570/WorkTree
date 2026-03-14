import { NextRequest, NextResponse } from "next/server";
import { getRecommendationById, getCandidates, addCandidates } from "@/lib/server/store";
import { discoverCandidates } from "@/lib/server/serpapi";
import { requireAuth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ recommendationId: string }>;
}

// GET /api/recommendations/:recommendationId/candidates - Get candidates
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  try {
    const { recommendationId } = await params;
    
    const recommendation = getRecommendationById(recommendationId);
    if (!recommendation) {
      return NextResponse.json(
        { error: "Recommendation not found" },
        { status: 404 }
      );
    }

    const candidates = getCandidates(recommendationId);

    return NextResponse.json({ candidates });
  } catch (error) {
    console.error("[Candidates] Get error:", error);
    return NextResponse.json(
      { error: "Failed to get candidates" },
      { status: 500 }
    );
  }
}

// POST /api/recommendations/:recommendationId/candidates - Discover more candidates
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  try {
    const { recommendationId } = await params;
    
    const recommendation = getRecommendationById(recommendationId);
    if (!recommendation) {
      return NextResponse.json(
        { error: "Recommendation not found" },
        { status: 404 }
      );
    }

    console.log(`[Candidates] Discovering candidates for: ${recommendation.roleToHire}`);
    
    // Discover new candidates
    const newCandidates = await discoverCandidates(recommendation);
    
    // Add to existing (avoiding duplicates by checking names)
    const existing = getCandidates(recommendationId);
    const existingNames = new Set(existing.map(c => c.name.toLowerCase()));
    const uniqueNew = newCandidates.filter(c => !existingNames.has(c.name.toLowerCase()));
    
    const allCandidates = addCandidates(recommendationId, uniqueNew);

    return NextResponse.json({ candidates: allCandidates });
  } catch (error) {
    console.error("[Candidates] Discover error:", error);
    const message = error instanceof Error ? error.message : "Failed to discover candidates";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
