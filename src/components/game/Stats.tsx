import { Box, Card, CardBody, Heading, Text } from "@mond-design-system/theme";
import type { UserStats } from "../../types";
import "./Stats.css";

interface StatsProps {
  stats: UserStats;
}

export function Stats({ stats }: StatsProps) {
  return (
    <Card>
      <CardBody>
        <Heading level={3} size="md">
          Your Stats
        </Heading>
        <Box display="flex" justifyContent="space-between" gap="md">
          <Box display="flex" flexDirection="column" alignItems="center">
            <Text size="2xl" align="center">{stats.gamesPlayed}</Text>
            <Text semantic="secondary" align="center">Played</Text>
          </Box>
          <Box display="flex" flexDirection="column" alignItems="center">
            <Text size="2xl" align="center">{stats.currentStreak}</Text>
            <Text semantic="secondary" align="center">Current Streak</Text>
          </Box>
          <Box display="flex" flexDirection="column" alignItems="center">
            <Text size="2xl" align="center">{stats.maxStreak}</Text>
            <Text semantic="secondary" align="center">Max Streak</Text>
          </Box>
        </Box>
      </CardBody>
    </Card>
  );
}
