export const EVENTS = {
  // Game lifecycle
  GAME_STARTED: "game_started",
  GAME_RESUMED: "game_resumed",
  GAME_WON: "game_won",
  GAME_LOST: "game_lost",

  // Gameplay
  GUESS_SUBMITTED: "guess_submitted",
  GROUP_FOUND: "group_found",
  FILMS_SHUFFLED: "films_shuffled",

  // Engagement
  STATS_VIEWED: "stats_viewed",
  THEME_TOGGLED: "theme_toggled",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];
