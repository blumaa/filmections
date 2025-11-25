import { useEffect, useState } from "react";
import { Modal } from "@mond-design-system/theme/client";
import { Box, Heading, Text, Button } from "@mond-design-system/theme";
import { useStats } from "../../providers/useStats";
import { useGameStore } from "../../store/gameStore";
import { getPuzzleNumber } from "../../utils/date";
import type { Group, UserStats, DifficultyColor } from "../../types";
import "./ResultsModal.css";

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameStatus: "won" | "lost";
  groups: Group[];
  mistakes: number;
}

const COLOR_EMOJI_MAP: Record<DifficultyColor, string> = {
  yellow: "🟨",
  green: "🟩",
  blue: "🟦",
  purple: "🟪",
};

export function ResultsModal({
  isOpen,
  onClose,
  gameStatus,
  groups,
  mistakes,
}: ResultsModalProps) {
  const stats = useStats();
  const { puzzleDate, foundGroups } = useGameStore();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Load stats when modal opens
  useEffect(() => {
    if (isOpen) {
      // Initial load
      stats.getStats().then(setUserStats).catch((error) => {
        console.error('Failed to load stats:', error);
      });

      // Reload after a short delay to catch any recording that's in progress
      const timer = setTimeout(() => {
        stats.getStats().then(setUserStats).catch((error) => {
          console.error('Failed to reload stats:', error);
        });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isOpen, stats]);

  const generateShareText = (): string => {
    if (!puzzleDate) return "";

    const puzzleNumber = getPuzzleNumber(puzzleDate);
    const colorEmojis = foundGroups
      .map((group) => COLOR_EMOJI_MAP[group.color])
      .join("");

    if (gameStatus === "won") {
      return `Filmections #${puzzleNumber}: ${mistakes}/4 ${colorEmojis}`;
    } else {
      return `Filmections #${puzzleNumber}: X/4 ${colorEmojis}`;
    }
  };

  const handleCopyShareText = async () => {
    const shareText = generateShareText();
    try {
      await navigator.clipboard.writeText(shareText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleClose = () => {
    setCopySuccess(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <Box display="flex" flexDirection="column">
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          paddingBottom="2"
        >
          <Heading level={2} size="xl">
            {gameStatus === "won" ? "🎉 You Won!" : "😔 Game Over"}
          </Heading>
        </Box>

        <div className="results-message">
          <Text variant="body">
            {gameStatus === "won"
              ? `Congratulations! You found all groups with ${mistakes} mistake${mistakes !== 1 ? "s" : ""}.`
              : "Better luck next time! Here were the groups:"}
          </Text>
        </div>

        {puzzleDate && (
          <Box
            display="flex"
            flexDirection="column"
            gap="sm"
            padding="3"
            corners="rounded-md"
            className="share-section"
          >
            <Heading level={3} size="md">
              Share Your Result
            </Heading>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              gap="md"
            >
              <div className="share-text">
                <Text variant="body">
                  {generateShareText()}
                </Text>
              </div>
              <Button
                variant="primary"
                onClick={handleCopyShareText}
                size="md"
              >
                {copySuccess ? "Copied!" : "Copy"}
              </Button>
            </Box>
          </Box>
        )}

        {userStats && (
          <Box
            display="flex"
            flexDirection="column"
            gap="sm"
            padding="3"
            corners="rounded-md"
            className="stats-section"
          >
            <Heading level={3} size="md">
              Your Stats
            </Heading>
            <Box display="flex" justifyContent="space-between" gap="md">
              <Box display="flex" flexDirection="column" alignItems="center">
                <div className="stat-number">{userStats.gamesPlayed}</div>
                <Text variant="caption">Played</Text>
              </Box>
              <Box display="flex" flexDirection="column" alignItems="center">
                <div className="stat-number">{userStats.winRate}%</div>
                <Text variant="caption">Win Rate</Text>
              </Box>
              <Box display="flex" flexDirection="column" alignItems="center">
                <div className="stat-number">{userStats.currentStreak}</div>
                <Text variant="caption">Current Streak</Text>
              </Box>
              <Box display="flex" flexDirection="column" alignItems="center">
                <div className="stat-number">{userStats.maxStreak}</div>
                <Text variant="caption">Max Streak</Text>
              </Box>
            </Box>
          </Box>
        )}

        <Box display="flex" flexDirection="column" gap="sm">
          {groups.map((group) => (
            <div key={group.id}>
              <Box
                padding="3"
                corners="rounded-md"
                className={`results-group ${group.color}`}
              >
                <Text weight="semibold" variant="body">
                  {group.connection}
                </Text>
                <div className="results-group-films">
                  <Text variant="body">
                    {group.films.map((f) => f.title).join(", ")}
                  </Text>
                </div>
              </Box>
            </div>
          ))}
        </Box>

        <Button variant="primary" onClick={handleClose} size="lg">
          View Board
        </Button>
      </Box>
    </Modal>
  );
}
