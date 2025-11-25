import { useEffect, useState } from "react";
import { Box, Spinner, Text } from "@mond-design-system/theme";
import { useGameStore } from "../store/gameStore";
import { GameBoard } from "../components/game/GameBoard";
import { ResultsModal } from "../components/game/ResultsModal";
import { useStorage } from "../providers/useStorage";
import { useStats } from "../providers/useStats";
import { useDailyPuzzle } from "../lib/supabase/storage";
import { getTodayDate } from "../utils/date";
import type { GameResult } from "../types";

export function HomePage() {
  const { gameStatus, groups, mistakes, initializeGame, restoreCompletedGame } = useGameStore();
  const [resultsDismissed, setResultsDismissed] = useState(false);
  const [recordedDate, setRecordedDate] = useState<string | null>(null);
  const [alreadyPlayedToday, setAlreadyPlayedToday] = useState<GameResult | null>(null);
  const [statsLoaded, setStatsLoaded] = useState(false);

  // Get storage and load today's puzzle
  const storage = useStorage();
  const stats = useStats();
  const today = getTodayDate();
  const { data: puzzle, isLoading, error } = useDailyPuzzle(today, storage);

  // Check if user has already played today
  useEffect(() => {
    stats.getStats().then((userStats) => {
      const todaysGame = userStats.gameHistory.find((game) => game.date === today);
      if (todaysGame) {
        setAlreadyPlayedToday(todaysGame);
      }
      setStatsLoaded(true);
    }).catch(() => {
      setStatsLoaded(true);
    });
  }, [stats, today]);

  // Initialize game when puzzle loads (only if not already played)
  useEffect(() => {
    if (puzzle && statsLoaded && !alreadyPlayedToday) {
      initializeGame(puzzle.films, puzzle.groups, today);
    } else if (puzzle && statsLoaded && alreadyPlayedToday) {
      // Restore completed game state for display
      restoreCompletedGame(puzzle.groups, alreadyPlayedToday.won, alreadyPlayedToday.mistakes);
    }
  }, [puzzle, statsLoaded, alreadyPlayedToday, initializeGame, restoreCompletedGame, today]);

  // Record game completion when game ends
  useEffect(() => {
    const isGameOver = gameStatus === 'won' || gameStatus === 'lost';
    const notYetRecorded = recordedDate !== today;

    if (isGameOver && notYetRecorded) {
      const result: GameResult = {
        date: today,
        won: gameStatus === 'won',
        mistakes,
        completedAt: Date.now(),
      };

      stats.recordCompletion(result).then(() => {
        setRecordedDate(today);
      }).catch((error) => {
        console.error('Failed to record game completion:', error);
      });
    }
  }, [gameStatus, recordedDate, today, mistakes, stats]);

  // Derive modal visibility from game status and dismissal state
  const showResults = (gameStatus === 'won' || gameStatus === 'lost') && !resultsDismissed;

  const handleCloseResults = () => {
    setResultsDismissed(true);
  };

  if (isLoading || !statsLoaded) {
    return (
      <div className="app-container">
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap="lg"
        >
          <Spinner size="lg" />
          <Text variant="body">Loading today&apos;s puzzle...</Text>
        </Box>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap="lg"
        >
          <Text variant="body">Failed to load puzzle</Text>
          <Text variant="caption">{error.message}</Text>
        </Box>
      </div>
    );
  }

  if (!puzzle || !groups.length) {
    return (
      <div className="app-container">
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap="lg"
        >
          <Text variant="body">No puzzle available for today</Text>
          <Text variant="caption">Check back soon!</Text>
        </Box>
      </div>
    );
  }

  return (
    <div className="app-container">
      <GameBoard />
      <ResultsModal
        isOpen={showResults}
        onClose={handleCloseResults}
        gameStatus={gameStatus === 'playing' ? 'won' : gameStatus}
        groups={groups}
        mistakes={mistakes}
      />
    </div>
  );
}
