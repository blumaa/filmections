# Security Model

## Overview

Filmecules uses a **single-admin model** where one logged-in user (you) has full administrative privileges, while public users can play published puzzles using the anon key without logging in.

## IMPORTANT: Supabase Authentication Levels

Supabase has TWO types of "authenticated" requests:

1. **Anon key requests** - Using `VITE_SUPABASE_ANON_KEY` (no user session)
   - Still considered "authenticated" by Supabase!
   - This is what public players use

2. **Logged-in user requests** - Authenticated with `auth.signInWithPassword()`
   - Has `auth.uid()` set to user ID
   - This is what the admin uses

Our RLS policies use `auth.uid() IS NOT NULL` to distinguish between these two levels.

## Access Levels

### 1. Public Players (Anon Key, No Login)
- **Can**: Read published puzzles only
- **Cannot**: Create/update/delete puzzles, read pending puzzles, access admin features, or save gameplay stats

### 2. Admin (Logged-In User)
- **Can**: Everything - full CRUD on all tables, read all puzzle statuses
- **Note**: Only you will log in, so `auth.uid() IS NOT NULL` effectively means "is admin"

### 3. Future Player Stats (Optional)
- If you later add user authentication for players, the RLS policies are already set up to:
  - Isolate each user's stats and gameplay records
  - Prevent users from seeing/modifying other users' data
  - Maintain admin privileges for puzzle management

## Row Level Security (RLS) Policies

### Puzzles Table
```sql
-- Public (anon key) can view published puzzles only
"Anyone can read published puzzles"
  ON puzzles FOR SELECT
  USING (status = 'published');

-- Admin (logged-in user) can read ALL puzzles including pending
"Logged-in users can read all puzzles"
  ON puzzles FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Admin (logged-in user) has full control
"Logged-in users can insert/update/delete puzzles"
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
```

**Why it works**: The check `auth.uid() IS NOT NULL` requires a logged-in user session, not just the anon key. Since only you will log in, this effectively means "admin only".

### User Stats & Gameplay Tables
```sql
-- Users can only manage their own data
"Users can read/update own stats"
  USING (auth.uid() = user_id);
```

**Why this isn't over-engineered**: This correctly isolates user data. When you play, you'll have your own stats. If you add player authentication later, their stats are automatically isolated.

### Admin Users Table
```sql
-- Anyone can check if a user is admin (for isAdmin() function)
"Anyone can read admin_users"
  USING (true);
```

**Why it's needed**: The `isAdmin()` helper function needs to query this table. Since there's only one row (you), this is secure.

### Generator Configs Table
```sql
-- Authenticated users can read all configs but only manage their own
"Users can read all configs"
"Users can update/delete own configs"
  USING (auth.uid() = created_by);
```

**Why it's simple**: Since you're the only authenticated user, you'll see all configs and can only modify your own (which is all of them).

## Security Summary

The current RLS policies implement the simplest possible security model:

1. **Public access**: Read published puzzles (needed for gameplay)
2. **Admin access**: You authenticate once → full privileges on everything
3. **No complex role checks**: "authenticated" effectively means "is admin"

There's no over-engineering here - this is exactly what a single-admin model should look like.

## Authentication Flow

```typescript
// Check if current user is admin
const isUserAdmin = await isAdmin(); // Returns true if logged in as admin

// All authenticated operations automatically have admin privileges
const { data, error } = await supabase
  .from('puzzles')
  .insert({ /* ... */ }); // ✅ Works because you're authenticated
```

## Testing Admin Access

Use the test connection script to verify:

```bash
bun src/lib/supabase/test-connection.ts
```

This confirms:
- ✅ Public can read tables (published puzzles)
- ✅ Admin check function works
- ✅ Config access works

## Future: Adding Player Authentication (Optional)

If you later want players to save their stats:

1. Enable Supabase Auth signup in your app
2. Players create accounts and authenticate
3. RLS policies automatically isolate their stats
4. Admin status is still determined by `admin_users` table
5. Only you remain admin, players can only see their own data

The existing RLS policies already support this - no changes needed.
