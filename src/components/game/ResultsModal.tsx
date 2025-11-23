import { Modal } from '@mond-design-system/theme/client';
import { Box, Heading, Text, Button } from '@mond-design-system/theme';
import type { Group } from '../../types';
import './ResultsModal.css';

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameStatus: 'won' | 'lost';
  groups: Group[];
  mistakes: number;
}

export function ResultsModal({
  isOpen,
  onClose,
  gameStatus,
  groups,
  mistakes,
}: ResultsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Box padding="6" display="flex" flexDirection="column" gap="lg">
        <div className="results-title">
          <Heading level={2} size="xl">
            {gameStatus === 'won' ? '🎉 You Won!' : '😔 Game Over'}
          </Heading>
        </div>

        <div className="results-message">
          <Text variant="body">
            {gameStatus === 'won'
              ? `Congratulations! You found all groups with ${mistakes} mistake${mistakes !== 1 ? 's' : ''}.`
              : 'Better luck next time! Here were the groups:'}
          </Text>
        </div>

        <Box display="flex" flexDirection="column" gap="sm">
          {groups.map((group) => (
            <div key={group.id} className="results-group">
              <Box padding="3" corners="rounded-md">
                <Text weight="semibold" variant="body">
                  {group.connection}
                </Text>
                <div className="results-group-films">
                  <Text variant="body">
                    {group.films.map((f) => f.title).join(', ')}
                  </Text>
                </div>
              </Box>
            </div>
          ))}
        </Box>

        <Button variant="primary" onClick={onClose} size="lg">
          View Board
        </Button>
      </Box>
    </Modal>
  );
}
