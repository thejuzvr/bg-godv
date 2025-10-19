-- AI Graph Tables
CREATE TABLE IF NOT EXISTS ai_graph_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  graph_json JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_graph_instances (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  template_id TEXT REFERENCES ai_graph_templates(id) ON DELETE SET NULL,
  version INTEGER NOT NULL DEFAULT 1,
  graph_json JSONB NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_graph_instances_character_id ON ai_graph_instances(character_id);
CREATE INDEX IF NOT EXISTS idx_ai_graph_instances_active ON ai_graph_instances(active);

