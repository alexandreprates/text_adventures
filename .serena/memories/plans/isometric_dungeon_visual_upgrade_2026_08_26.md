# Isometric Dungeon Visual Upgrade Plan

Date: 2026-08-26
Reference: repository-root `mockup.mp4` (10.04 s, 752x416, 24 fps).

## Objective

Reach the visual quality and presentation level demonstrated by the mockup for the browser dungeon while preserving the Ruby domain model, structured web actions, accessibility text map, desktop/mobile support, and deterministic gameplay.

## Reference assessment

The mockup is a coherent isometric dungeon presentation, not merely a higher-resolution tileset. It includes:

- a 2:1 isometric ground projection and raised walls;
- camera tracking/panning through connected rooms;
- depth-sorted actors, walls, doors, chests, barrels, rubble, banners, and corpses;
- warm animated torch lighting against a near-black background;
- walk, attack, hit, death, chest-open, and loot glow animation;
- impact sprites, particles, weapon arcs, and persistent defeated-enemy poses;
- a large art-first playfield with little competing UI.

The compressed video is not sufficient to infer its exact source pixel grid. Treat it as an art-direction and motion reference, not a source asset.

## Current baseline observed

Validated through the Compose browser surface at desktop 1440x900 and mobile 393x851.

- React + TypeScript UI uses `MapPanel.tsx` with the legacy `frontend/public/map_renderer.js` Canvas 2D bridge.
- The dungeon payload is an 18x15 tile viewport assembled from a centered 3x3 block window.
- Terrain only distinguishes wall, floor, and unrevealed; entities are player, enemy, loot, portal, ascent, and descent.
- Renderer uses rectangular 48x98 cells sampled from an irregular 1254x1254 concept sheet.
- The player renderer always selects `walk`, frame 0. Enemy sprites are static 128x128 PNGs.
- Combat feedback is a short Canvas line/glow trace inferred from text-derived `combat.damage` events.
- Current inventory is 15 class atlases (33.55 MB) and 50 enemy sprites (1.01 MB), but their style, alpha, scale, and perspective are not production-consistent.
- Asset inspection found 141,703 colors in the tileset; the sample enemy had 1,349 partially transparent pixels; the Adventurer atlas had 359,095 partially transparent pixels. These are concept/high-color assets rather than a constrained production pixel-art set.
- Current responsive layout works, but the map is visually small on desktop and the UI competes with the scene on mobile.

## Recommended technical direction

Keep Canvas 2D for the first production slice and do not add a rendering/UI library. Move the renderer from the public JavaScript bridge into small TypeScript modules so it can be tested and composed from React. Benchmark the vertical slice before requesting approval for any engine dependency.

Proposed logical art contract, subject to visual-spike approval:

- 2:1 isometric ground diamond: 32x16 logical pixels, displayed at integer scale (normally 2x);
- raised wall unit: 32x48 or 32x64 logical pixels depending on the approved silhouette;
- actors: fixed 48x64 logical frame cells with a shared foot/base anchor;
- RGBA PNG, binary alpha for cutouts, nearest-neighbor scaling, no runtime chroma key;
- shared dungeon palette/ramp policy, consistent upper-left torch lighting, fixed outline treatment;
- stable frame padding, origin, baseline, and weapon/hand anchors across animations.

The vertical slice must validate these numbers before mass asset production.

## Architecture work

1. Create a typed asset manifest for terrain, wall topology, props, actors, animation clips, frame durations, anchors, light masks, and effects.
2. Implement isometric projection and camera transforms:
   - project logical tile coordinates to screen coordinates;
   - center/ease camera toward the player;
   - clamp or frame revealed bounds;
   - preserve integer-scale pixel rendering where possible.
3. Render explicit layers:
   - ground;
   - rear wall faces and architecture;
   - floor props and decals;
   - depth-sorted actors/props by projected foot position;
   - front-wall/occlusion layer;
   - authored effect sprites and light masks;
   - fog/unrevealed cover;
   - HTML accessibility/UI overlays.
