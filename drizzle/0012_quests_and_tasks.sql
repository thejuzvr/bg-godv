CREATE TABLE IF NOT EXISTS "quests" (
  "id" text PRIMARY KEY NOT NULL,
  "character_id" text NOT NULL,
  "template_id" text,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "location" text NOT NULL,
  "type" text NOT NULL,
  "status" text DEFAULT 'in-progress' NOT NULL,
  "rewards" jsonb NOT NULL,
  "progress" integer DEFAULT 0 NOT NULL,
  "metadata" jsonb,
  "expires_at" bigint,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "completed_at" timestamp,
  CONSTRAINT "quests_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quest_tasks" (
  "id" text PRIMARY KEY NOT NULL,
  "quest_id" text NOT NULL,
  "idx" integer DEFAULT 0 NOT NULL,
  "title" text NOT NULL,
  "type" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "progress" integer DEFAULT 0 NOT NULL,
  "data" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "completed_at" timestamp,
  CONSTRAINT "quest_tasks_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE cascade ON UPDATE no action
);

