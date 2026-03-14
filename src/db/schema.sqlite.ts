import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ── Companies ──────────────────────────────────────────────────────
export const companies = sqliteTable("companies", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  workspaceId: text("workspace_id").notNull(),
  createdBy: text("created_by").notNull(),
  name: text("name").notNull(),
  website: text("website"),
  stage: text("stage"),
  employeeCount: integer("employee_count"),
  industry: text("industry"),
  description: text("description"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ── Documents (ingested company data) ──────────────────────────────
export const documents = sqliteTable("documents", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").references(() => companies.id).notNull(),
  workspaceId: text("workspace_id").notNull(),
  source: text("source").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
  embeddingVector: text("embedding_vector", { mode: "json" }).$type<number[]>(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ── Company Analysis ───────────────────────────────────────────────
export const companyAnalyses = sqliteTable("company_analyses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").references(() => companies.id).notNull(),
  workspaceId: text("workspace_id").notNull(),
  createdBy: text("created_by").notNull(),
  companyStage: text("company_stage"),
  productState: text("product_state"),
  growthState: text("growth_state"),
  engineeringState: text("engineering_state"),
  strongestAreas: text("strongest_areas", { mode: "json" }).$type<string[]>(),
  weakestAreas: text("weakest_areas", { mode: "json" }).$type<string[]>(),
  strategicBottlenecks: text("strategic_bottlenecks", { mode: "json" }).$type<string[]>(),
  executionRisks: text("execution_risks", { mode: "json" }).$type<string[]>(),
  topBottleneck: text("top_bottleneck"),
  recommendedHiringFocus: text("recommended_hiring_focus"),
  evidence: text("evidence", { mode: "json" }).$type<Array<{ claim: string; supportingContext: string }>>(),
  rawAnalysis: text("raw_analysis", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ── Role Recommendations ───────────────────────────────────────────
export const roleRecommendations = sqliteTable("role_recommendations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").references(() => companies.id).notNull(),
  analysisId: text("analysis_id").references(() => companyAnalyses.id).notNull(),
  workspaceId: text("workspace_id").notNull(),
  createdBy: text("created_by").notNull(),
  roleToHire: text("role_to_hire").notNull(),
  summary: text("summary").notNull(),
  whyNow: text("why_now").notNull(),
  expectedImpact: text("expected_impact", { mode: "json" }).$type<string[]>(),
  urgencyScore: real("urgency_score").notNull(),
  confidenceScore: real("confidence_score").notNull(),
  signalsUsed: text("signals_used", { mode: "json" }).$type<string[]>(),
  risksIfDelayed: text("risks_if_delayed", { mode: "json" }).$type<string[]>(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ── Candidates ─────────────────────────────────────────────────────
export const candidates = sqliteTable("candidates", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  recommendationId: text("recommendation_id").references(() => roleRecommendations.id).notNull(),
  workspaceId: text("workspace_id").notNull(),
  name: text("name").notNull(),
  title: text("title"),
  linkedinUrl: text("linkedin_url"),
  githubUrl: text("github_url"),
  score: real("score").notNull(),
  reasoning: text("reasoning"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});
