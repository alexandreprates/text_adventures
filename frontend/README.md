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

## Tailwind CSS

Tailwind CSS v4 runs through `@tailwindcss/vite` in development, production,
and Storybook. `src/tailwind.css` contains the CSS-first theme configuration
and scans `src/` plus `index.html`. No PostCSS or JavaScript Tailwind config
is required. Storybook loads the same global styles through its preview file.

Use utility classes for new layouts and existing design tokens for colors:

```tsx
<section className="grid gap-6 rounded-lg border border-line bg-surface p-6 text-foreground md:grid-cols-2">
  <p className="text-muted">Adventure details</p>
</section>
```

Token aliases include `page`, `surface`, `surface-strong`, `line`, `line-soft`,
`foreground`, `muted`, `dim`, `accent`, `accent-strong`, `danger`, `mana`, `gold`,
`button`, and `button-hover`. `font-sans` and `font-mono` use existing font tokens.
`preview-muted` is scoped to the interface mockup's palette.

Preflight is intentionally omitted to preserve the existing game's reset and
element styling. The existing global styles live in `@layer base`, allowing
utilities to override them. Legacy component styles remain unlayered and take
precedence over normal utilities; remove conflicting declarations when migrating
a component rather than adding `!important`. Keep class names complete and
statically discoverable in source. The mockup's design-notes grid demonstrates
responsive utilities and a theme color alias.

## Interface proposal

Open `http://127.0.0.1:5173/?mockup=interface` with `pnpm dev` running to view
the interactive interface assessment and redesign proposal. The mockup reuses
the existing dungeon renderer and artwork, works without the Ruby API, and
does not read or write game saves.

Use the scenario selector to preview exploration, combat, loot, and town.
Explore starts a simulated encounter; three attacks reveal rewards; collecting
them updates the sample gold balance. Healing, inventory, character details,
the journal, zoom, and a limited text-command form are interactive. Changing
the scenario resets the sample values. The **Design notes** button expands the
current-interface findings and the corresponding proposals.

The assessment prioritizes a single contextual action, numeric resources on
mobile, secondary panels outside the map, readable history in action mode, and
explicit labels. This is a presentation prototype, not a replacement gameplay
client. Validate the proposed layout with players before production integration.
