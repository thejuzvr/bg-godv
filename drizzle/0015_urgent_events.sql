CREATE TABLE IF NOT EXISTS "urgent_events" (
  "id" text PRIMARY KEY NOT NULL,
  "character_id" text NOT NULL,
  "key" text NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "current_step" integer DEFAULT 0 NOT NULL,
  "expires_at" bigint,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "urgent_event_steps" (
  "id" text PRIMARY KEY NOT NULL,
  "urgent_event_id" text NOT NULL,
  "idx" integer DEFAULT 0 NOT NULL,
  "type" text NOT NULL,
  "data" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "urgent_events" ADD CONSTRAINT "urgent_events_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "urgent_event_steps" ADD CONSTRAINT "urgent_event_steps_urgent_event_id_urgent_events_id_fk" FOREIGN KEY ("urgent_event_id") REFERENCES "public"."urgent_events"("id") ON DELETE cascade ON UPDATE no action;

