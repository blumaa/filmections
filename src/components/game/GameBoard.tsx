import { Box } from "@mond-design-system/theme";
import { useGameStore } from "../../store/gameStore";
import { useToast } from "../../providers/useToast";
import { FoundGroupRow } from "./FoundGroupRow";
import { FilmGrid } from "./FilmGrid";
import { GameControls } from "./GameControls";
import { GameHeader } from "./GameHeader";
import { useEffect } from "react";
import "./GameBoard.css";

interface GameBoardProps {
  onViewStats?: () => void;
}

export function GameBoard({ onViewStats }: GameBoardProps) {
  const {
    films,
    foundGroups,
    selectedFilmIds,
    mistakes,
    notification,
    gameStatus,
    isShaking,
    puzzleDate,
    selectFilm,
    deselectAll,
    submitGuess,
    shuffleFilms,
  } = useGameStore();

  const { showInfo } = useToast();

  const MAX_MISTAKES = 4;
  const MAX_SELECTIONS = 4;

  // Show toast when notification changes
  useEffect(() => {
    if (notification) {
      showInfo(notification);
    }
  }, [notification, showInfo]);

  return (
    <div className="game-board-container">
      <Box display="flex" flexDirection="column" gap="lg">
        <GameHeader
          mistakes={mistakes}
          maxMistakes={MAX_MISTAKES}
          gameStatus={gameStatus}
          puzzleDate={puzzleDate || undefined}
          onViewStats={onViewStats}
        />

        {/* Found groups as colored rows */}
        {foundGroups.length > 0 && (
          <div className="found-groups-container">
            {foundGroups.map((group) => (
              <FoundGroupRow key={group.id} group={group} />
            ))}
          </div>
        )}

        {/* Remaining film tiles in dynamic grid */}
        {films.length > 0 && gameStatus === "playing" && (
          <FilmGrid
            films={films}
            selectedFilmIds={selectedFilmIds}
            isShaking={isShaking}
            onSelectFilm={selectFilm}
          />
        )}

        {gameStatus === "playing" && (
          <GameControls
            onSubmit={submitGuess}
            onShuffle={shuffleFilms}
            onDeselect={deselectAll}
            hasSelection={selectedFilmIds.length > 0}
            canSubmit={selectedFilmIds.length === MAX_SELECTIONS}
          />
        )}
      </Box>
    </div>
  );
}
