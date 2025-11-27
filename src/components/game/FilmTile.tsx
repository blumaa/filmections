import { Card, CardBody, Box, Text } from "@mond-design-system/theme";
import type { Film } from "../../types";

interface FilmTileProps {
  film: Film;
  isSelected: boolean;
  isShaking?: boolean;
  onClick: () => void;
}

export function FilmTile({
  film,
  isSelected,
  isShaking,
  onClick,
}: FilmTileProps) {
  return (
    <Card
      aspectRatio="square"
      isSelected={isSelected}
      shake={isShaking && isSelected}
      onClick={onClick}
      hoverable
      variant="elevated"
    >
      <CardBody>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          height="full"
        >
          <Text responsive align="center">
            {film.title}
          </Text>
        </Box>
      </CardBody>
    </Card>
  );
}
