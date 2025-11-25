import { Box, Text } from "@mond-design-system/theme";
import "./StreakDisplay.css";

interface StreakDisplayProps {
  currentStreak: number;
}

export function StreakDisplay({ currentStreak }: StreakDisplayProps) {
  if (currentStreak === 0) {
    return null; // Don't show streak if user hasn't played
  }

  return (
    <Box
      display="flex"
      alignItems="center"
      gap="xs"
      className="streak-display"
    >
      <span className="streak-emoji" role="img" aria-label="fire">
        🔥
      </span>
      <Text variant="body" weight="semibold">
        {currentStreak}
      </Text>
    </Box>
  );
}
