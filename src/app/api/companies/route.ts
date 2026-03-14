import { NextRequest, NextResponse } from "next/server";
import { generateId, saveCompany } from "@/lib/server/store";
import { requireAuth } from "@/lib/auth";

// POST /api/companies - Create a new company
export async function POST(request: NextRequest) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  try {
    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    const company = {
      id: generateId(),
      name: body.name,
      website: body.website,
      stage: body.stage,
      employeeCount: body.employeeCount,
      industry: body.industry,
      description: body.description,
    };

    saveCompany(company);

    return NextResponse.json({ id: company.id });
  } catch (error) {
    console.error("[Companies] Create error:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}