4. Replace runtime gradients/primitives used as art with authored effect/light sprites. Runtime code may position, composite, tint, and change opacity but should not invent production artwork.
5. Add animation state for idle, walk, attack, cast, hurt, defeat, interact, chest open, and loot glow. The gameplay state remains authoritative; animation only interpolates presentation.
6. Extend the event contract so animation does not parse prose. Events should carry a sequence id, actor/source, target, action/effect, from/to positions, facing, and outcome. Preserve readable text alongside structured fields.
7. Add an optional visual/decor layer to `data/dungeon_blocks.yml` (or a companion YAML manifest) for authored prop/light slots. Keep collision tiles limited to wall/open and never encode enemies or loot in terrain tiles.
8. Keep the current text viewport as the accessible fallback and preserve all structured actions/auto-explore behavior.

## Asset work

### Vertical-slice pack

- one coherent stone dungeon floor set with clean/cracked variants;
- NE/NW wall faces, tops, inner/outer corners, pillars, openings, and one door/arch kit;
- rubble, banner, barrel variants, crate, torch, closed/open chest, loot pile, ascent/descent/portal;
- authored shadow/light masks and 2-3 impact/effect sheets;
- Adventurer: idle, walk, attack, hurt, defeat, and interact in four facings;
- two enemy families matching the mockup (goblin and skeleton): idle, move, attack, hurt, defeat;
- corpse/end-state frames and chest/loot animation.

### Scale-out pack

After approval, expand by reusable silhouette families rather than immediately redrawing all 50 enemies. Prioritize creatures encountered on the earliest dungeon levels. Produce remaining player classes only after the shared frame/anchor contract and equipment overlap rules are proven.

## Delivery phases

### Phase 0 — Art/renderer contract (2-3 days)

- capture current desktop/mobile baselines;
- build a reference board from selected video frames;
- approve projection, logical grid, wall height, actor scale, palette, outline, light direction, and anchors;
- create a deterministic 8x8 room fixture and asset validator.

Gate: one static room composition reads correctly at native and 2x scale, with no tile seams or perspective conflicts.

### Phase 1 — Vertical slice (1-2 weeks)

- implement typed TypeScript renderer, projection, layers, depth sorting, and camera;
- produce the vertical-slice art pack;
- render one room with player, goblin, skeleton, torch, barrels, door, and chest;
- implement walk, one attack exchange, defeat, chest open, and loot glow;
- expose behind a feature flag or dedicated mockup route.

Gate: a 10-second deterministic sequence comparable to the reference works at 752x416, desktop, and mobile.

### Phase 2 — Live gameplay integration (1-2 weeks)

- connect viewport/state and structured events;
- add smooth movement between server-confirmed tiles;
- integrate combat, loot, stairs/portal, fog, zoom, auto-explore, interruption, reconnect, and reduced-motion behavior;
- preserve current gameplay logic and text fallback.

Gate: normal dungeon play is complete without visual desynchronization, including fast auto-explore and reconnect.

### Phase 3 — Dungeon content kit and UI composition (1-2 weeks)

- author YAML visual/decor slots and theme variants;
- complete wall topology and room transitions;
- make the scene art-first while retaining accessible HUD/actions;
- tune camera framing and occlusion for desktop/mobile.

Gate: all existing dungeon block shapes render without seams, missing corners, blocked actors, or unreadable controls.

### Phase 4 — Production asset scale-out (3-8+ weeks, content-dependent)

- expand early-level enemy families, then the remaining 50-creature catalog;
- migrate player classes in prioritized batches;
- add effect families for physical, fire, ice, nature, air, earth, and dark magic;
- optimize atlases and lazy loading.

Gate: every gameplay-reachable creature/class has a mapped, validated fallback or approved animation set; no mixed visual language ships unintentionally.

### Phase 5 — Polish and release (about 1 week)

- performance and memory pass;
- screenshot regression pass;
- accessibility, reduced motion, mobile touch, loading/error/empty states;
- deterministic Compose smoke and full validation.

## Acceptance criteria

- coherent 2:1 perspective across terrain, architecture, props, actors, and effects;
- no visible seams in repeated 3x3 tile tests and no periodic landmark pattern;
- stable anchors/baselines with no frame jitter or animation identity drift;
- correct depth order and front-wall occlusion for every movement direction;
- deterministic final state after animation interruption, fast auto-explore, or reconnect;
- target 60 fps on desktop and at least 30 fps on representative mobile hardware for the 18x15 viewport with combat effects;
- no blurry or fractional pixel scaling in approved integer-scale modes;
- desktop and mobile controls remain readable and accessible;
- initial scene assets are lazy-loaded and do not require the full 15-class/50-enemy catalog.

