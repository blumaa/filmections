import { Box } from '@mond-design-system/theme';
import { useGameStore } from '../../store/gameStore';
import { useToast } from '../../providers/useToast';
import { FoundGroupRow } from './FoundGroupRow';
import { FilmTile } from './FilmTile';
import { GameControls } from './GameControls';
import { GameHeader } from './GameHeader';
import { useEffect } from 'react';
import './GameBoard.css';

export function GameBoard() {
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
      <Box display="flex" flexDirection="column" gap="lg" >
        <GameHeader
          mistakes={mistakes}
          maxMistakes={MAX_MISTAKES}
          gameStatus={gameStatus}
          puzzleDate={puzzleDate || undefined}
        />

        {/* Found groups as colored rows */}
        {foundGroups.length > 0 && (
          <Box display="flex" flexDirection="column" gap="sm">
            {foundGroups.map((group) => (
              <FoundGroupRow key={group.id} group={group} />
            ))}
          </Box>
        )}

        {/* Remaining film tiles in dynamic grid */}
        {films.length > 0 && gameStatus === 'playing' && (
          <Box display="grid" gap="xs" gridTemplateColumns="repeat(4, 1fr)">
            {films.map((film) => (
              <FilmTile
                key={film.id}
                film={film}
                isSelected={selectedFilmIds.includes(film.id)}
                isShaking={isShaking}
                onClick={() => selectFilm(film.id)}
              />
            ))}
          </Box>
        )}

        {gameStatus === 'playing' && (
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
