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

## Playable arcade interface

The playable game uses the approved arcade layout: a viewport-sized shell,
compact numeric resources, a dominant map, contextual bottom actions, and a
Journal/Terminal sidebar from 1024px. Smaller viewports open the journal and
terminal in an accessible modal. Inventory, spellbook, and character details use
the same modal pattern with internal scrolling, Escape dismissal, and focus
restoration. Auto-explore speed controls live under **Auto settings**; **Stop**
stays on the map while automation is running. The existing session, save URLs,
WebSocket actions, trade flows, and renderer remain connected to the live game.
The previous text-mode preference selects the Terminal tab on startup.

## Interface proposal

Open `http://127.0.0.1:5173/?mockup=interface` with `pnpm dev` running to view
the interactive interface assessment and redesign proposal. The mockup reuses
the existing dungeon renderer and artwork, works without the Ruby API, and
does not read or write game saves.

Open **Preview** to select exploration, combat, loot, or town, access design notes,
or return to the production game.
Explore starts a simulated encounter; three attacks reveal rewards; collecting
them updates the sample gold balance. Healing, inventory, character details,
the journal and a limited text-command form are interactive. Changing
the scenario resets the sample values. **Preview → Design notes** opens the
current-interface findings and reference links in an internal window.

The assessment prioritizes a single contextual action, numeric resources on
mobile, secondary panels outside the map, readable history in action mode, and
explicit labels. This route remains a presentation prototype with simulated data.
The approved layout also powers the playable client at `/` and `/game/:id`.

The visual direction follows a pixel-art arcade and terminal dungeon-crawler
direction: local Press Start 2P display typography, monospace body copy, square
frames, beveled pixel controls, segmented resources, phosphor-green actions,
amber gold, and terminal-style event history. The map's subtle scanline texture is static;
there is no flashing CRT effect. The playable client shares the same palette and font tokens.

The bundled font and its OFL license are under `public/assets/fonts/press-start-2p/`.

The fourth revision makes the dungeon the dominant surface. The `100dvh` shell
uses a single compact location header, a resource strip, an edge-to-edge map, and
compact controls along the bottom. Equipment and character details live in the
Character window. The default zoom is 1.3; manual zoom buttons are omitted.
Desktop widths of 1024px and above include a right sidebar (240–300px) for
Journal and Terminal. Both views share the same live history; the terminal keeps
its input available and preserves draft commands when switching views. New entries
scroll inside the panel. Below 1024px, the original modal controls remain in use.
The map occupies about 65% of the viewport at 1440×900 and 74% at 390×844; narrow
landscape screens retain at least 55%. Primary controls keep 44px touch targets.
The latest feedback occupies one line, with complete messages available in Journal.
Journal, inventory, character, terminal and preview controls use a native modal
dialog with Escape dismissal and focus restoration. Only long dialog content scrolls.

Visual references inspected for this revision:

- [Caves of Qud screenshot, Nintendo](https://www.nintendo.com/eu/media/images/assets/nintendo_switch_games/cavesofqud/nswitch_cavesofqud/CavesOfQud_05.jpg): fixed resource strips, terminal typography, map-first layout.
- [Stoneshard screenshot, SuperSoluce](https://cdn.supersoluce.com/file/docs/docid_5e1c8296105f4d8912000001/elemid_4ee9faa20a2fe93d0e000010/stoneshard-009.jpg): edge-anchored actions and restrained contextual feedback.

These are layout references, not bundled game assets. Playwright covers page overflow,
minimum map area (60% desktop with sidebar, 60% mobile portrait, 55% landscape) and visible controls
across four scenarios at 320×568, 390×844,
667×375, 844×390, 1024×768, 1440×700 and 1440×900, as well as dialog scrolling and keyboard focus.
