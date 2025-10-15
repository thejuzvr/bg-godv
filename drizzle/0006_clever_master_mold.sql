CREATE TABLE "character_state_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"realm_id" text DEFAULT 'global' NOT NULL,
	"character_id" text NOT NULL,
	"as_of_tick" bigint NOT NULL,
	"summary" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "realms" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "realm_id" text DEFAULT 'global' NOT NULL;--> statement-breakpoint
ALTER TABLE "chronicle" ADD COLUMN "realm_id" text DEFAULT 'global' NOT NULL;--> statement-breakpoint
ALTER TABLE "combat_analytics" ADD COLUMN "realm_id" text DEFAULT 'global' NOT NULL;--> statement-breakpoint
ALTER TABLE "offline_events" ADD COLUMN "realm_id" text DEFAULT 'global' NOT NULL;--> statement-breakpoint
ALTER TABLE "character_state_snapshots" ADD CONSTRAINT "character_state_snapshots_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;