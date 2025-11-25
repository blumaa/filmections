-- Admin Tables Migration
-- Admin user tracking and generator configuration presets

-- Create admin_users table
CREATE TABLE admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT NOT NULL UNIQUE
);

-- Create generator_configs table
CREATE TABLE generator_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Config data
  name TEXT NOT NULL,
  config JSONB NOT NULL,

  -- Metadata
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Constraints
  CONSTRAINT generator_configs_name_length CHECK (length(name) >= 1 AND length(name) <= 100)
);

-- Create indexes
CREATE INDEX idx_generator_configs_created_by ON generator_configs(created_by);
CREATE INDEX idx_generator_configs_name ON generator_configs(name);

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE generator_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_users

-- Anyone can check if a user is an admin (needed for client-side checks)
CREATE POLICY "Anyone can read admin_users"
  ON admin_users FOR SELECT
  USING (true);

-- Only authenticated users can be added as admins (managed via app)
CREATE POLICY "Authenticated users can insert admin_users"
  ON admin_users FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for generator_configs

-- Authenticated users can read all configs
CREATE POLICY "Authenticated users can read configs"
  ON generator_configs FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own configs
CREATE POLICY "Users can insert own configs"
  ON generator_configs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Users can update their own configs
CREATE POLICY "Users can update own configs"
  ON generator_configs FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Users can delete their own configs
CREATE POLICY "Users can delete own configs"
  ON generator_configs FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = user_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's saved configs
CREATE OR REPLACE FUNCTION get_user_configs(user_id_param UUID)
RETURNS SETOF generator_configs AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM generator_configs
  WHERE created_by = user_id_param
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create default preset configs
INSERT INTO generator_configs (name, config, created_by) VALUES
  (
    'Balanced Mix',
    '{"moviePoolSize":150,"qualityThreshold":35,"enabledAnalyzers":["director","actor","theme","wordplay","decade","year"],"poolFilters":{"minYear":1970,"maxYear":2024,"minVoteCount":1000}}'::jsonb,
    (SELECT id FROM auth.users LIMIT 1) -- Will be replaced with actual admin user
  ),
  (
    'Easy Mode',
    '{"moviePoolSize":150,"qualityThreshold":30,"enabledAnalyzers":["director","actor","decade"],"poolFilters":{"minYear":1980,"maxYear":2024,"minVoteCount":5000}}'::jsonb,
    (SELECT id FROM auth.users LIMIT 1)
  ),
  (
    'Hard Mode',
    '{"moviePoolSize":200,"qualityThreshold":40,"enabledAnalyzers":["theme","wordplay","year"],"poolFilters":{"minYear":1960,"maxYear":2024,"minVoteCount":500}}'::jsonb,
    (SELECT id FROM auth.users LIMIT 1)
  );

-- Comments
COMMENT ON TABLE admin_users IS 'Tracks which users have admin privileges';
COMMENT ON TABLE generator_configs IS 'Saved preset configurations for puzzle generation';
COMMENT ON COLUMN generator_configs.config IS 'Full PuzzleGenerator configuration as JSON';
