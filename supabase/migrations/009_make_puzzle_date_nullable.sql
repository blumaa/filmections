-- Make puzzle_date nullable to allow pending puzzles without assigned dates
-- The UNIQUE constraint will still prevent duplicate dates for published puzzles

-- Drop the NOT NULL constraint
ALTER TABLE puzzles ALTER COLUMN puzzle_date DROP NOT NULL;

-- Update constraint to ensure published puzzles have a date
ALTER TABLE puzzles ADD CONSTRAINT check_published_has_date 
  CHECK (status != 'published' OR puzzle_date IS NOT NULL);

COMMENT ON CONSTRAINT check_published_has_date ON puzzles IS 
  'Ensures published puzzles have an assigned date';
