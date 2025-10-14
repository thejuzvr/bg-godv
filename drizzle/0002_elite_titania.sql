CREATE TABLE "combat_analytics" (
	"id" text PRIMARY KEY NOT NULL,
	"character_id" text NOT NULL,
	"timestamp" bigint NOT NULL,
	"enemy_id" text NOT NULL,
	"enemy_name" text NOT NULL,
	"enemy_level" integer NOT NULL,
	"victory" boolean NOT NULL,
	"fled" boolean DEFAULT false NOT NULL,
	"character_level" integer NOT NULL,
	"character_health_start" integer NOT NULL,
	"character_health_end" integer NOT NULL,
	"enemy_health_start" integer NOT NULL,
	"rounds_count" integer NOT NULL,
	"damage_dealt" integer NOT NULL,
	"damage_taken" integer NOT NULL,
	"xp_gained" integer DEFAULT 0 NOT NULL,
	"combat_log" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_thoughts" (
	"id" text PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"tags" jsonb,
	"conditions" jsonb,
	"weight" integer DEFAULT 1 NOT NULL,
	"cooldown_key" text,
	"locale" text DEFAULT 'ru' NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "npc_dialogue_lines" (
	"id" text PRIMARY KEY NOT NULL,
	"npc_id" text NOT NULL,
	"text" text NOT NULL,
	"tags" jsonb,
	"conditions" jsonb,
	"weight" integer DEFAULT 1 NOT NULL,
	"cooldown_key" text,
	"locale" text DEFAULT 'ru' NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "combat_analytics" ADD CONSTRAINT "combat_analytics_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "npc_dialogue_lines" ADD CONSTRAINT "npc_dialogue_lines_npc_id_game_npcs_id_fk" FOREIGN KEY ("npc_id") REFERENCES "public"."game_npcs"("id") ON DELETE cascade ON UPDATE no action;