## Validation

- unit tests for projection, depth keys, camera, animation reducer, manifest coverage, and event sequencing;
- asset inspection for frame divisibility, binary alpha, palette policy, anchors, and contact sheets;
- 3x3 repeated-tile and room-transition visual checks;
- Playwright screenshots for 752x416 reference framing, desktop, and mobile, plus reduced-motion mode;
- `pnpm lint`, `pnpm test`, `pnpm playwright test`, and Storybook for reusable components;
- `bundle exec rspec`;
- deterministic Compose/API gameplay smoke with `TEXT_ADVENTURES_RANDOM_SEED=0`.

## Primary risks

- asset volume: 15 class atlases and 50 enemies make full parity much larger than the renderer work;
- current assets have inconsistent perspective, high color counts, antialiasing, and frame contracts;
- current events are derived from prose and lack precise actor/target/timing data;
- isometric raised walls can hide actors on the small mobile viewport;
- mass-producing art before the vertical-slice gate would create expensive rework.

## Recommendation

Approve only Phase 0 and Phase 1 first. The decision point is the deterministic vertical slice: if it reaches the reference quality and performs well on mobile, continue into live integration and prioritized content production. Do not start by converting all 65 actor sets.

## Implementation status — completed 2026-08-26

The approved vertical slice and live integration are complete.

### Delivered

- Replaced the legacy public `map_renderer.js` bridge with typed TypeScript modules for projection, asset loading, animation cues, depth sorting, camera interpolation, and Canvas rendering.
- Added a validated 2:1 production asset pack for floor, raised wall, Adventurer, goblin, skeleton, chest, torch, portal, descending stairs, warm light pool, slash, and magic effects.
- Added movement/camera interpolation, adaptive 60 fps desktop/30 fps mobile pacing, torch loops, structured combat effects, defeat/corpse transients, chest-open transients, high-DPI Canvas sizing, reduced-motion behavior, and static fallbacks for the remaining enemy catalog.
- Added `stone_ruins` theme and authored decoration slots to dungeon block YAML while keeping collision tiles limited to walls/open spaces.
- Extended HTTP and WebSocket events with sequence, actor, target, action, effect, outcome, duration, facing, and movement coordinates while preserving readable text.
- Added loading, error, success, accessible text fallback, responsive desktop/mobile framing, and real Canvas pixel assertions in Playwright.
- Removed the legacy renderer and reduced the new shipped isometric pack to 124 KB.
- Made connection-capacity cleanup and its overload e2e synchronization deterministic after the full suite exposed a pre-existing socket-release race.

### Validation evidence

- Pixel-art validator: all 12 final PNGs pass RGBA, binary-alpha, palette, frame-divisibility, and anchor-spread inspection.
- `pnpm lint`: passed in the Node container.
- `pnpm test`: 6 files, 14 tests passed.
- `pnpm build`: passed.
- `pnpm playwright test`: 34 tests passed across Chromium desktop and Pixel 5 profiles.
- `pnpm storybook --ci`: development server reached ready state.
- `pnpm build-storybook`: passed; only the existing Storybook chunk-size warning remains.
- `bundle exec rspec`: 468 examples, 0 failures in the Compose server container.
- Compose production build: passed; all 12 renderer assets returned HTTP 200 with no browser console warnings/errors.
- Deterministic seed-0 API smoke: movement event returned `from`, `to`, and `facing`; viewport returned `stone_ruins` and authored torch metadata.
- Manual browser inspection: desktop 1440x900 and mobile 393x851, including multi-block auto-explore camera movement.

### Remaining scale-out work

- The vertical slice provides animated Adventurer, goblin, and skeleton families. Other player classes and enemies intentionally use the existing static fallback until prioritized art batches are approved.
- Additional wall topology, doors, barrels, rubble, banners, spell families, and more animation facings remain content-production work rather than renderer blockers.

Implementation commit: `7423c49` (`Add isometric dungeon presentation`).
