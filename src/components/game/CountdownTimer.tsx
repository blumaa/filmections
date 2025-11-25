import { useEffect, useState } from "react";
import { Text } from "@mond-design-system/theme";

interface CountdownTimerProps {
  className?: string;
}

function getTimeUntilMidnightUTC(): { hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);

  const diff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds };
}

export function CountdownTimer({ className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(getTimeUntilMidnightUTC());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeUntilMidnightUTC());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = () => {
    const parts = [];
    if (timeLeft.hours > 0) {
      parts.push(`${timeLeft.hours}h`);
    }
    if (timeLeft.minutes > 0 || timeLeft.hours > 0) {
      parts.push(`${timeLeft.minutes}m`);
    }
    parts.push(`${timeLeft.seconds}s`);
    return parts.join(" ");
  };

  return (
    <div className={className}>
      <Text variant="body">
        Next puzzle in {formatTime()}
      </Text>
    </div>
  );
}
