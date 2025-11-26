import {
  Badge,
  Box,
  Card,
  CardBody,
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
      <CardBody>
        <Box display="flex" flexDirection="column" gap="xs">
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
                <Text variant="body-xs">{film.title}</Text>
              </Badge>
            ))}
          </Box>
        </Box>
      </CardBody>
    </Card>
  );
}
