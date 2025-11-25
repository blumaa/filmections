import { Box, Text } from "@mond-design-system/theme";
import type { Film } from "../../types";
import "./FilmTile.css";

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
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      padding="1"
      corners="rounded-lg"
      border="default"
      onClick={onClick}
      className={`film-tile ${isSelected ? "selected" : ""} ${isShaking && isSelected ? "shake" : ""}`}
    >
      <Text variant="caption">{film.title}</Text>
    </Box>
  );
}
