import { db, schema } from "../db/index.js";
import { ingestDocuments } from "../ingestion/pipeline.js";
import { parseRawText } from "../ingestion/parsers.js";
import { analyzeCompany } from "../analysis/analyzer.js";
import { recommendRole } from "../recommendation/recommender.js";
import { discoverCandidates } from "../candidates/discovery.js";
import type { CompanyAnalysis } from "../analysis/analyzer.js";
import type { RoleRecommendation } from "../recommendation/recommender.js";
import type { CandidateProfile } from "../candidates/discovery.js";
import type { WorkspaceContext } from "./middleware/context.js";

export interface PipelineResult {
  company: { id: string; name: string };
  documentsIngested: number;
  analysis: CompanyAnalysis;
  recommendation: RoleRecommendation;
  candidates: CandidateProfile[];
}

/**
 * Run the full WorkTree pipeline end-to-end.
 * Documents array is optional — if empty, a synthetic document is created
 * from the company description so the pipeline still works.
 */
export async function runFullPipeline(
  companyInput: {
    name: string;
    website?: string;
    stage?: string;
    employeeCount?: number;
    industry?: string;
    description?: string;
  },
  documents: Array<{ source: string; title: string; content: string }>,
  ctx: WorkspaceContext,
): Promise<PipelineResult> {
  console.log(`[Pipeline] Starting for company: ${companyInput.name}`);

  // Step 1: Create company
  console.log("[Pipeline] Step 1: Creating company record...");
  const [company] = await db
    .insert(schema.companies)
    .values({
      workspaceId: ctx.workspaceId,
      createdBy: ctx.userId,
      name: companyInput.name,
      website: companyInput.website,
      stage: companyInput.stage,
      employeeCount: companyInput.employeeCount,
      industry: companyInput.industry,
      description: companyInput.description,
    })
    .returning();

  // Step 2: Build documents — use provided docs or auto-generate from company info
  const allDocs = [...documents];
  if (allDocs.length === 0 || companyInput.description) {
    // Always include a company overview doc built from the form fields
    const overviewParts: string[] = [];
    overviewParts.push(`Company Name: ${companyInput.name}`);
    if (companyInput.industry) overviewParts.push(`Industry: ${companyInput.industry}`);
    if (companyInput.stage) overviewParts.push(`Stage: ${companyInput.stage}`);
    if (companyInput.employeeCount) overviewParts.push(`Team Size: ${companyInput.employeeCount} employees`);
    if (companyInput.website) overviewParts.push(`Website: ${companyInput.website}`);
    if (companyInput.description) {
      overviewParts.push("");
      overviewParts.push("Company Description:");
      overviewParts.push(companyInput.description);
    }

    allDocs.push({
      source: "company_overview",
      title: `${companyInput.name} - Company Overview`,
      content: overviewParts.join("\n"),
    });
  }

  console.log(`[Pipeline] Step 2: Ingesting ${allDocs.length} documents...`);
  const parsed = allDocs.map((doc) =>
    parseRawText({ title: doc.title, content: doc.content, source: doc.source })
  );
  const docIds = await ingestDocuments(company.id, parsed, ctx);
  console.log(`[Pipeline] Ingested ${docIds.length} document chunks.`);

  // Step 3: Analyze company
  console.log("[Pipeline] Step 3: Analyzing company gaps...");
  const analysis = await analyzeCompany(company.id, ctx) as CompanyAnalysis & { id: string };

  // Step 4: Recommend role
  console.log("[Pipeline] Step 4: Determining highest-ROI hire...");
  const recommendation = await recommendRole(company.id, analysis.id, analysis, ctx);
  console.log(`[Pipeline] Recommended role: ${recommendation.roleToHire} (urgency: ${recommendation.urgencyScore}/10, confidence: ${recommendation.confidenceScore}/10)`);

  // Step 5: Discover candidates
  console.log("[Pipeline] Step 5: Discovering top candidates...");
  const companyContext = [
    `Company: ${company.name}`,
    `Industry: ${company.industry ?? "Technology"}`,
    `Stage: ${analysis.companyStage}`,
    `Description: ${company.description ?? "N/A"}`,
    `Product State: ${analysis.productState}`,
    `Top Bottleneck: ${analysis.topBottleneck}`,
    `Role: ${recommendation.roleToHire}`,
    `Why: ${recommendation.summary}`,
    `Why Now: ${recommendation.whyNow}`,
  ].join("\n");

  const candidates = await discoverCandidates(recommendation.id, recommendation.roleToHire, companyContext, ctx);
  console.log(`[Pipeline] Found ${candidates.length} candidates.`);
  console.log("[Pipeline] Complete!");

  return {
    company: { id: company.id, name: company.name },
    documentsIngested: docIds.length,
    analysis,
    recommendation,
    candidates,
  };
}
