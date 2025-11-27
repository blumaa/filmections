import { useEffect, useState } from "react";
import { Box, Text } from "@mond-design-system/theme";

function getTimeUntilMidnightUTC(): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCDate(midnight.getUTCDate() + 1);
  midnight.setUTCHours(0, 0, 0, 0);

  const diff = midnight.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds };
}

export function CountdownTimer() {
  const [countdown, setCountdown] = useState(getTimeUntilMidnightUTC());

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getTimeUntilMidnightUTC());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatCountdown = () => {
    const { hours, minutes, seconds } = countdown;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  return (
    <Box display="flex" alignItems="center" justifyContent="center" gap="sm">
      <Text size="2xs">Next puzzle in</Text>
      <Text size="xl" weight="semibold">
        {formatCountdown()}
      </Text>
    </Box>
  );
}
