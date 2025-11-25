import { Box, Heading, Text } from "@mond-design-system/theme";

export function ThemeManager() {
  return (
    <Box display="flex" flexDirection="column" gap="lg" padding="4">
      <Heading level={1} size="2xl">
        Theme Manager
      </Heading>
      <Text variant="body">
        Theme manager will be implemented in MDS-130.
      </Text>
    </Box>
  );
}
