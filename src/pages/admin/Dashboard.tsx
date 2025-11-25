import { Box, Heading, Text } from "@mond-design-system/theme";

export function AdminDashboard() {
  return (
    <Box display="flex" flexDirection="column" gap="lg" padding="4">
      <Heading level={1} size="2xl">
        Admin Dashboard
      </Heading>
      <Text variant="body">
        Welcome to the Filmections admin panel.
      </Text>
    </Box>
  );
}
