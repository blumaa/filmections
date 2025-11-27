# Filmecules

A film-themed connections game inspired by NYTimes Connections. Group 16 films into 4 categories of 4!

## Features

- 🎬 Dynamic puzzle generation using TMDB API
- 🎨 Clean UI with Mond Design System
- 🧩 Multiple grouping strategies:
  - Director-based (films by same director)
  - Actor-based (films with same lead actor)
  - Genre/theme-based
  - Decade-based
  - Wordplay (titles with common words)
- 🎯 NYTimes Connections-style gameplay
- ⚡ Fast, modern tech stack

## Tech Stack

- **React 19** with TypeScript
- **Vite** for build tooling
- **Bun** for package management
- **Zustand** for state management
- **TanStack Query** for API caching
- **Mond Design System** for UI components
- **TMDB API** for film data

## Setup

1. **Get a TMDB API key**:
   - Go to https://www.themoviedb.org/settings/api
   - Create an account and request an API key
   - Copy your API key

2. **Configure environment**:
   ```bash
   # Copy the example file and add your API key
   cp .env.example .env.local
   # Then edit .env.local and add your TMDB API key
   ```

3. **Install dependencies**:
   ```bash
   bun install
   ```

4. **Start development server**:
   ```bash
   bun run dev
   ```

5. **Open in browser**:
   - Navigate to http://localhost:5173

## How to Play

1. You'll see 16 film titles arranged in a 4×4 grid
2. Select 4 films you think belong to the same group
3. Click "Submit" to check your guess
4. You have 4 mistakes allowed
5. Find all 4 groups to win!

## Game Mechanics

- **Duplicate guess detection**: Retrying the same combination doesn't count as a mistake
- **Dynamic grid**: As you find groups, they collapse into colored rows at the top
- **Difficulty colors**:
  - 🟨 Yellow (Easy)
  - 🟩 Green (Medium)
  - 🟦 Blue (Hard)
  - 🟪 Purple (Hardest)

## Project Structure

```
src/
├── components/
│   └── game/           # Game UI components
├── hooks/              # Custom React hooks
├── services/           # API services & puzzle generator
├── store/              # Zustand store
├── types/              # TypeScript definitions
└── utils/              # Utility functions
```

## Scripts

```bash
bun run dev      # Start development server
bun run build    # Build for production
bun run preview  # Preview production build
bun run test     # Run tests
```

## Future Enhancements

- Daily puzzle mode
- Leaderboards
- Share results (like Wordle)
- Film poster images
- More grouping strategies
- Difficulty settings

## License

MIT
