import { Box, Text, Button, Card, CardBody, Divider } from '@mond-design-system/theme';
import { Input } from '@mond-design-system/theme/client';
import type { StoredPuzzle, PuzzleStatus } from '../../../lib/supabase/storage/IPuzzleStorage';
import type { Group } from '../../../types';
import { FoundGroupRow } from '../../../components/game/FoundGroupRow';
import { PuzzleQueueCardHeader } from './PuzzleQueueCardHeader';
import './PuzzleQueueCard.css';

interface PuzzleQueueCardProps {
  puzzle: StoredPuzzle;
  onStatusChange: (id: string, status: PuzzleStatus) => void;
  onReject: (id: string) => void;
  onAssignDate: (id: string, date: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function PuzzleQueueCard({
  puzzle,
  onStatusChange,
  onReject,
  onAssignDate,
  isUpdating,
  isDeleting,
}: PuzzleQueueCardProps) {
  return (
    <Card>
      <CardBody>
        <Box display="flex" flexDirection="column" gap="md">
          {/* Header with Status and Actions */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <PuzzleQueueCardHeader
              status={puzzle.status}
              qualityScore={puzzle.qualityScore}
              title={puzzle.title}
              puzzleDate={puzzle.puzzleDate}
            />

            {/* Action Buttons */}
            <Box display="flex" gap="sm">
              {puzzle.status === 'pending' && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onStatusChange(puzzle.id, 'approved')}
                    disabled={isUpdating}
                  >
                    Approve
                  </Button>
                  <div className="reject-btn-wrapper">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onReject(puzzle.id)}
                      disabled={isDeleting}
                    >
                      Reject
                    </Button>
                  </div>
                </>
              )}

              {puzzle.status === 'approved' && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onStatusChange(puzzle.id, 'published')}
                    disabled={isUpdating || !puzzle.puzzleDate}
                  >
                    Publish
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStatusChange(puzzle.id, 'pending')}
                    disabled={isUpdating}
                  >
                    Back to Pending
                  </Button>
                </>
              )}

              {puzzle.status === 'published' && (
                <Button
                  variant="destructive"
                  onClick={() => onStatusChange(puzzle.id, 'approved')}
                  disabled={isUpdating}
                >
                  Unpublish
                </Button>
              )}
            </Box>
          </Box>

          {/* Date Assignment */}
          {puzzle.status === 'approved' && (
            <Box display="flex" alignItems="center" gap="sm">
              <Text responsive>Assign Date:</Text>
              <Input
                type="date"
                value={puzzle.puzzleDate || ''}
                onChange={(e) => onAssignDate(puzzle.id, e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </Box>
          )}

          <Divider />

          {/* Puzzle Groups */}
          <Box display="flex" flexDirection="column" gap="sm">
            {puzzle.groups?.map((group, index) => (
              <FoundGroupRow key={index} group={group as Group} />
            ))}
            {!puzzle.groups?.length && (
              <Text responsive semantic="secondary">Groups not loaded</Text>
            )}
          </Box>
        </Box>
      </CardBody>
    </Card>
  );
}
