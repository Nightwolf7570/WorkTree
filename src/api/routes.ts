import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { ingestDocuments } from "../ingestion/pipeline.js";
import { parseRawText, parseGitHubRepo, parseNotionPage, parseWebsite } from "../ingestion/parsers.js";
import { analyzeCompany } from "../analysis/analyzer.js";
import { recommendRole } from "../recommendation/recommender.js";
import { discoverCandidates } from "../candidates/discovery.js";
import { runFullPipeline } from "./orchestrator.js";
import { requireAuth, type AuthEnv } from "./middleware/auth.js";
import type { WorkspaceContext } from "./middleware/context.js";

export const api = new Hono<AuthEnv>();

// ── Health (public) ───────────────────────────────────────────────
api.get("/health", (c) => c.json({ status: "ok", service: "worktree" }));

// ── Apply auth to everything below ────────────────────────────────
api.use("/*", requireAuth);

// ── Helper: build WorkspaceContext from authenticated request ──────
function wsCtx(c: { var: { user: { workspaceId: string; userId: string } } }): WorkspaceContext {
  return { workspaceId: c.var.user.workspaceId, userId: c.var.user.userId };
}

// ── Companies ──────────────────────────────────────────────────────
api.post("/companies", async (c) => {
  const { workspaceId, userId } = c.var.user;
  const body = await c.req.json<{
    name: string;
    website?: string;
    stage?: string;
    employeeCount?: number;
    industry?: string;
    description?: string;
  }>();

  const [company] = await db
    .insert(schema.companies)
    .values({
      workspaceId,
      createdBy: userId,
      name: body.name,
      website: body.website,
      stage: body.stage,
      employeeCount: body.employeeCount,
      industry: body.industry,
      description: body.description,
    })
    .returning();

  return c.json(company, 201);
});

api.get("/companies", async (c) => {
  const { workspaceId } = c.var.user;
  const companies = await db
    .select()
    .from(schema.companies)
    .where(eq(schema.companies.workspaceId, workspaceId));

  return c.json(companies);
});

api.get("/companies/:id", async (c) => {
  const { workspaceId } = c.var.user;
  const id = c.req.param("id");
  const [company] = await db
    .select()
    .from(schema.companies)
    .where(and(eq(schema.companies.id, id), eq(schema.companies.workspaceId, workspaceId)));

  if (!company) return c.json({ error: "Company not found" }, 404);
  return c.json(company);
});

// ── Document Ingestion ─────────────────────────────────────────────
api.post("/companies/:id/documents", async (c) => {
  const { workspaceId } = c.var.user;
  const companyId = c.req.param("id");

  // Verify company belongs to this workspace
  const [company] = await db
    .select({ id: schema.companies.id })
    .from(schema.companies)
    .where(and(eq(schema.companies.id, companyId), eq(schema.companies.workspaceId, workspaceId)));

  if (!company) return c.json({ error: "Company not found" }, 404);

  const body = await c.req.json<{
    documents: Array<{
      source: string;
      title: string;
      content: string;
      metadata?: Record<string, unknown>;
    }>;
  }>();

  const parsed = body.documents.map((doc) =>
    parseRawText({ title: doc.title, content: doc.content, source: doc.source })
  );

  const ids = await ingestDocuments(companyId, parsed, wsCtx(c));
  return c.json({ ingested: ids.length, documentIds: ids }, 201);
});

// ── Analysis ───────────────────────────────────────────────────────
api.post("/companies/:id/analyze", async (c) => {
  const { workspaceId } = c.var.user;
  const companyId = c.req.param("id");

  // Verify ownership
  const [company] = await db
    .select({ id: schema.companies.id })
    .from(schema.companies)
    .where(and(eq(schema.companies.id, companyId), eq(schema.companies.workspaceId, workspaceId)));

  if (!company) return c.json({ error: "Company not found" }, 404);

  const analysis = await analyzeCompany(companyId, wsCtx(c));
  return c.json(analysis);
});

api.get("/companies/:id/analysis", async (c) => {
  const { workspaceId } = c.var.user;
  const companyId = c.req.param("id");

  const [analysis] = await db
    .select()
    .from(schema.companyAnalyses)
    .where(
      and(
        eq(schema.companyAnalyses.companyId, companyId),
        eq(schema.companyAnalyses.workspaceId, workspaceId),
      ),
    )
    .orderBy(schema.companyAnalyses.createdAt)
    .limit(1);

  if (!analysis) return c.json({ error: "No analysis found. Run POST /analyze first." }, 404);
  return c.json(analysis);
});

