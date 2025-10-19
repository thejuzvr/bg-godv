CREATE TABLE IF NOT EXISTS "crafting_stations" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "discipline" text NOT NULL,
  "location" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crafting_recipes" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "discipline" text NOT NULL,
  "station" text NOT NULL,
  "inputs" jsonb NOT NULL,
  "outputs" jsonb NOT NULL,
  "skill_req" integer DEFAULT 0 NOT NULL,
  "xp" integer DEFAULT 5 NOT NULL,
  "success_base" real DEFAULT 0.9 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "character_crafting_skills" (
  "id" text PRIMARY KEY NOT NULL,
  "character_id" text NOT NULL,
  "discipline" text NOT NULL,
  "level" integer DEFAULT 1 NOT NULL,
  "xp" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "character_crafting_skills_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action
);

