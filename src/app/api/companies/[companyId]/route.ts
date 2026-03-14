import { NextRequest, NextResponse } from "next/server";
import { getCompany, updateCompany } from "@/lib/server/store";
import { requireAuth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ companyId: string }>;
}

// GET /api/companies/:companyId - Get a company
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    return NextResponse.json(company);
  } catch (error) {
    console.error("[Companies] Get error:", error);
    return NextResponse.json(
      { error: "Failed to get company" },
      { status: 500 }
    );
  }
}

// PATCH /api/companies/:companyId - Update a company
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  try {
    const { companyId } = await params;
    const body = await request.json();

    const updated = updateCompany(companyId, {
      name: body.name,
      website: body.website,
      stage: body.stage,
      employeeCount: body.employeeCount,
      industry: body.industry,
      description: body.description,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ id: updated.id });
  } catch (error) {
    console.error("[Companies] Update error:", error);
    return NextResponse.json(
      { error: "Failed to update company" },
      { status: 500 }
    );
  }
}
