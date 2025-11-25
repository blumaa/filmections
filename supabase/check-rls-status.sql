-- Check RLS Status for All Tables

SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('puzzles', 'user_stats', 'gameplay', 'admin_users', 'generator_configs')
ORDER BY tablename;

-- Check all policies for these tables
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('puzzles', 'user_stats', 'gameplay', 'admin_users', 'generator_configs')
ORDER BY tablename, policyname;
