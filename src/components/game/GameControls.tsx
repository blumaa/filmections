import { Box, Button } from '@mond-design-system/theme';

interface GameControlsProps {
  onSubmit: () => void;
  onShuffle: () => void;
  onDeselect: () => void;
  hasSelection: boolean;
  canSubmit: boolean;
}

export function GameControls({
  onSubmit,
  onShuffle,
  onDeselect,
  hasSelection,
  canSubmit,
}: GameControlsProps) {
  return (
    <Box display="flex" gap="sm" justifyContent="center">
      <Button variant="outline" onClick={onShuffle} size="md">
        Shuffle
      </Button>
      <Button
        variant="outline"
        onClick={onDeselect}
        size="md"
        disabled={!hasSelection}
      >
        Deselect All
      </Button>
      <Button
        variant="primary"
        onClick={onSubmit}
        size="md"
        disabled={!canSubmit}
      >
        Submit
      </Button>
    </Box>
  );
}
