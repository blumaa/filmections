-- Fix RLS Policies for Single-Admin Model
--
-- Issue: Policies with "TO authenticated" apply to BOTH anon key and logged-in users
-- Fix: Require logged-in user (auth.uid() IS NOT NULL) for admin operations

-- Drop and recreate puzzles policies
DROP POLICY IF EXISTS "Authenticated users can insert puzzles" ON puzzles;
DROP POLICY IF EXISTS "Authenticated users can update puzzles" ON puzzles;
DROP POLICY IF EXISTS "Authenticated users can delete puzzles" ON puzzles;

-- Admin (logged-in user) can do everything with puzzles
CREATE POLICY "Logged-in users can insert puzzles"
  ON puzzles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Logged-in users can update puzzles"
  ON puzzles FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Logged-in users can delete puzzles"
  ON puzzles FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Also allow logged-in users to read ALL puzzles (including pending)
CREATE POLICY "Logged-in users can read all puzzles"
  ON puzzles FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Drop and recreate generator_configs policies
DROP POLICY IF EXISTS "Authenticated users can read configs" ON generator_configs;

-- Only logged-in users can read configs (not anon)
CREATE POLICY "Logged-in users can read configs"
  ON generator_configs FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Comments
COMMENT ON POLICY "Logged-in users can insert puzzles" ON puzzles IS
  'Requires logged-in user (admin), not just anon key';
COMMENT ON POLICY "Logged-in users can read configs" ON generator_configs IS
  'Requires logged-in user (admin), not just anon key';
