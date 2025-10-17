-- Create shouts and character_shouts tables
CREATE TABLE IF NOT EXISTS "shouts" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "description" text NOT NULL,
  "icon" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "character_shouts" (
  "id" text PRIMARY KEY,
  "character_id" text NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
  "shout_id" text NOT NULL REFERENCES "shouts"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Seed base shouts
INSERT INTO "shouts" ("id","name","description","icon") VALUES
 ('unrelenting_force','Безжалостная сила','Fus • Ro • Dah — мощная волна, отбрасывающая врагов.','Wind')
 ,('fire_breath','Огненное дыхание','Yol • Toor • Shul — дыхание дракона испепеляет всё на пути.','Flame')
 ,('become_ethereal','Стать эфемерным','Feim • Zii • Gron — на мгновение становитесь невосприимчивы к урону.','Sparkles')
ON CONFLICT ("id") DO NOTHING;

