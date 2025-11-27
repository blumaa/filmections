# Supabase Setup

This directory contains SQL migrations for the Filmecules database schema.

## Quick Start

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details
4. Wait for project to be created

### 2. Get Credentials

From your Supabase project settings:

1. Go to **Settings** → **API**
2. Copy your **Project URL**
3. Copy your **anon/public** key
4. Add these to `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run Migrations

In your Supabase project dashboard:

1. Go to **SQL Editor**
2. Copy and paste each migration file in order:
   - `001_puzzles.sql`
   - `002_gameplay.sql`
   - `003_admin.sql`
3. Click "Run" for each migration

Or use the Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run all migrations
supabase db push
```

### 4. Create Admin User

After running migrations, add yourself as an admin:

1. Sign up through your app (creates auth user)
2. In Supabase SQL Editor, run:

```sql
INSERT INTO admin_users (user_id, email)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'your-email@example.com'),
  'your-email@example.com'
);
```

## Database Schema

### Tables

#### **puzzles**
Stores all generated/approved puzzles with date assignment
- `id` - UUID primary key
- `puzzle_date` - DATE (unique, the date this puzzle is for)
- `films` - JSONB (array of 16 films)
- `groups` - JSONB (array of 4 groups with connections)
- `status` - ENUM (pending, approved, published, rejected)
- `quality_score` - DECIMAL (0-100)
- `connection_types` - TEXT[] (array of analyzer types used)
- `metadata` - JSONB (optional additional data)

#### **user_stats**
Tracks cumulative stats per user
- `user_id` - UUID (references auth.users)
- `games_played` - INTEGER
- `games_won` - INTEGER
- `current_streak` - INTEGER (consecutive days played)
- `max_streak` - INTEGER (best streak all-time)
- `last_played_date` - DATE

#### **gameplay**
Records each individual game played
- `id` - UUID primary key
- `user_id` - UUID (references auth.users)
- `puzzle_id` - UUID (references puzzles)
- `puzzle_date` - DATE
- `completed` - BOOLEAN
- `mistakes_made` - INTEGER
- `time_taken_seconds` - INTEGER (nullable)
- `groups_solved` - INTEGER (0-4)

#### **admin_users**
Tracks which users have admin privileges
- `user_id` - UUID (references auth.users)
- `email` - TEXT

#### **generator_configs**
Saved preset configurations for puzzle generation
- `id` - UUID primary key
- `name` - TEXT
- `config` - JSONB (full PuzzleGenerator configuration)
- `created_by` - UUID (references auth.users)

### Functions

- `get_daily_puzzle(date)` - Returns published puzzle for given date
- `get_next_available_date()` - Returns next available puzzle date
- `has_played_today(user_id, date)` - Checks if user has played today
- `get_puzzle_completion_rate(puzzle_id)` - Returns completion % for puzzle
- `is_admin(user_id)` - Checks if user has admin role
- `get_user_configs(user_id)` - Returns user's saved generator configs

### Row Level Security (RLS)

All tables have RLS enabled:

- **Public access**: Can read published puzzles
- **Authenticated users**: Can manage their own stats/gameplay
- **Admins**: Full access to puzzles (checked in app layer)

## Testing

Test database connectivity:

```typescript
import { supabase } from './src/lib/supabase/client';

// Test connection
const { data, error } = await supabase
  .from('puzzles')
  .select('count')
  .limit(1);

console.log('Connected:', !error);
```

## Useful Queries

### Get today's puzzle
```sql
SELECT * FROM get_daily_puzzle(CURRENT_DATE);
```

### Get user stats
```sql
SELECT * FROM user_stats WHERE user_id = 'user-uuid-here';
```

### Analytics: Completion rates
```sql
SELECT
  p.puzzle_date,
  p.quality_score,
  get_puzzle_completion_rate(p.id) as completion_rate
FROM puzzles p
WHERE p.status = 'published'
ORDER BY p.puzzle_date DESC;
```

### Streak leaderboard
```sql
SELECT
  u.email,
  s.max_streak,
  s.current_streak
FROM user_stats s
JOIN auth.users u ON u.id = s.user_id
ORDER BY s.max_streak DESC
LIMIT 10;
```
