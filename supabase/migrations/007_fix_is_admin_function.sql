-- Fix is_admin function to use admin_users table (not user_roles)
CREATE OR REPLACE FUNCTION is_admin(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = user_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_admin(UUID) IS 'Checks if a user has admin privileges via admin_users table';
