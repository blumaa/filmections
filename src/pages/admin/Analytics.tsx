import { Box, Heading, Text } from "@mond-design-system/theme";

export function Analytics() {
  return (
    <Box display="flex" flexDirection="column" gap="lg" padding="4">
      <Heading level={1} size="2xl">
        Analytics
      </Heading>
      <Text variant="body">
        Analytics dashboard will be implemented in MDS-131.
      </Text>
    </Box>
  );
}
