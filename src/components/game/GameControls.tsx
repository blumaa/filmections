import { Box, Button } from "@mond-design-system/theme";

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
      <Button
        variant="outline"
        onClick={onShuffle}
        size="sm"
        corners="rounded-xl"
      >
        Shuffle
      </Button>
      <Button
        variant="outline"
        onClick={onDeselect}
        size="sm"
        disabled={!hasSelection}
        corners="rounded-xl"
      >
        Deselect All
      </Button>
      <Button
        variant="primary"
        onClick={onSubmit}
        size="sm"
        disabled={!canSubmit}
        corners="rounded-xl"
      >
        Submit
      </Button>
    </Box>
  );
}
