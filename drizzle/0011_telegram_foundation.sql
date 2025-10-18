-- Telegram integration foundational tables
CREATE TABLE IF NOT EXISTS telegram_link_tokens (
  token text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at bigint NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS telegram_subscriptions (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chat_id text NOT NULL,
  mode text NOT NULL DEFAULT 'daily',
  locale text NOT NULL DEFAULT 'ru',
  last_sent_at bigint,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp DEFAULT now() NOT NULL
);

