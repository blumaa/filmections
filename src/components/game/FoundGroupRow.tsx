import { Box, Heading, Text } from '@mond-design-system/theme';
import type { Group } from '../../types';
import './FoundGroupRow.css';

interface FoundGroupRowProps {
  group: Group;
}

export function FoundGroupRow({ group }: FoundGroupRowProps) {
  return (
    <div className={`found-group-row ${group.color}`}>
      <Box padding="4" corners="rounded-md" border='default'>
        <div className="found-group-heading">
          <Heading level={3} size="md">
            {group.connection}
          </Heading>
        </div>
        <div className="found-group-text">
          <Text variant="body">
            {group.films.map((f) => f.title).join(', ')}
          </Text>
        </div>
      </Box>
    </div>
  );
}
