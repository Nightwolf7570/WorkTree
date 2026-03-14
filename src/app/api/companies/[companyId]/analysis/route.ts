import { NextRequest, NextResponse } from "next/server";
import { getAnalysis } from "@/lib/server/store";
import { requireAuth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ companyId: string }>;
}

// GET /api/companies/:companyId/analysis - Get company analysis
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  try {
    const { companyId } = await params;
    const analysis = getAnalysis(companyId);

    if (!analysis) {
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("[Analysis] Get error:", error);
    return NextResponse.json(
      { error: "Failed to get analysis" },
      { status: 500 }
    );
  }
}
