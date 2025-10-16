CREATE TABLE "ai_modifiers" (
	"id" text PRIMARY KEY NOT NULL,
	"character_id" text NOT NULL,
	"code" text NOT NULL,
	"label" text,
	"multiplier" real DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"source" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"base_multipliers" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "character_ai_state" (
	"character_id" text PRIMARY KEY NOT NULL,
	"profile_id" text,
	"fatigue" jsonb NOT NULL,
	"learning" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"experiment_group" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_modifiers" ADD CONSTRAINT "ai_modifiers_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_ai_state" ADD CONSTRAINT "character_ai_state_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_ai_state" ADD CONSTRAINT "character_ai_state_profile_id_ai_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."ai_profiles"("id") ON DELETE set null ON UPDATE no action;