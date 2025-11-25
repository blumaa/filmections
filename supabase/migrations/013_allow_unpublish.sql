-- Allow Unpublishing Puzzles
--
-- Removes the restriction that prevented editing published puzzles.
-- Admins should be able to unpublish a puzzle if needed (e.g., errors, accidents).

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS check_published_puzzle_edit ON puzzles;
DROP FUNCTION IF EXISTS prevent_published_puzzle_edit();

-- No replacement - admins can now freely edit/unpublish puzzles
COMMENT ON TABLE puzzles IS 'Puzzles can be published, unpublished, and edited by admins at any time.';
