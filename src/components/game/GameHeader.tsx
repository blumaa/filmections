import { useEffect, useState } from "react";
import { Box, Heading, Text } from "@mond-design-system/theme";
import { formatPuzzleHeader } from "../../utils/date";
import { useStats } from "../../providers/useStats";
import { StreakDisplay } from "./StreakDisplay";
import type { UserStats } from "../../types";
import "./GameHeader.css";

interface GameHeaderProps {
  mistakes: number;
  maxMistakes: number;
  gameStatus: "playing" | "won" | "lost";
  puzzleDate?: string; // YYYY-MM-DD format
}

export function GameHeader({
  mistakes,
  maxMistakes,
  gameStatus,
  puzzleDate,
}: GameHeaderProps) {
  const remainingMistakes = maxMistakes - mistakes;
  const stats = useStats();
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  // Load user stats for streak display
  useEffect(() => {
    stats.getStats().then(setUserStats).catch((error) => {
      console.error('Failed to load stats:', error);
    });
  }, [stats]);

  return (
    <Box display="flex" flexDirection="column" gap="md">
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        gap="md"
      >
        <div className="game-header-title">
          <Heading level={1} size="2xl">
            {puzzleDate ? formatPuzzleHeader(puzzleDate) : "Filmections"}
          </Heading>
        </div>
        {userStats && <StreakDisplay currentStreak={userStats.currentStreak} />}
      </Box>
      <div className="game-header-subtitle">
        <Text variant="body">Create four groups of four!</Text>
      </div>
      <Box
        display="flex"
        gap="md"
        justifyContent="center"
        padding="2"
        alignItems="center"
      >
        {gameStatus === "playing" && (
          <Box
            display="flex"
            flexDirection="column"
            gap="xs"
            alignItems="center"
          >
            <Text variant="caption" weight="medium">
              Mistakes remaining
            </Text>
            <div className="mistakes-dots">
              {Array.from({ length: maxMistakes }).map((_, index) => (
                <div
                  key={index}
                  className={`mistake-dot ${index < remainingMistakes ? "filled" : "empty"}`}
                />
              ))}
            </div>
          </Box>
        )}
      </Box>
    </Box>
  );
}
