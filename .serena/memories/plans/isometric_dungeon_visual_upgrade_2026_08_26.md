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

## Art-direction review and composition pass — completed 2026-08-26

A second rendered comparison against `mockup.mp4` identified the dominant remaining composition gap: the live dungeon read as a solid raised platform because corridors exposed only one walkable row and every perimeter cell used the same tall wall. Actor and prop baselines were also oversized and visually floated above the floor.

### Delivered

- Expanded all nine 6x5 dungeon blocks into connected chamber interiors with at least twelve open interior cells while preserving declared exits and collision semantics.
- Added authored barrel, rubble, banner, and low foreground-wall PNGs. The new assets use 64x64 or 64x96 logical canvases, limited palettes, RGBA, and binary alpha.
- Added deterministic YAML decoration layouts for every block and extended the domain decoration contract.
- Added topology-aware wall cutaways: rear and side architecture stays tall; foreground/lower walls use a low parapet, preserving interior readability and depth occlusion.
- Corrected player, animated enemy, torch, barrel, chest, banner, and fallback-enemy scale/baselines against the tile foot anchor.
- Added unit coverage for the prop manifest, wall topology, environment decoration validation, and chamber-space invariants.
- Updated text-map and deterministic e2e expectations for the roomier collision layouts.

### Validation evidence

- All 16 isometric PNGs passed RGBA, binary-alpha, palette, and frame-contract inspection.
- Browser inspection at desktop 1440x900 and mobile 393x851 confirmed open interiors, low foreground walls, readable props, combat staging, and no clipping.
- All 16 isometric image requests returned HTTP 200; browser console had no warnings or errors.
- `pnpm lint`: passed.
- `pnpm test`: 8 files, 17 tests passed.
- `pnpm build`: passed.
- `pnpm playwright test`: 34 tests passed across desktop Chromium and Pixel 5.
- `pnpm build-storybook`: passed with the existing chunk-size warning.
- `bundle exec rspec`: 470 examples, 0 failures.
- Deterministic seed-0 binary smoke returned the four authored decoration kinds, 270 terrain cells, and structured movement from/to/facing.

Implementation commit: `875ed78` (`Improve isometric dungeon composition`).

## Torch animation anchor correction — completed 2026-08-26

Frame inspection found that the entire torch assembly drifted horizontally across the four-frame loop. The bottom metal spike anchors were at x positions 39, 35, 31, and 28 instead of a stable shared origin.

### Delivered

- Mechanically translated the four existing 64x96 frames by -7, -3, +1, and +4 pixels without redrawing creative pixels.
- Normalized the named bottom-spike anchor to `(32,72)` in every frame.
- Added a typed `torchAnimationLayout` contract and made the renderer derive placement from its frame size, draw size, and anchor instead of magic offsets.
- Added unit coverage for the animation layout contract.

### Validation evidence

- Pixel-art validator: 256x96 RGBA sheet, four 64x96 frames, 14 opaque colors, binary alpha, no clipping, bottom spread 0, center-x spread 0.5.
- Explicit pixel inspection confirmed anchor `(32,72)` in all four frames.
- Contact-sheet and production-browser inspection confirmed the support stays fixed while the flame animates.
- Torch asset returned HTTP 200 and the browser console had no warnings or errors.
- `pnpm lint`: passed.
- `pnpm test`: 8 files, 18 tests passed.
- `pnpm build`: passed through the Compose production build.
- `pnpm playwright test`: 34 tests passed across desktop Chromium and Pixel 5.
- `bundle exec rspec`: 470 examples, 0 failures.

Implementation commit: `47c321a` (`Fix torch animation anchor`).

## Directional Adventurer facings — completed 2026-08-26

The frontend already tracked `up`, `right`, `down`, and `left`, but the Canvas renderer ignored `playerDirection` and always sampled the front-facing idle frame from the action sheet.

### Delivered

