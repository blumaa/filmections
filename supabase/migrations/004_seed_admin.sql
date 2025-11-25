-- Seed Admin User and Default Presets
-- Run this AFTER creating your user via Supabase Auth

-- Add yourself as admin (replace with your actual user_id)
INSERT INTO admin_users (user_id, email) VALUES ('088b13ee-ee54-4f32-b6c1-849cad3c5c6c', 'blumaa@gmail.com');

-- Verify admin was added
SELECT * FROM admin_users;

-- Add default generator presets
INSERT INTO generator_configs (name, config, created_by) VALUES ('Balanced Mix', '{"moviePoolSize":150,"qualityThreshold":35,"enabledAnalyzers":["director","actor","theme","wordplay","decade","year"],"poolFilters":{"minYear":1970,"maxYear":2024,"minVoteCount":1000}}'::jsonb, '088b13ee-ee54-4f32-b6c1-849cad3c5c6c'), ('Easy Mode', '{"moviePoolSize":150,"qualityThreshold":30,"enabledAnalyzers":["director","actor","decade"],"poolFilters":{"minYear":1980,"maxYear":2024,"minVoteCount":5000}}'::jsonb, '088b13ee-ee54-4f32-b6c1-849cad3c5c6c'), ('Hard Mode', '{"moviePoolSize":200,"qualityThreshold":40,"enabledAnalyzers":["theme","wordplay","year"],"poolFilters":{"minYear":1960,"maxYear":2024,"minVoteCount":500}}'::jsonb, '088b13ee-ee54-4f32-b6c1-849cad3c5c6c');

-- Verify presets were added
SELECT name, created_at FROM generator_configs ORDER BY created_at;
