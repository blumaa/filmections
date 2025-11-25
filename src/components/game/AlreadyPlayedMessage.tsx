import { Box, Card, Heading, Text } from "@mond-design-system/theme";
import { CountdownTimer } from "./CountdownTimer";
import "./AlreadyPlayedMessage.css";

export function AlreadyPlayedMessage() {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap="lg"
      className="already-played-container"
    >
      <Card>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap="md"
          padding="4"
          className="already-played-card"
        >
          <div className="already-played-icon">✅</div>
          <Heading level={2} size="xl">
            You&apos;ve already completed today&apos;s puzzle!
          </Heading>
          <Text variant="body">
            Come back tomorrow for a new puzzle.
          </Text>
          <Box padding="2">
            <CountdownTimer />
          </Box>
        </Box>
      </Card>
    </Box>
  );
}
