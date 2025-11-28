import { useEffect, useState } from "react";
import { Modal } from "@mond-design-system/theme/client";
import { Box, Heading, Text, Button } from "@mond-design-system/theme";
import { useStats } from "../../providers/useStats";
import { Stats } from "./Stats";
import { CountdownTimer } from "./CountdownTimer";
import { trackEvent, EVENTS } from "../../services/analytics";
import type { UserStats } from "../../types";

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameStatus: "won" | "lost";
  mistakes: number;
}

export function ResultsModal({
  isOpen,
  onClose,
  gameStatus,
  mistakes,
}: ResultsModalProps) {
  const stats = useStats();
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  // Load stats when modal opens
  useEffect(() => {
    if (isOpen) {
      stats
        .getStats()
        .then((loadedStats) => {
          setUserStats(loadedStats);
          trackEvent(EVENTS.STATS_VIEWED, {
            gamesPlayed: loadedStats.gamesPlayed,
            currentStreak: loadedStats.currentStreak,
            maxStreak: loadedStats.maxStreak,
          });
        })
        .catch((error) => {
          console.error("Failed to load stats:", error);
        });

      const timer = setTimeout(() => {
        stats
          .getStats()
          .then(setUserStats)
          .catch((error) => {
            console.error("Failed to reload stats:", error);
          });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isOpen, stats]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Box display="flex" flexDirection="column" gap="xxs" paddingTop="2">
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
        >
          <Heading level={2} size="xl">
            {gameStatus === "won" ? "You Won!" : "Game Over"}
          </Heading>
        </Box>

        <Box display="flex" flexDirection="column" alignItems="center">
          <Text>
            {gameStatus === "won"
              ? `You found all connections with ${mistakes} mistake${mistakes !== 1 ? "s" : ""}.`
              : "Better luck next time!"}
          </Text>
        </Box>

        {userStats && <Stats stats={userStats} />}

        <CountdownTimer />

        {/* <Divider /> */}
        <Box display="flex" justifyContent="center" padding="2" border="subtle">
          <Button variant="primary" onClick={onClose} size="lg">
            Back to Game
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
