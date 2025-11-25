-- Store admin status in user metadata for instant access
-- This eliminates the need for slow RPC calls on every auth check

-- Function to sync admin status to user metadata
CREATE OR REPLACE FUNCTION sync_admin_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- When user is added to admin_users, update their metadata
  IF (TG_OP = 'INSERT') THEN
    UPDATE auth.users
    SET raw_app_meta_data = raw_app_meta_data || '{"is_admin": true}'::jsonb
    WHERE id = NEW.user_id;
    RETURN NEW;
  END IF;

  -- When user is removed from admin_users, update their metadata
  IF (TG_OP = 'DELETE') THEN
    UPDATE auth.users
    SET raw_app_meta_data = raw_app_meta_data || '{"is_admin": false}'::jsonb
    WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically sync admin status
DROP TRIGGER IF EXISTS on_admin_users_change ON admin_users;
CREATE TRIGGER on_admin_users_change
  AFTER INSERT OR DELETE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION sync_admin_metadata();

-- Update metadata for existing admin users
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"is_admin": true}'::jsonb
WHERE id IN (SELECT user_id FROM admin_users);

-- Update metadata for non-admin users
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"is_admin": false}'::jsonb
WHERE id NOT IN (SELECT user_id FROM admin_users)
  AND (raw_app_meta_data->>'is_admin') IS NULL;

COMMENT ON FUNCTION sync_admin_metadata() IS 'Automatically syncs admin status to user metadata for fast JWT-based checks';
