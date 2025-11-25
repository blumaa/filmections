-- Fix Public Access to Published Puzzles
--
-- Issue: "Anyone can read published puzzles" has roles: {public}
-- But anon key users are in the {authenticated} role, not {public}!
--
-- Solution: Drop and recreate without role restriction, or make it apply to both roles

-- Drop the old public-only policy
DROP POLICY IF EXISTS "Anyone can read published puzzles" ON puzzles;

-- Create new policy that applies to ALL roles (both public and authenticated)
-- This allows both no-key requests AND anon-key requests to read published puzzles
CREATE POLICY "Anyone can read published puzzles"
  ON puzzles FOR SELECT
  USING (status = 'published');

-- The key difference: No "TO <role>" restriction means it applies to ALL roles

-- For generator_configs, we already have the correct policy (authenticated with auth.uid check)
-- No changes needed there

COMMENT ON POLICY "Anyone can read published puzzles" ON puzzles IS
  'Allows both public (no key) and anon key users to read published puzzles. The USING clause filters to published only, while logged-in users can use the other policy to see all statuses.';
