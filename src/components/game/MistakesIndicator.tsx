import { Box, Text } from "@mond-design-system/theme";
import "./MistakesIndicator.css";

interface MistakesIndicatorProps {
  mistakes: number;
  maxMistakes: number;
}

export function MistakesIndicator({
  mistakes,
  maxMistakes,
}: MistakesIndicatorProps) {
  const remainingMistakes = maxMistakes - mistakes;

  return (
    <Box display="flex" justifyContent="center">
      <Box display="flex" gap="xs">
        <Text size="2xs" weight="extralight">
          Mistakes remaining:
        </Text>
        <div className="mistakes-dots">
          {Array.from({ length: maxMistakes }).map((_, index) => (
            <div
              key={index}
              className={`mistake-dot ${index < remainingMistakes ? "filled" : "empty"}`}
            />
          ))}
        </div>
      </Box>
    </Box>
  );
}
