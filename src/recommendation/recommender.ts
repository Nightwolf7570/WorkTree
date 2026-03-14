import { db, schema } from "../db/index.js";
import { jsonCompletion } from "../config/openai.js";
import type { CompanyAnalysis } from "../analysis/analyzer.js";
import type { WorkspaceContext } from "../api/middleware/context.js";

// ── Public types ──────────────────────────────────────────────────

export interface RoleRecommendation {
  id: string;
  roleToHire: string;
  summary: string;
  whyNow: string;
  expectedImpact: string[];
  urgencyScore: number;
  confidenceScore: number;
  signalsUsed: string[];
  risksIfDelayed: string[];
}

// ── LLM response shape (before DB insert adds `id`) ──────────────

interface LLMRecommendation {
  roleToHire: string;
  summary: string;
  whyNow: string;
  expectedImpact: string[];
  urgencyScore: number;
  confidenceScore: number;
  signalsUsed: string[];
  risksIfDelayed: string[];
}

// ── Prompt ────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a startup hiring strategist who has advised 200+ early-stage companies on their
first 10 hires. You are given a structured company analysis containing the company's stage, product/growth/engineering
state, strengths, weaknesses, bottlenecks, execution risks, and evidence.

Your job: determine the single highest-value hire this startup should make right now.

Rules:
- Your recommendation MUST be grounded in the analysis signals. Do not invent problems that aren't there.
- Tie every claim back to specific bottlenecks, risks, or gaps from the analysis.
- Be specific about the role title — "Senior Growth Engineer" not "someone to help with growth".
- Think about what stage the company is at. A pre-seed company doesn't need a VP of Sales.
- The "whyNow" field should explain the cost of NOT hiring for this role in the next 2-3 months.
- signalsUsed should list the specific analysis findings that drove your recommendation.
- risksIfDelayed should describe concrete negative outcomes if the hire is postponed.

Scoring:
- urgencyScore (0-10): How time-sensitive is this hire? 10 = every week without this person costs real damage.
- confidenceScore (0-10): How confident are you in this recommendation given the available evidence?
  A low confidence score (< 6) means the documents didn't give enough signal to be sure.

Respond with valid JSON matching this exact schema:
{
  "roleToHire": "specific job title",
  "summary": "2-3 sentence executive summary of the recommendation — what to hire and why, written for a founder",
  "whyNow": "2-3 sentences on why this hire is urgent at this stage and what breaks if delayed",
  "expectedImpact": [
    "3-5 concrete outcomes this hire should deliver in 3-6 months"
  ],
  "urgencyScore": 8.5,
  "confidenceScore": 7.0,
  "signalsUsed": [
    "3-5 specific signals from the company analysis that drove this recommendation"
  ],
  "risksIfDelayed": [
    "2-4 concrete risks if this hire is not made in the next quarter"
  ]
}`;

// ── Fallback ──────────────────────────────────────────────────────

const FALLBACK: LLMRecommendation = {
  roleToHire: "Software Engineer",
  summary: "",
  whyNow: "",
  expectedImpact: [],
  urgencyScore: 5,
  confidenceScore: 3,
  signalsUsed: [],
  risksIfDelayed: [],
};

// ── Safe field extraction ─────────────────────────────────────────

function safeStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val.filter((v): v is string => typeof v === "string" && v.length > 0);
}

function safeScore(val: unknown, fallback: number): number {
  if (typeof val !== "number" || !Number.isFinite(val)) return fallback;
  return Math.max(0, Math.min(10, val));
}

function normalizeRecommendation(raw: Record<string, unknown>): LLMRecommendation {
  return {
    roleToHire: typeof raw.roleToHire === "string" && raw.roleToHire.length > 0
      ? raw.roleToHire
      : FALLBACK.roleToHire,
    summary: typeof raw.summary === "string" ? raw.summary : "",
    whyNow: typeof raw.whyNow === "string" ? raw.whyNow : "",
    expectedImpact: safeStringArray(raw.expectedImpact),
    urgencyScore: safeScore(raw.urgencyScore, FALLBACK.urgencyScore),
    confidenceScore: safeScore(raw.confidenceScore, FALLBACK.confidenceScore),
    signalsUsed: safeStringArray(raw.signalsUsed),
    risksIfDelayed: safeStringArray(raw.risksIfDelayed),
  };
}

// ── Build user prompt with analysis context ───────────────────────

function buildUserPrompt(analysis: CompanyAnalysis): string {
  const sections: string[] = [
    `COMPANY STAGE: ${analysis.companyStage}`,
    ``,
    `PRODUCT STATE: ${analysis.productState}`,
    `GROWTH STATE: ${analysis.growthState}`,
    `ENGINEERING STATE: ${analysis.engineeringState}`,
    ``,
    `STRONGEST AREAS:`,
    ...analysis.strongestAreas.map((a) => `  - ${a}`),
    ``,
    `WEAKEST AREAS:`,
    ...analysis.weakestAreas.map((a) => `  - ${a}`),
    ``,
    `STRATEGIC BOTTLENECKS:`,
    ...analysis.strategicBottlenecks.map((b) => `  - ${b}`),
    ``,
    `EXECUTION RISKS:`,
    ...analysis.executionRisks.map((r) => `  - ${r}`),
    ``,
    `TOP BOTTLENECK: ${analysis.topBottleneck}`,
    `RECOMMENDED HIRING FOCUS (from analysis): ${analysis.recommendedHiringFocus}`,
  ];

  if (analysis.evidence.length > 0) {
    sections.push(``, `SUPPORTING EVIDENCE:`);
    for (const e of analysis.evidence) {
      sections.push(`  - ${e.claim}: "${e.supportingContext}"`);
    }
  }

  sections.push(
    ``,
    `Based on the above analysis, determine the single highest-value hire for this startup.`,
  );

  return sections.join("\n");
}

// ── Public API ────────────────────────────────────────────────────

export async function recommendRole(
  companyId: string,
  analysisId: string,
  analysis: CompanyAnalysis,
  ctx: WorkspaceContext,
): Promise<RoleRecommendation> {
  const raw = await jsonCompletion<Record<string, unknown>>({
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(analysis),
    temperature: 0.3,
    fallback: FALLBACK as unknown as Record<string, unknown>,
  });

  const rec = normalizeRecommendation(raw);

  // Persist to database
  const [row] = await db
    .insert(schema.roleRecommendations)
    .values({
      companyId,
      analysisId,
      workspaceId: ctx.workspaceId,
      createdBy: ctx.userId,
      roleToHire: rec.roleToHire,
      summary: rec.summary,
      whyNow: rec.whyNow,
      expectedImpact: rec.expectedImpact,
      urgencyScore: rec.urgencyScore,
      confidenceScore: rec.confidenceScore,
      signalsUsed: rec.signalsUsed,
      risksIfDelayed: rec.risksIfDelayed,
    })
    .returning();

  return {
    id: row.id,
    roleToHire: row.roleToHire,
    summary: row.summary,
    whyNow: row.whyNow,
    expectedImpact: (row.expectedImpact ?? []) as string[],
    urgencyScore: row.urgencyScore,
    confidenceScore: row.confidenceScore,
    signalsUsed: (row.signalsUsed ?? []) as string[],
    risksIfDelayed: (row.risksIfDelayed ?? []) as string[],
  };
}
