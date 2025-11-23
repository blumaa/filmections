import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mond-design-system/theme';
import { Box, Button, Spinner, Text } from '@mond-design-system/theme';
import { useGameStore } from './store/gameStore';
import { GameBoard } from './components/game/GameBoard';
import { ResultsModal } from './components/game/ResultsModal';
import { ToastProvider } from './providers/ToastProvider';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60, // 1 hour
      refetchOnWindowFocus: false,
    },
  },
});

function Game() {
  const { gameStatus, isLoading, newGame, groups, mistakes } = useGameStore();
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    // Initialize game on mount
    newGame();
  }, [newGame]);

  useEffect(() => {
    // Show results modal when game ends
    if (gameStatus === 'won' || gameStatus === 'lost') {
      setShowResults(true);
    }
  }, [gameStatus]);

  const handleCloseResults = () => {
    setShowResults(false);
  };

  if (isLoading) {
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
          <Text variant="body">Loading puzzle...</Text>
        </Box>
      </div>
    );
  }

  if (!groups.length) {
    return (
      <div className="app-container">
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap="lg"
        >
          <Text variant="body">No puzzle loaded</Text>
          <Button variant="primary" onClick={newGame}>
            Start New Game
          </Button>
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <Game />
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
