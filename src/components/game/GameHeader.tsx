import { Box, Heading, Text, Button } from "@mond-design-system/theme";
import { formatPuzzleHeader } from "../../utils/date";
import { MistakesIndicator } from "./MistakesIndicator";
import { CountdownTimer } from "./CountdownTimer";
import "./GameHeader.css";

interface GameHeaderProps {
  mistakes: number;
  maxMistakes: number;
  gameStatus: "playing" | "won" | "lost";
  puzzleDate?: string; // YYYY-MM-DD format
  onViewStats?: () => void;
}

export function GameHeader({
  mistakes,
  maxMistakes,
  gameStatus,
  puzzleDate,
  onViewStats,
}: GameHeaderProps) {
  return (
    <Box display="flex" flexDirection="column" gap="xs">
      <Heading level={1} size="lg" align="center">
        {puzzleDate ? formatPuzzleHeader(puzzleDate) : "Filmections"}
      </Heading>

      {gameStatus === "playing" ? (
        <>
          <Text variant="body-xs" align="center">
            Create four groups of four!
          </Text>
          <MistakesIndicator mistakes={mistakes} maxMistakes={maxMistakes} />
        </>
      ) : (
        <>
          <CountdownTimer />
          {onViewStats && (
            <Box display="flex" justifyContent="center">
              <Button variant="outline" size="sm" onClick={onViewStats}>
                View Stats
              </Button>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
