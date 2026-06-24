CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'idea_status') THEN
    CREATE TYPE idea_status AS ENUM (
      'pending_review',
      'reviewed',
      'approved',
      'flagged',
      'discarded'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner text NOT NULL DEFAULT 'SEIGHA',
  submitted_by text NOT NULL,
  status idea_status NOT NULL DEFAULT 'pending_review',
  title text NOT NULL,
  concept text NOT NULL,
  storyboard_beats jsonb NOT NULL DEFAULT '[]'::jsonb,
  psychology text NOT NULL DEFAULT '',
  why_it_could_perform text NOT NULL DEFAULT '',
  caption text NOT NULL DEFAULT '',
  on_screen_text jsonb NOT NULL DEFAULT '[]'::jsonb,
  risks jsonb NOT NULL DEFAULT '[]'::jsonb,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  reviewed_by text,
  reviewed_at timestamptz,
  approved_by text,
  approved_at timestamptz,
  idempotency_key text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ideas_owner_known CHECK (owner IN ('SEIGHA'))
);

CREATE TABLE IF NOT EXISTS idea_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  action text NOT NULL,
  actor_type text NOT NULL,
  actor_name text NOT NULL,
  from_status idea_status,
  to_status idea_status,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ideas_status_created_at_idx ON ideas (status, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS ideas_owner_created_at_idx ON ideas (owner, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idea_events_idea_id_created_at_idx ON idea_events (idea_id, created_at DESC);

CREATE OR REPLACE FUNCTION set_ideas_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ideas_set_updated_at ON ideas;
CREATE TRIGGER ideas_set_updated_at
BEFORE UPDATE ON ideas
FOR EACH ROW
EXECUTE FUNCTION set_ideas_updated_at();
