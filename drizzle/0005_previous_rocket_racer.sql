ALTER TABLE "characters" ADD COLUMN "has_seen_welcome_message" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "last_location_arrival" bigint;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "has_completed_location_activity" boolean DEFAULT false NOT NULL;