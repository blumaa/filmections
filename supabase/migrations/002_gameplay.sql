-- Gameplay Tracking Migration
-- Tracks user stats and individual gameplay sessions

-- Create user_stats table
CREATE TABLE user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Stats
  games_played INTEGER NOT NULL DEFAULT 0 CHECK (games_played >= 0),
  games_won INTEGER NOT NULL DEFAULT 0 CHECK (games_won >= 0),
  current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  max_streak INTEGER NOT NULL DEFAULT 0 CHECK (max_streak >= 0),
  last_played_date DATE,

  -- Constraints
  CONSTRAINT games_won_lte_games_played CHECK (games_won <= games_played),
  CONSTRAINT max_streak_gte_current_streak CHECK (max_streak >= current_streak)
);

-- Create gameplay table
CREATE TABLE gameplay (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- References
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  puzzle_id UUID NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
  puzzle_date DATE NOT NULL,

  -- Game results
  completed BOOLEAN NOT NULL DEFAULT false,
  mistakes_made INTEGER NOT NULL DEFAULT 0 CHECK (mistakes_made >= 0),
  time_taken_seconds INTEGER CHECK (time_taken_seconds >= 0),
  groups_solved INTEGER NOT NULL DEFAULT 0 CHECK (groups_solved >= 0 AND groups_solved <= 4),

  -- Constraints
  CONSTRAINT gameplay_unique_user_puzzle UNIQUE(user_id, puzzle_date)
);

-- Create indexes
CREATE INDEX idx_user_stats_last_played ON user_stats(last_played_date);
CREATE INDEX idx_gameplay_user_id ON gameplay(user_id);
CREATE INDEX idx_gameplay_puzzle_id ON gameplay(puzzle_id);
CREATE INDEX idx_gameplay_puzzle_date ON gameplay(puzzle_date);
CREATE INDEX idx_gameplay_completed ON gameplay(completed);

-- Enable Row Level Security
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE gameplay ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_stats

-- Users can read their own stats
CREATE POLICY "Users can read own stats"
  ON user_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own stats
CREATE POLICY "Users can insert own stats"
  ON user_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own stats
CREATE POLICY "Users can update own stats"
  ON user_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for gameplay

-- Users can read their own gameplay records
CREATE POLICY "Users can read own gameplay"
  ON gameplay FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own gameplay records
CREATE POLICY "Users can insert own gameplay"
  ON gameplay FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own gameplay records
CREATE POLICY "Users can update own gameplay"
  ON gameplay FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update user stats after gameplay
CREATE OR REPLACE FUNCTION update_user_stats_after_gameplay()
RETURNS TRIGGER AS $$
DECLARE
  current_user_stats RECORD;
  days_since_last_play INTEGER;
BEGIN
  -- Get current stats
  SELECT * INTO current_user_stats
  FROM user_stats
  WHERE user_id = NEW.user_id;

  -- If no stats exist, create them
  IF current_user_stats IS NULL THEN
    INSERT INTO user_stats (user_id, games_played, games_won, current_streak, max_streak, last_played_date)
    VALUES (
      NEW.user_id,
      1,
      CASE WHEN NEW.completed THEN 1 ELSE 0 END,
      CASE WHEN NEW.completed THEN 1 ELSE 0 END,
      CASE WHEN NEW.completed THEN 1 ELSE 0 END,
      NEW.puzzle_date
    );
    RETURN NEW;
  END IF;

  -- Calculate streak
  IF current_user_stats.last_played_date IS NULL THEN
    days_since_last_play := 999;
  ELSE
    days_since_last_play := NEW.puzzle_date - current_user_stats.last_played_date;
  END IF;

  -- Update stats
  UPDATE user_stats
  SET
    games_played = games_played + 1,
    games_won = games_won + CASE WHEN NEW.completed THEN 1 ELSE 0 END,
    current_streak = CASE
      WHEN days_since_last_play = 1 THEN current_streak + 1
      WHEN days_since_last_play = 0 THEN current_streak -- Same day, don't change
      ELSE 1 -- Streak broken
    END,
    max_streak = GREATEST(
      max_streak,
      CASE
        WHEN days_since_last_play = 1 THEN current_streak + 1
        ELSE current_streak
      END
    ),
    last_played_date = NEW.puzzle_date
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update stats after gameplay insert
CREATE TRIGGER trigger_update_stats_after_gameplay
AFTER INSERT ON gameplay
FOR EACH ROW
EXECUTE FUNCTION update_user_stats_after_gameplay();

-- Function to check if user has played today
CREATE OR REPLACE FUNCTION has_played_today(user_id_param UUID, today DATE DEFAULT CURRENT_DATE)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM gameplay
    WHERE user_id = user_id_param
      AND puzzle_date = today
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Analytics query functions

-- Get completion rate by puzzle
CREATE OR REPLACE FUNCTION get_puzzle_completion_rate(puzzle_id_param UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_plays INTEGER;
  total_completions INTEGER;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE completed)
  INTO total_plays, total_completions
  FROM gameplay
  WHERE puzzle_id = puzzle_id_param;

  IF total_plays = 0 THEN
    RETURN 0;
  END IF;

  RETURN (total_completions::DECIMAL / total_plays) * 100;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE user_stats IS 'Tracks cumulative stats per user (games played, wins, streaks)';
COMMENT ON TABLE gameplay IS 'Records each individual game played';
COMMENT ON COLUMN user_stats.current_streak IS 'Current consecutive days played';
COMMENT ON COLUMN user_stats.max_streak IS 'Maximum consecutive days played (all time)';
COMMENT ON COLUMN gameplay.mistakes_made IS 'Number of incorrect guesses before solving';
COMMENT ON COLUMN gameplay.groups_solved IS 'Number of groups successfully identified (0-4)';
