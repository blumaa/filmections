import { Box } from "@mond-design-system/theme";
import { FilmTile } from "./FilmTile";
import type { Film } from "../../types";

interface FilmGridProps {
  films: Film[];
  selectedFilmIds: number[];
  isShaking: boolean;
  onSelectFilm: (filmId: number) => void;
}

export function FilmGrid({
  films,
  selectedFilmIds,
  isShaking,
  onSelectFilm,
}: FilmGridProps) {
  return (
    <Box display="grid" gap="sm" gridTemplateColumns="repeat(4, 1fr)" responsiveWidth>
      {films.map((film) => (
        <FilmTile
          key={film.id}
          film={film}
          isSelected={selectedFilmIds.includes(film.id)}
          isShaking={isShaking}
          onClick={() => onSelectFilm(film.id)}
        />
      ))}
    </Box>
  );
}
