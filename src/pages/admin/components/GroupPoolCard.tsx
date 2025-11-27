import {
  Box,
  Badge,
  Text,
  Button,
  BadgeVariant,
  Tag,
  Card,
  CardBody,
  Divider,
  Heading,
} from "@mond-design-system/theme";
import { Radio, Input } from "@mond-design-system/theme/client";
import type {
  StoredGroup,
  DifficultyColor,
} from "../../../lib/supabase/storage";
import { DIFFICULTY_LABELS } from "../../../constants/difficulty";
import "./GroupPoolCard.css";

const availableColors: DifficultyColor[] = [
  "yellow",
  "green",
  "blue",
  "purple",
];

const groupStatus = {
  pending: "warning",
  approved: "success",
  rejected: "error",
};

interface GroupPoolCardProps {
  group: StoredGroup;
  isEditing: boolean;
  editedConnection: string;
  onEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onConnectionChange: (value: string) => void;
  onColorChange: (id: string, color: DifficultyColor) => void;
  onApprove: () => void;
  onReject: () => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function GroupPoolCard({
  group,
  isEditing,
  editedConnection,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onConnectionChange,
  onColorChange,
  onApprove,
  onReject,
  isUpdating,
  isDeleting,
}: GroupPoolCardProps) {
  return (
    <Card>
      <CardBody>
        <Box
          display="flex"
          flexDirection="column"
          gap="sm"
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="flex-start"
          >
            <Box
              display="flex"
              flexDirection="column"
              gap="xs"
            >
              {isEditing ? (
                <Input
                  value={editedConnection}
                  onChange={(e) => onConnectionChange(e.target.value)}
                  autoFocus
                />
              ) : (
                <Heading size="xl" weight="bold">
                  {group.connection}
                </Heading>
              )}
              <Box display="flex" gap="sm" alignItems="center">
                <Text responsive>connection: {group.connectionType}</Text>|
                <Text responsive>difficult score:{group.difficultyScore}</Text>|
                <Tag variant="outlined" semantic="warning">
                  Used: {group.usageCount}x
                </Tag>
                <Badge variant={groupStatus[group.status] as BadgeVariant}>
                  {group.status}
                </Badge>
              </Box>
            </Box>

            {/* Action buttons */}
            <Box display="flex" gap="xs">
              {isEditing ? (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onSaveEdit}
                    disabled={isUpdating}
                  >
                    Save
                  </Button>
                  <Button variant="outline" size="sm" onClick={onCancelEdit}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={onEdit}>
                    Edit
                  </Button>
                  {group.status === "pending" && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={onApprove}
                        disabled={isUpdating}
                      >
                        Approve
                      </Button>
                      <div className="reject-btn-wrapper">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onReject}
                          disabled={isDeleting}
                        >
                          Reject
                        </Button>
                      </div>
                    </>
                  )}
                </>
              )}
            </Box>
          </Box>

          {/* Films list */}
          <Box display="flex" gap="sm" className="films-list">
            {group.films.map((film) => (
              <Badge key={film.id} size="md">
                <Text responsive>
                  {film.title} | {film.year}
                </Text>
              </Badge>
            ))}
          </Box>
          <Divider />
          <Box
            display="flex"
            gap="sm"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box
              corners="rounded-full"
              className={`color-indicator color-indicator--${group.color || "green"}`}
            />

            <Box display="flex" gap="sm">
              {availableColors.map((color) => (
                <Radio
                  key={color}
                  name={`color-${group.id}`}
                  label={DIFFICULTY_LABELS[color]}
                  value={color}
                  checked={group.color === color}
                  onChange={() => onColorChange(group.id, color)}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </CardBody>
    </Card>
  );
}