- Added `adventurer-facings.png`, a four-frame 384x128 sheet ordered by projected dungeon movement: up/northeast, right/southeast, down/southwest, and left/northwest.
- Preserved the separate action sheet for attack, hurt, and defeat states.
- Added a typed direction-to-frame contract and made the renderer select the matching facing during idle and interpolated movement.
- Changed the initial isometric facing to right/southeast, matching the established front-facing composition.
- Added unit coverage for asset loading, all four direction mappings, and the safe default.

### Asset contract

- Four 96x128 RGBA frames, 24 opaque colors, binary alpha, no clipping.
- All frames share the foot baseline at y=92 with zero bottom spread.
- Built-in image generation created the directional draft from the existing Adventurer identity/style reference. Mechanical chroma extraction, nearest-neighbor normalization, palette reduction without dithering, scale normalization, anchor alignment, and frame reordering produced the final sheet.

### Validation evidence

- Runtime Canvas sampling confirmed source x positions 0, 96, 192, and 288 for up, right, down, and left.
- Production-browser inspection confirmed the sprite turns with projected movement, the new asset returns HTTP 200, and the console has no warnings or errors.
- `pnpm lint`: passed.
- `pnpm test`: 8 files, 19 tests passed.
- Compose production build: passed.
- `pnpm playwright test`: 34 tests passed across desktop Chromium and Pixel 5.
- `bundle exec rspec`: 470 examples, 0 failures.

Implementation commit: `e78251f` (`Add directional Adventurer facings`).

## Directional Warlord animation pack — completed 2026-08-26

The Warlord class previously reused the Adventurer presentation because the renderer received `playerClass` but did not select class-specific assets.

### Delivered

- Added `warlord-walk.png` and `warlord-attack.png`, each a 384x384 sheet with four direction columns and three phase rows.
- Direction order matches dungeon movement: up/northeast, right/southeast, down/southwest, and left/northwest.
- Walk phases are contact A, passing/neutral, and contact B. Attack phases are wind-up, impact, and recovery.
- Integrated automatic Warlord selection from `playerClass`, movement-synchronized walk phases, structured player-combat attack phases, and reduced-motion-safe static phases.
- Generalized Canvas sheet sampling to support explicit rows and columns while preserving existing Adventurer and enemy behavior.
- Added unit coverage for class selection, the sheet contract, and normalized animation phase mapping.

### Asset contract

- Each frame cell is 96x128 RGBA with binary alpha and a maximum of 28 opaque colors.
- Walk frames share foot baseline y=92 with zero bottom spread. Attack wind-up and recovery share y=92; authored impact arcs may extend to y=98.
- Built-in image generation used the existing Warlord atlas for armor, plume, cape, and axe identity and the approved Adventurer facings for projection, scale, and pixel language.
- Mechanical post-processing applied chroma removal, nearest-neighbor normalization, palette reduction without dithering, uniform scale, frame layout, and anchor alignment.

### Validation evidence

- Runtime Canvas sampling confirmed direction source x positions 0, 96, 192, and 288 for up, right, down, and left.
- Every walk and attack direction sampled all three phase rows at source y positions 0, 128, and 256.
- Both production assets returned HTTP 200; browser console had no warnings or errors.
- Pixel-art validation confirmed 384x384 RGBA sheets, 12 frames per sheet, binary alpha, 28 colors, and no clipping.
- `pnpm lint`: passed.
- `pnpm test`: 8 files, 21 tests passed.
- `pnpm playwright test`: 34 tests passed across desktop Chromium and Pixel 5.
- `bundle exec rspec`: 470 examples, 0 failures.
- Compose production build and manual browser inspection passed.

Implementation commit: `3b340a3` (`Add Warlord directional animations`).

## Warlord facing-order correction — completed 2026-08-26

Runtime review found that the Warlord sheets use projected facing columns in NW/SW/SE/NE order, while the renderer incorrectly reused the Adventurer's NE/SE/SW/NW column contract.

### Delivered

- Added a Warlord-specific direction contract: up/NE -> 3, right/SE -> 2, down/SW -> 1, left/NW -> 0.
- Updated Warlord walk and attack sampling without changing creative pixels, frame anchors, palette, or sheet layout.
- Added unit coverage for all four directions and the safe default.

