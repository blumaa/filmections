-- Clear Date on Unpublish
--
-- When a puzzle is unpublished, clear its puzzle_date to free up that date
-- for another puzzle. This keeps the unique constraint simple and correct.

CREATE OR REPLACE FUNCTION clear_date_on_unpublish()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changed from 'published' to something else, clear the date
  IF OLD.status = 'published' AND NEW.status != 'published' THEN
    NEW.puzzle_date = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clear_date_on_unpublish
  BEFORE UPDATE ON puzzles
  FOR EACH ROW
  EXECUTE FUNCTION clear_date_on_unpublish();

COMMENT ON FUNCTION clear_date_on_unpublish() IS
  'Clears puzzle_date when a puzzle is unpublished, freeing the date for another puzzle.';
