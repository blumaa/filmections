import { Box, Heading, Text } from '@mond-design-system/theme';

interface GroupPoolHeaderProps {
  title?: string;
  description?: string;
}

export function GroupPoolHeader({
  title = 'Group Pool',
  description = 'Manage connection groups for puzzle building',
}: GroupPoolHeaderProps) {
  return (
    <Box display="flex" flexDirection="column" gap="sm">
      <Heading level={1} size="2xl">
        {title}
      </Heading>
      <Text responsive>
        {description}
      </Text>
    </Box>
  );
}
