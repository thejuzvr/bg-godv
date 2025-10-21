-- Add companions support to characters table
ALTER TABLE "characters" ADD COLUMN "companions" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "characters" ADD COLUMN "active_companion" text;

-- Create character_companions table
CREATE TABLE IF NOT EXISTS "character_companions" (
	"id" text PRIMARY KEY NOT NULL,
	"character_id" text NOT NULL,
	"npc_id" text NOT NULL,
	"name" text NOT NULL,
	"class" text NOT NULL,
	"rarity" text NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"stats" jsonb NOT NULL,
	"skills" jsonb NOT NULL,
	"abilities" jsonb NOT NULL,
	"personality" jsonb NOT NULL,
	"experience" integer DEFAULT 0 NOT NULL,
	"mood" integer DEFAULT 50 NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"acquired_at" bigint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraint
ALTER TABLE "character_companions" ADD CONSTRAINT "character_companions_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE cascade ON UPDATE no action;

-- Create indexes
CREATE INDEX IF NOT EXISTS "character_companions_character_id_idx" ON "character_companions" ("character_id");
CREATE INDEX IF NOT EXISTS "character_companions_is_active_idx" ON "character_companions" ("is_active");

