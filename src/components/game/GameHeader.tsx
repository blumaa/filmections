import { Box, Heading, Text } from "@mond-design-system/theme";
import { formatPuzzleHeader } from "../../utils/date";
import { MistakesIndicator } from "./MistakesIndicator";
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
  return (
    <Box display="flex" flexDirection="column" gap="xs">
      <Heading level={1} size="lg" align="center">
        {puzzleDate ? formatPuzzleHeader(puzzleDate) : "Filmections"}
      </Heading>
      <Text variant="body-xs" align="center">
        Create four groups of four!
      </Text>
      {gameStatus === "playing" && (
        <MistakesIndicator mistakes={mistakes} maxMistakes={maxMistakes} />
      )}
    </Box>
  );
}
