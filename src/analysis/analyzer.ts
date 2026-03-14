import { eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { jsonCompletion } from "../config/openai.js";
import type { WorkspaceContext } from "../api/middleware/context.js";

// ── Public types ──────────────────────────────────────────────────

export interface AnalysisEvidence {
  claim: string;
  supportingContext: string;
}

export interface CompanyAnalysis {
  companyStage: string;
  productState: string;
  growthState: string;
  engineeringState: string;
  strongestAreas: string[];
  weakestAreas: string[];
  strategicBottlenecks: string[];
  executionRisks: string[];
  topBottleneck: string;
  recommendedHiringFocus: string;
  evidence: AnalysisEvidence[];
}

// ── Prompt ────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a veteran startup advisor who has evaluated hundreds of early-stage companies.
You are given a collection of internal company documents — pitch decks, product roadmaps, GitHub repositories,
Slack conversations, Notion docs, and website copy. Your job is to produce a rigorous organizational analysis
that a founder can use to decide their next hire.

Analyze ONLY what is supported by the documents. Do not speculate beyond the evidence.

For every claim you make, cite the specific document content that supports it in the "evidence" array.

You must respond with valid JSON matching this exact schema:

{
  "companyStage": "pre-seed | seed | series-a | series-b | growth",
  "productState": "1-2 sentence assessment of product maturity, feature completeness, and user-readiness",
  "growthState": "1-2 sentence assessment of traction, user acquisition, revenue, and market positioning",
  "engineeringState": "1-2 sentence assessment of technical architecture, team capacity, and code quality",
  "strongestAreas": [
    "3-5 specific areas where the company is performing well, based on document evidence"
  ],
  "weakestAreas": [
    "3-5 specific areas where the company has clear gaps or underinvestment"
  ],
  "strategicBottlenecks": [
    "2-4 bottlenecks that are actively limiting the company's ability to grow or ship"
  ],
  "executionRisks": [
    "2-4 risks that could cause the company to fail or stall if not addressed"
  ],
  "topBottleneck": "The single most critical bottleneck — the one thing that, if solved, would unlock the most progress",
  "recommendedHiringFocus": "The functional area (engineering, product, design, growth, sales, ops) where the next hire would create the most leverage, with a brief explanation",
  "evidence": [
    {
      "claim": "A specific finding from your analysis",
      "supportingContext": "The exact text or detail from the documents that supports this claim"
    }
  ]
}

Guidelines:
- companyStage should be inferred from funding mentions, team size, revenue signals, and product maturity
- strongestAreas and weakestAreas should be concrete ("strong React frontend with component library" not just "good engineering")
- strategicBottlenecks are things blocking progress NOW, not hypothetical future problems
- executionRisks are things that could go wrong — team concentration risk, single point of failure, missing expertise
- evidence should contain 4-8 entries covering your most important claims
- topBottleneck should directly inform recommendedHiringFocus
- be brutally honest — founders need actionable truth, not encouragement`;

// ── Fallback ──────────────────────────────────────────────────────

const FALLBACK: CompanyAnalysis = {
  companyStage: "pre-seed",
  productState: "",
  growthState: "",
  engineeringState: "",
  strongestAreas: [],
  weakestAreas: [],
  strategicBottlenecks: [],
  executionRisks: [],
  topBottleneck: "",
  recommendedHiringFocus: "",
  evidence: [],
};

// ── Document assembly ─────────────────────────────────────────────

interface DocChunk {
  source: string;
  title: string;
  content: string;
}

function assembleContext(docs: DocChunk[]): string {
  // Group chunks by source for cleaner context
  const bySource = new Map<string, DocChunk[]>();
  for (const doc of docs) {
    const group = bySource.get(doc.source) ?? [];
    group.push(doc);
    bySource.set(doc.source, group);
  }

  const sections: string[] = [];
  for (const [source, chunks] of bySource) {
    sections.push(`========== ${source.toUpperCase()} DOCUMENTS ==========`);
    for (const chunk of chunks) {
      sections.push(`--- ${chunk.title} ---`);
      sections.push(chunk.content);
      sections.push("");
    }
  }

  const assembled = sections.join("\n");

  // Truncate to stay within context window (leave room for system prompt + response)
  return assembled.slice(0, 120_000);
}

// ── Safe field extraction ─────────────────────────────────────────

function safeStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val.filter((v): v is string => typeof v === "string");
}

function safeEvidence(val: unknown): AnalysisEvidence[] {
  if (!Array.isArray(val)) return [];
  return val
    .filter((v): v is Record<string, unknown> => typeof v === "object" && v !== null)
    .map((v) => ({
      claim: typeof v.claim === "string" ? v.claim : "",
      supportingContext: typeof v.supportingContext === "string" ? v.supportingContext : "",
    }))
    .filter((e) => e.claim.length > 0);
}

function normalizeAnalysis(raw: Record<string, unknown>): CompanyAnalysis {
  return {
    companyStage: typeof raw.companyStage === "string" ? raw.companyStage : FALLBACK.companyStage,
    productState: typeof raw.productState === "string" ? raw.productState : "",
    growthState: typeof raw.growthState === "string" ? raw.growthState : "",
    engineeringState: typeof raw.engineeringState === "string" ? raw.engineeringState : "",
    strongestAreas: safeStringArray(raw.strongestAreas),
    weakestAreas: safeStringArray(raw.weakestAreas),
    strategicBottlenecks: safeStringArray(raw.strategicBottlenecks),
    executionRisks: safeStringArray(raw.executionRisks),
    topBottleneck: typeof raw.topBottleneck === "string" ? raw.topBottleneck : "",
    recommendedHiringFocus: typeof raw.recommendedHiringFocus === "string" ? raw.recommendedHiringFocus : "",
    evidence: safeEvidence(raw.evidence),
  };
}

// ── Public API ────────────────────────────────────────────────────

/**
 * Analyze a company by reading all its ingested documents and producing
 * a structured startup assessment using LLM reasoning.
 *
 * Returns a typed CompanyAnalysis with an `id` field from the DB row.
 */
export async function analyzeCompany(
  companyId: string,
  ctx: WorkspaceContext,
): Promise<CompanyAnalysis & { id: string }> {
  // 1. Retrieve all document chunks for this company
  const docs = await db
    .select({
      source: schema.documents.source,
      title: schema.documents.title,
      content: schema.documents.content,
    })
    .from(schema.documents)
    .where(eq(schema.documents.companyId, companyId));

  if (docs.length === 0) {
    throw new Error(`No documents found for company ${companyId}. Ingest documents first.`);
  }

  // 2. Assemble document context grouped by source
  const context = assembleContext(docs);

  // 3. Call LLM with grounded prompt
  const raw = await jsonCompletion<Record<string, unknown>>({
    system: SYSTEM_PROMPT,
    user: [
      `Analyze the following ${docs.length} document chunks from this company.`,
      `Produce a structured startup analysis grounded in the evidence below.`,
      ``,
      context,
    ].join("\n"),
    temperature: 0.2,
    fallback: FALLBACK as unknown as Record<string, unknown>,
  });

  // 4. Normalize into typed shape with safe field extraction
  const analysis = normalizeAnalysis(raw);

  // 5. Persist to database
  const [row] = await db
    .insert(schema.companyAnalyses)
    .values({
      companyId,
      workspaceId: ctx.workspaceId,
      createdBy: ctx.userId,
      companyStage: analysis.companyStage,
      productState: analysis.productState,
      growthState: analysis.growthState,
      engineeringState: analysis.engineeringState,
      strongestAreas: analysis.strongestAreas,
      weakestAreas: analysis.weakestAreas,
      strategicBottlenecks: analysis.strategicBottlenecks,
      executionRisks: analysis.executionRisks,
      topBottleneck: analysis.topBottleneck,
      recommendedHiringFocus: analysis.recommendedHiringFocus,
      evidence: analysis.evidence,
      rawAnalysis: raw,
    })
    .returning();

  return { ...analysis, id: row.id };
}
