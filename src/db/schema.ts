import { pgTable, uuid, text, timestamp, jsonb, integer, real, varchar, index } from "drizzle-orm/pg-core";

// ── Companies ──────────────────────────────────────────────────────
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: text("workspace_id").notNull(),
  createdBy: text("created_by").notNull(),
  name: text("name").notNull(),
  website: text("website"),
  stage: varchar("stage", { length: 50 }), // pre-seed, seed, series-a, etc.
  employeeCount: integer("employee_count"),
  industry: text("industry"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("companies_workspace_idx").on(table.workspaceId),
]);

// ── Documents (ingested company data) ──────────────────────────────
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  workspaceId: text("workspace_id").notNull(),
  source: varchar("source", { length: 50 }).notNull(), // notion, github, slack, gdocs, pitch_deck, website
  title: text("title").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  embeddingVector: jsonb("embedding_vector").$type<number[]>(), // stored as JSON array for simplicity
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("documents_company_idx").on(table.companyId),
  index("documents_workspace_idx").on(table.workspaceId),
]);

// ── Company Analysis ───────────────────────────────────────────────
export const companyAnalyses = pgTable("company_analyses", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  workspaceId: text("workspace_id").notNull(),
  createdBy: text("created_by").notNull(),
  companyStage: varchar("company_stage", { length: 30 }),
  productState: text("product_state"),
  growthState: text("growth_state"),
  engineeringState: text("engineering_state"),
  strongestAreas: jsonb("strongest_areas").$type<string[]>(),
  weakestAreas: jsonb("weakest_areas").$type<string[]>(),
  strategicBottlenecks: jsonb("strategic_bottlenecks").$type<string[]>(),
  executionRisks: jsonb("execution_risks").$type<string[]>(),
  topBottleneck: text("top_bottleneck"),
  recommendedHiringFocus: text("recommended_hiring_focus"),
  evidence: jsonb("evidence").$type<Array<{ claim: string; supportingContext: string }>>(),
  rawAnalysis: jsonb("raw_analysis").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("analyses_workspace_idx").on(table.workspaceId),
]);

// ── Role Recommendations ───────────────────────────────────────────
export const roleRecommendations = pgTable("role_recommendations", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  analysisId: uuid("analysis_id").references(() => companyAnalyses.id).notNull(),
  workspaceId: text("workspace_id").notNull(),
  createdBy: text("created_by").notNull(),
  roleToHire: text("role_to_hire").notNull(),
  summary: text("summary").notNull(),
  whyNow: text("why_now").notNull(),
  expectedImpact: jsonb("expected_impact").$type<string[]>(),
  urgencyScore: real("urgency_score").notNull(), // 0-10
  confidenceScore: real("confidence_score").notNull(), // 0-10
  signalsUsed: jsonb("signals_used").$type<string[]>(),
  risksIfDelayed: jsonb("risks_if_delayed").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("recommendations_workspace_idx").on(table.workspaceId),
]);

// ── Candidates ─────────────────────────────────────────────────────
export const candidates = pgTable("candidates", {
  id: uuid("id").primaryKey().defaultRandom(),
  recommendationId: uuid("recommendation_id").references(() => roleRecommendations.id).notNull(),
  workspaceId: text("workspace_id").notNull(),
  name: text("name").notNull(),
  title: text("title"),
  linkedinUrl: text("linkedin_url"),
  githubUrl: text("github_url"),
  score: real("score").notNull(),
  reasoning: text("reasoning"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("candidates_recommendation_idx").on(table.recommendationId),
  index("candidates_score_idx").on(table.score),
  index("candidates_workspace_idx").on(table.workspaceId),
]);
