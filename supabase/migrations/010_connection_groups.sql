-- Connection Groups Table Migration
-- Stores individual connection groups that can be combined into puzzles

-- Create group_status enum
CREATE TYPE group_status AS ENUM ('pending', 'approved', 'rejected');

-- Create connection_groups table
CREATE TABLE connection_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Group data
  films JSONB NOT NULL,
  connection TEXT NOT NULL,
  connection_type TEXT NOT NULL,

  -- Difficulty
  difficulty_score DECIMAL(10,2) NOT NULL,
  color TEXT CHECK (color IN ('yellow', 'green', 'blue', 'purple')),
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard', 'hardest')),

  -- Status & tracking
  status group_status NOT NULL DEFAULT 'pending',
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,

  -- Ensure unique connections
  CONSTRAINT unique_connection UNIQUE (connection)
);

-- Create indexes
CREATE INDEX idx_groups_status ON connection_groups(status);
CREATE INDEX idx_groups_color ON connection_groups(color);
CREATE INDEX idx_groups_connection_type ON connection_groups(connection_type);
CREATE INDEX idx_groups_difficulty_score ON connection_groups(difficulty_score);

-- Enable Row Level Security
ALTER TABLE connection_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Authenticated users can read all groups (for admin UI)
CREATE POLICY "Authenticated users can read groups"
  ON connection_groups FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert groups
CREATE POLICY "Authenticated users can insert groups"
  ON connection_groups FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update groups
CREATE POLICY "Authenticated users can update groups"
  ON connection_groups FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete groups
CREATE POLICY "Authenticated users can delete groups"
  ON connection_groups FOR DELETE
  TO authenticated
  USING (true);

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_group_usage(group_ids UUID[])
RETURNS void AS $$
BEGIN
  UPDATE connection_groups
  SET
    usage_count = usage_count + 1,
    last_used_at = NOW()
  WHERE id = ANY(group_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE connection_groups IS 'Stores individual connection groups that can be combined into puzzles';
COMMENT ON COLUMN connection_groups.films IS 'Array of 4 films in JSON format';
COMMENT ON COLUMN connection_groups.connection IS 'The connection text that ties the films together';
COMMENT ON COLUMN connection_groups.connection_type IS 'Type of connection (director, actor, decade, year, etc.)';
COMMENT ON COLUMN connection_groups.difficulty_score IS 'Numeric difficulty score based on film obscurity';
COMMENT ON COLUMN connection_groups.color IS 'Difficulty color (yellow=easy, green=medium, blue=hard, purple=hardest)';
COMMENT ON COLUMN connection_groups.difficulty IS 'Difficulty level derived from color';
COMMENT ON COLUMN connection_groups.usage_count IS 'Number of puzzles using this group';
COMMENT ON COLUMN connection_groups.last_used_at IS 'Timestamp of last puzzle using this group';
