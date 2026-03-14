CREATE TABLE `candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`recommendation_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`name` text NOT NULL,
	`title` text,
	`linkedin_url` text,
	`github_url` text,
	`score` real NOT NULL,
	`reasoning` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`recommendation_id`) REFERENCES `role_recommendations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`created_by` text NOT NULL,
	`name` text NOT NULL,
	`website` text,
	`stage` text,
	`employee_count` integer,
	`industry` text,
	`description` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `company_analyses` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`created_by` text NOT NULL,
	`company_stage` text,
	`product_state` text,
	`growth_state` text,
	`engineering_state` text,
	`strongest_areas` text,
	`weakest_areas` text,
	`strategic_bottlenecks` text,
	`execution_risks` text,
	`top_bottleneck` text,
	`recommended_hiring_focus` text,
	`evidence` text,
	`raw_analysis` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`source` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`metadata` text,
	`embedding_vector` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `role_recommendations` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`analysis_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`created_by` text NOT NULL,
	`role_to_hire` text NOT NULL,
	`summary` text NOT NULL,
	`why_now` text NOT NULL,
	`expected_impact` text,
	`urgency_score` real NOT NULL,
	`confidence_score` real NOT NULL,
	`signals_used` text,
	`risks_if_delayed` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`analysis_id`) REFERENCES `company_analyses`(`id`) ON UPDATE no action ON DELETE no action
);
