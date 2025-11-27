import {
  Badge,
  Box,
  Card,
  Heading,
  Text,
} from "@mond-design-system/theme";
import type { Group } from "../../types";
import "./FoundGroupRow.css";
import { useThemeContext } from "../../providers/useThemeContext";
interface FoundGroupRowProps {
  group: Group;
}

export function FoundGroupRow({ group }: FoundGroupRowProps) {
  const { theme } = useThemeContext();
  return (
    <Card className={`found-group-row ${group.color}`}>
      <Box display="flex" flexDirection="column" gap="xs" paddingRight="2" paddingLeft="2" paddingTop="1" paddingBottom="1">
        <Heading
          level={3}
          size="md"
          semantic={theme === "light" ? "primary" : "inverse"}
        >
          {group.connection}
        </Heading>
        <Box display="flex" gap="xxs" flexWrap="wrap">
          {group.films.map((film) => (
            <Badge key={film.id} size="sm">
              <Text responsive>{film.title}</Text>
            </Badge>
          ))}
        </Box>
      </Box>
    </Card>
  );
}
