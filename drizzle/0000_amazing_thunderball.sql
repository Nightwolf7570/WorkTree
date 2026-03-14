CREATE TABLE "candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recommendation_id" uuid NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"title" text,
	"linkedin_url" text,
	"github_url" text,
	"score" real NOT NULL,
	"reasoning" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL,
	"created_by" text NOT NULL,
	"name" text NOT NULL,
	"website" text,
	"stage" varchar(50),
	"employee_count" integer,
	"industry" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"workspace_id" text NOT NULL,
	"created_by" text NOT NULL,
	"company_stage" varchar(30),
	"product_state" text,
	"growth_state" text,
	"engineering_state" text,
	"strongest_areas" jsonb,
	"weakest_areas" jsonb,
	"strategic_bottlenecks" jsonb,
	"execution_risks" jsonb,
	"top_bottleneck" text,
	"recommended_hiring_focus" text,
	"evidence" jsonb,
	"raw_analysis" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"workspace_id" text NOT NULL,
	"source" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"embedding_vector" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"analysis_id" uuid NOT NULL,
	"workspace_id" text NOT NULL,
	"created_by" text NOT NULL,
	"role_to_hire" text NOT NULL,
	"summary" text NOT NULL,
	"why_now" text NOT NULL,
	"expected_impact" jsonb,
	"urgency_score" real NOT NULL,
	"confidence_score" real NOT NULL,
	"signals_used" jsonb,
	"risks_if_delayed" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_recommendation_id_role_recommendations_id_fk" FOREIGN KEY ("recommendation_id") REFERENCES "public"."role_recommendations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_analyses" ADD CONSTRAINT "company_analyses_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_recommendations" ADD CONSTRAINT "role_recommendations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_recommendations" ADD CONSTRAINT "role_recommendations_analysis_id_company_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."company_analyses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "candidates_recommendation_idx" ON "candidates" USING btree ("recommendation_id");--> statement-breakpoint
CREATE INDEX "candidates_score_idx" ON "candidates" USING btree ("score");--> statement-breakpoint
CREATE INDEX "candidates_workspace_idx" ON "candidates" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "companies_workspace_idx" ON "companies" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "analyses_workspace_idx" ON "company_analyses" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "documents_company_idx" ON "documents" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "documents_workspace_idx" ON "documents" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "recommendations_workspace_idx" ON "role_recommendations" USING btree ("workspace_id");