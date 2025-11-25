-- Puzzle Group Snapshot
--
-- Store group data directly in puzzles for self-contained gameplay.
-- This allows anonymous users to play without joining connection_groups.
--
-- Architecture:
-- - group_ids: References to source groups (for admin tracking)
-- - groups: Snapshot of group data at publish time (for gameplay)

-- Drop existing trigger first (if exists from previous run)
DROP TRIGGER IF EXISTS check_published_puzzle_edit ON puzzles;
DROP FUNCTION IF EXISTS prevent_published_puzzle_edit();

-- Add groups snapshot column
ALTER TABLE puzzles
ADD COLUMN IF NOT EXISTS groups JSONB;

-- Add comment
COMMENT ON COLUMN puzzles.groups IS 'Snapshot of group data at publish time. Self-contained for gameplay without joins.';

-- Backfill existing published puzzles with group snapshots
UPDATE puzzles p
SET groups = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', cg.id,
      'films', cg.films,
      'connection', cg.connection,
      'difficulty', COALESCE(cg.difficulty, 'medium'),
      'color', COALESCE(cg.color, 'green')
    )
    ORDER BY array_position(p.group_ids, cg.id)
  )
  FROM connection_groups cg
  WHERE cg.id = ANY(p.group_ids)
)
WHERE p.status = 'published' AND p.groups IS NULL;

-- Prevent editing published puzzles after their scheduled date
-- Exception: Allow setting groups snapshot (for backfill/migration purposes)
CREATE OR REPLACE FUNCTION prevent_published_puzzle_edit()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check on UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- If puzzle was published and has a puzzle_date in the past
    IF OLD.status = 'published'
       AND OLD.puzzle_date IS NOT NULL
       AND OLD.puzzle_date <= CURRENT_DATE THEN
      -- Allow only if the change is just adding/updating the groups snapshot
      IF OLD.status = NEW.status
         AND OLD.puzzle_date = NEW.puzzle_date
         AND OLD.group_ids = NEW.group_ids
         AND OLD.title IS NOT DISTINCT FROM NEW.title
         AND OLD.quality_score = NEW.quality_score THEN
        -- This is just a groups snapshot update, allow it
        RETURN NEW;
      END IF;
      RAISE EXCEPTION 'Cannot edit published puzzle after its scheduled date';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS check_published_puzzle_edit ON puzzles;
CREATE TRIGGER check_published_puzzle_edit
  BEFORE UPDATE ON puzzles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_published_puzzle_edit();

COMMENT ON FUNCTION prevent_published_puzzle_edit() IS
  'Prevents editing puzzles that are published and past their scheduled date. Allows groups snapshot updates.';
