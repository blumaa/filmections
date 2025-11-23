import { useState } from "react";
import { Box, Heading, Text, Button } from "@mond-design-system/theme";
import "./GameHeader.css";

interface GameHeaderProps {
  mistakes: number;
  maxMistakes: number;
  gameStatus: "playing" | "won" | "lost";
  testMode: boolean;
  onNewGame: () => void;
  onToggleTestMode: () => void;
}

export function GameHeader({
  mistakes,
  maxMistakes,
  gameStatus,
  testMode,
  onNewGame,
  onToggleTestMode,
}: GameHeaderProps) {
  // @ts-ignore - Will be used for future feature
  const [isTestmode, setIsTestmode] = useState(true);
  const remainingMistakes = maxMistakes - mistakes;

  return (
    <Box display="flex" flexDirection="column" gap="md">
      <div className="game-header-title">
        <Heading level={1} size="2xl">
          Filmections
        </Heading>
      </div>
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
        {gameStatus === "playing" ? (
          <>
            {/* <Badge variant="primary"> */}
            {/*   Found: {foundGroupsCount}/{totalGroups} */}
            {/* </Badge> */}
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
            {isTestmode && (
              <Button
                variant={testMode ? "primary" : "outline"}
                onClick={onToggleTestMode}
                size="sm"
              >
                {testMode ? "Test Mode: ON" : "Test Mode: OFF"}
              </Button>
            )}
          </>
        ) : (
          <Button variant="primary" onClick={onNewGame} size="lg">
            New Game
          </Button>
        )}
      </Box>
    </Box>
  );
}
