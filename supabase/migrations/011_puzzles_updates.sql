-- Puzzles Table Updates Migration
-- Refactors puzzles to reference connection_groups instead of storing inline data

-- First, truncate existing puzzles and dependent tables (fresh start, no backward compatibility)
-- CASCADE will also truncate gameplay table which references puzzles
TRUNCATE TABLE puzzles CASCADE;

-- Add new columns
ALTER TABLE puzzles ADD COLUMN title TEXT;
ALTER TABLE puzzles ADD COLUMN group_ids UUID[] NOT NULL DEFAULT '{}';

-- Drop old inline data columns
ALTER TABLE puzzles DROP COLUMN films;
ALTER TABLE puzzles DROP COLUMN groups;
ALTER TABLE puzzles DROP COLUMN connection_types;

-- Add constraint to ensure puzzles have exactly 4 groups when published
ALTER TABLE puzzles ADD CONSTRAINT check_published_has_groups
  CHECK (status != 'published' OR array_length(group_ids, 1) = 4);

-- Create index on group_ids for faster lookups
CREATE INDEX idx_puzzles_group_ids ON puzzles USING GIN(group_ids);

-- Update the get_daily_puzzle function to return puzzle with groups
-- Note: The actual group fetching will be done in the application layer
-- since we need to join with connection_groups table

-- Comments
COMMENT ON COLUMN puzzles.title IS 'Optional title for the puzzle';
COMMENT ON COLUMN puzzles.group_ids IS 'Array of 4 connection_group UUIDs that make up this puzzle';
