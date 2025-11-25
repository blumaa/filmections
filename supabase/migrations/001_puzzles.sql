-- Puzzles Table Migration
-- Stores all generated/approved puzzles with date assignment

-- Create puzzle_status enum
CREATE TYPE puzzle_status AS ENUM ('pending', 'approved', 'published', 'rejected');

-- Create puzzles table
CREATE TABLE puzzles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Puzzle data
  puzzle_date DATE NOT NULL UNIQUE,
  films JSONB NOT NULL,
  groups JSONB NOT NULL,

  -- Status and quality
  status puzzle_status NOT NULL DEFAULT 'pending',
  quality_score DECIMAL(5,2) NOT NULL CHECK (quality_score >= 0 AND quality_score <= 100),
  connection_types TEXT[] NOT NULL,

  -- Additional metadata
  metadata JSONB,

  -- Indexes
  CONSTRAINT puzzles_date_check CHECK (puzzle_date >= '2020-01-01')
);

-- Create indexes
CREATE INDEX idx_puzzles_date ON puzzles(puzzle_date);
CREATE INDEX idx_puzzles_status ON puzzles(status);
CREATE INDEX idx_puzzles_quality_score ON puzzles(quality_score);
CREATE INDEX idx_puzzles_connection_types ON puzzles USING GIN(connection_types);

-- Enable Row Level Security
ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Public can read published puzzles
CREATE POLICY "Anyone can read published puzzles"
  ON puzzles FOR SELECT
  USING (status = 'published');

-- Admins can do everything (we'll check admin status in application)
-- For now, allow authenticated users to manage puzzles (admin check in app layer)
CREATE POLICY "Authenticated users can insert puzzles"
  ON puzzles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update puzzles"
  ON puzzles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete puzzles"
  ON puzzles FOR DELETE
  TO authenticated
  USING (true);

-- Function to get today's puzzle
CREATE OR REPLACE FUNCTION get_daily_puzzle(puzzle_date_param DATE DEFAULT CURRENT_DATE)
RETURNS SETOF puzzles AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM puzzles
  WHERE puzzle_date = puzzle_date_param
    AND status = 'published'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get next available puzzle date
CREATE OR REPLACE FUNCTION get_next_available_date()
RETURNS DATE AS $$
DECLARE
  next_date DATE;
BEGIN
  SELECT MAX(puzzle_date) + INTERVAL '1 day' INTO next_date
  FROM puzzles;

  IF next_date IS NULL OR next_date < CURRENT_DATE THEN
    RETURN CURRENT_DATE;
  ELSE
    RETURN next_date;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE puzzles IS 'Stores all generated/approved puzzles with date assignment';
COMMENT ON COLUMN puzzles.films IS 'Array of 16 films in JSON format';
COMMENT ON COLUMN puzzles.groups IS 'Array of 4 groups with connections in JSON format';
COMMENT ON COLUMN puzzles.quality_score IS 'Quality score from 0-100';
COMMENT ON COLUMN puzzles.connection_types IS 'Array of connection types (director, actor, theme, etc.)';
