# Text Adventures Frontend

React + TypeScript Vite frontend for the Text Adventures browser client.

## Structure

- `src/components/game`: modular game panels and layout components.
- `src/hooks/useGameSession.ts`: API/WebSocket session state.
- `src/lib`: typed helpers for commands, trade, storage, API, and view models.
- `public/assets`: static game art copied into the Vite build output.
- `public/map_renderer.js`: legacy canvas dungeon renderer kept as a public bridge during the React migration.
- `nginx.conf`: static frontend serving and `/api`/`/ws` proxy config for the Compose web service.

## Commands

```sh
pnpm dev
pnpm lint
pnpm test
pnpm build
pnpm playwright test
pnpm storybook
```

The Vite dev server proxies `/api` and `/ws` to the Ruby server on `127.0.0.1:4567`.