### Validation evidence

- Production Canvas sampling confirmed final source x positions: up 288, right 192, down 96, left 0.
- Browser inspection confirmed the four projected facings, both Warlord PNG requests returned HTTP 200, and the console had no warnings or errors.
- `pnpm lint`: passed.
- `pnpm test`: 8 files, 22 tests passed.
- `pnpm playwright test`: 34 tests passed across desktop Chromium and Pixel 5.
- `bundle exec rspec`: 470 examples, 0 failures.
- Compose production build: passed and services remained healthy.

Implementation commit: `8f4a21c` (`Fix Warlord movement facings`).

## Directional Blademaster animation pack — completed 2026-08-26

The Blademaster now has a production walk/attack presentation derived from the established class atlas instead of falling back to the Adventurer.

### Consolidated character direction

- Elite young duelist built around disciplined speed and precision rather than the Warlord's brute force.
- Lean, forward-ready silhouette; spiky silver-white hair; exposed, focused face.
- Articulated violet-black armor with restrained magenta edging, compact pauldrons, a high collar, and a split coat with two long tails.
- Exactly one narrow pale longsword; no shield, second weapon, or visible magic.
- Economical gait with a low sword carry. Attacks use a fast single cut with readable wind-up, impact, and recovery.

### Delivered

- Added `blademaster-walk.png` and `blademaster-attack.png`, each a 384x384 RGBA sheet with four facing columns and three phase rows.
- Added Blademaster-specific facing order: up/NE -> 0, right/SE -> 1, down/SW -> 2, left/NW -> 3.
- Generalized the class animation renderer so Warlord and Blademaster share frame timing and anchor contracts while retaining independent facing mappings and assets.
- Preserved the Adventurer fallback and existing Warlord behavior.
- Added unit coverage for asset paths, class selection, shared layout, all Blademaster directions, and safe defaults.

### Asset contract and generation

- Cells are 96x128; columns are up/NE, right/SE, down/SW, and left/NW.
- Walk rows are contact A, neutral, and contact B. Attack rows are wind-up, impact, and recovery.
- Every frame shares foot anchor `(48,92)` with zero bottom spread.
- Walk uses 28 opaque colors; attack uses 25 opaque colors. Both use binary alpha, nearest-neighbor normalization, and no dithering.
- Built-in ImageGen used the Blademaster class atlas as the strict identity reference. The approved Warlord sheets supplied only layout, scale, action timing, and pixel-language guidance; Adventurer facings supplied projected direction logic.
- Walk prompt summary: one consistent Blademaster, strict 4x3 sheet, four projected facings, three walk phases, fixed foot anchor, limited palette, exact chroma background, and no extra weapons/effects.
- Attack prompt summary: the same identity and direction order, wind-up/precise-cut/recovery phases, a compact pale blade streak only at impact, fixed anchor/palette, and no identity drift, shield, second weapon, or magic.
- Mechanical post-processing performed chroma removal, row/cell extraction, nearest-neighbor resizing, palette reduction, binary-alpha cleanup, frame translations, and anchor normalization without adding creative pixels.

### Validation evidence

- Runtime Canvas sampling confirmed source x positions 0, 96, 192, and 288 for up, right, down, and left.
- Every walk and attack direction sampled source y positions 0, 128, and 256.
- Both PNGs returned HTTP 200 in Compose; the browser console had no warnings or errors.
- Manual browser inspection approved idle and impact frames in the production dungeon composition.
- `pnpm lint`: passed.
- `pnpm test`: 8 files, 25 tests passed.
- Compose production TypeScript/Vite build: passed.
- `pnpm playwright test`: 34 tests passed across desktop Chromium and mobile.
- `bundle exec rspec`: 470 examples, 0 failures.
- Compose server remained healthy and web remained available at localhost:3000.
- Serena diagnostics were unavailable because the repository Ruby LSP failed to initialize; TypeScript lint and production build supplied diagnostics for the touched frontend files.

Implementation commit: `d49d1a3` (`Add Blademaster directional animations`).
