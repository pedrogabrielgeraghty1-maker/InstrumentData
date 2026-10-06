CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  user_name TEXT NOT NULL,
  instrument_name TEXT NOT NULL,
  part_number TEXT NOT NULL,
  serial_number TEXT NOT NULL UNIQUE,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_created_at
ON items (created_at DESC);