// ── Role Recommendation ────────────────────────────────────────────
api.post("/companies/:id/recommend", async (c) => {
  const { workspaceId } = c.var.user;
  const companyId = c.req.param("id");

  // Verify ownership
  const [company] = await db
    .select({ id: schema.companies.id })
    .from(schema.companies)
    .where(and(eq(schema.companies.id, companyId), eq(schema.companies.workspaceId, workspaceId)));

  if (!company) return c.json({ error: "Company not found" }, 404);

  // Get latest analysis scoped to workspace
  const [analysis] = await db
    .select()
    .from(schema.companyAnalyses)
    .where(
      and(
        eq(schema.companyAnalyses.companyId, companyId),
        eq(schema.companyAnalyses.workspaceId, workspaceId),
      ),
    )
    .orderBy(schema.companyAnalyses.createdAt)
    .limit(1);

  if (!analysis) {
    return c.json({ error: "No analysis found. Run POST /analyze first." }, 400);
  }

  const recommendation = await recommendRole(companyId, analysis.id, {
    companyStage: analysis.companyStage ?? "pre-seed",
    productState: analysis.productState ?? "",
    growthState: analysis.growthState ?? "",
    engineeringState: analysis.engineeringState ?? "",
    strongestAreas: analysis.strongestAreas ?? [],
    weakestAreas: analysis.weakestAreas ?? [],
    strategicBottlenecks: analysis.strategicBottlenecks ?? [],
    executionRisks: analysis.executionRisks ?? [],
    topBottleneck: analysis.topBottleneck ?? "",
    recommendedHiringFocus: analysis.recommendedHiringFocus ?? "",
    evidence: (analysis.evidence ?? []) as Array<{ claim: string; supportingContext: string }>,
  }, wsCtx(c));

  return c.json(recommendation);
});

// ── Candidate Discovery ────────────────────────────────────────────
api.post("/recommendations/:id/candidates", async (c) => {
  const { workspaceId } = c.var.user;
  const recommendationId = c.req.param("id");

  // Verify recommendation belongs to this workspace
  const [rec] = await db
    .select()
    .from(schema.roleRecommendations)
    .where(
      and(
        eq(schema.roleRecommendations.id, recommendationId),
        eq(schema.roleRecommendations.workspaceId, workspaceId),
      ),
    );

  if (!rec) return c.json({ error: "Recommendation not found" }, 404);

  const [company] = await db
    .select()
    .from(schema.companies)
    .where(and(eq(schema.companies.id, rec.companyId), eq(schema.companies.workspaceId, workspaceId)));

  const companyContext = `Company: ${company?.name ?? "Unknown"}\nIndustry: ${company?.industry ?? "Tech"}\nStage: ${company?.stage ?? "Early"}\nRole needed: ${rec.roleToHire}\nWhy: ${rec.summary}`;

  const candidates = await discoverCandidates(recommendationId, rec.roleToHire, companyContext, wsCtx(c));
  return c.json({ candidates });
});

api.get("/recommendations/:id/candidates", async (c) => {
  const { workspaceId } = c.var.user;
  const recommendationId = c.req.param("id");

  // Verify recommendation belongs to this workspace
  const [rec] = await db
    .select({ id: schema.roleRecommendations.id })
    .from(schema.roleRecommendations)
    .where(
      and(
        eq(schema.roleRecommendations.id, recommendationId),
        eq(schema.roleRecommendations.workspaceId, workspaceId),
      ),
    );

  if (!rec) return c.json({ error: "Recommendation not found" }, 404);

  const candidateList = await db
    .select()
    .from(schema.candidates)
    .where(
      and(
        eq(schema.candidates.recommendationId, recommendationId),
        eq(schema.candidates.workspaceId, workspaceId),
      ),
    )
    .orderBy(schema.candidates.score);

  return c.json({ candidates: candidateList });
});

// ── Full Pipeline (one-shot) ───────────────────────────────────────
api.post("/pipeline", async (c) => {
  const body = await c.req.json<{
    company: {
      name: string;
      website?: string;
      stage?: string;
      employeeCount?: number;
      industry?: string;
      description?: string;
    };
    documents: Array<{
      source: string;
      title: string;
      content: string;
    }>;
  }>();

  const result = await runFullPipeline(body.company, body.documents, wsCtx(c));
  return c.json(result);
});
