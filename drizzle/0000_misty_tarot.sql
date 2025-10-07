CREATE TABLE "characters" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"gender" text NOT NULL,
	"race" text NOT NULL,
	"backstory" text NOT NULL,
	"patron_deity" text NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"xp" jsonb NOT NULL,
	"stats" jsonb NOT NULL,
	"attributes" jsonb NOT NULL,
	"skills" jsonb NOT NULL,
	"points" jsonb NOT NULL,
	"location" text NOT NULL,
	"status" text NOT NULL,
	"inventory" jsonb NOT NULL,
	"equipped_items" jsonb NOT NULL,
	"factions" jsonb NOT NULL,
	"combat" jsonb,
	"sleep_until" bigint,
	"respawn_at" bigint,
	"death_occurred_at" bigint,
	"active_sovngarde_quest" jsonb,
	"active_crypt_quest" jsonb,
	"current_action" jsonb,
	"created_at" bigint NOT NULL,
	"last_updated_at" bigint NOT NULL,
	"deaths" integer DEFAULT 0 NOT NULL,
	"effects" jsonb NOT NULL,
	"known_spells" jsonb,
	"intervention_power" jsonb NOT NULL,
	"divine_suggestion" text,
	"divine_destination_id" text,
	"divine_favor" integer DEFAULT 0 NOT NULL,
	"temple_progress" integer DEFAULT 0 NOT NULL,
	"temple_completed_for" text,
	"relationships" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"pending_travel" jsonb,
	"completed_quests" jsonb NOT NULL,
	"season" text NOT NULL,
	"weather" text NOT NULL,
	"action_cooldowns" jsonb NOT NULL,
	"visited_locations" jsonb NOT NULL,
	"game_date" bigint NOT NULL,
	"mood" real DEFAULT 50 NOT NULL,
	"unlocked_perks" jsonb,
	"preferences" jsonb,
	"analytics" jsonb NOT NULL,
	"action_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_processed_at" bigint,
	"next_tick_at" bigint,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chronicle" (
	"id" text PRIMARY KEY NOT NULL,
	"character_id" text NOT NULL,
	"timestamp" bigint NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"data" jsonb
);
--> statement-breakpoint
CREATE TABLE "game_enemies" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"health" integer NOT NULL,
	"damage" integer NOT NULL,
	"armor" integer DEFAULT 10 NOT NULL,
	"xp" integer NOT NULL,
	"level" integer DEFAULT 1,
	"min_level" integer,
	"is_unique" boolean DEFAULT false,
	"guaranteed_drop" jsonb,
	"applies_effect" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_items" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"weight" real NOT NULL,
	"type" text NOT NULL,
	"rarity" text,
	"equipment_slot" text,
	"damage" integer,
	"armor" integer,
	"effect" jsonb,
	"spell_id" text,
	"learning_effect" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_locations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"coord_x" real NOT NULL,
	"coord_y" real NOT NULL,
	"is_safe" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_npcs" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"location" text NOT NULL,
	"dialogue" jsonb NOT NULL,
	"inventory" jsonb,
	"is_companion" boolean DEFAULT false,
	"hire_cost" integer,
	"faction_id" text,
	"companion_details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offline_events" (
	"id" text PRIMARY KEY NOT NULL,
	"character_id" text NOT NULL,
	"timestamp" bigint NOT NULL,
	"type" text NOT NULL,
	"message" text NOT NULL,
	"data" jsonb,
	"is_read" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" bigint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_login" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chronicle" ADD CONSTRAINT "chronicle_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offline_events" ADD CONSTRAINT "offline_events_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;