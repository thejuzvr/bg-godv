CREATE TABLE IF NOT EXISTS "character_interactions" (
  "id" text PRIMARY KEY NOT NULL,
  "character_id" text NOT NULL,
  "source" text NOT NULL,
  "payload" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "character_interactions_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action
);

