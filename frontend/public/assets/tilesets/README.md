# Tilesets

## Modular Dungeon Tileset

The browser dungeon renderer uses the PNG sheets in `dungeon/` as a modular 16x16 pixel-art atlas.

The source sheets are copied from `tmp/dungeon/` and kept as transparent spritesheets:

- `walls_floor.png` provides base floor, walls, corners, passages, doors, and structural tiles.
- `Objects.png` provides props such as stairs, loot bags, chests, barrels, crates, keys, and small items.
- `doors_lever_chest_animation.png`, `trap_animation.png`, `fire_animation.png`, and `fire_animation2.png` provide animated or stateful overlays.
- `water_detilazation_v2.png`, `Water_coasts_animation.png`, and the decorative crack sheets provide optional water and decal layers.

`map_renderer.js` maps logical dungeon terrain and entities to `{ sheet, x, y }` cells in this atlas and draws each cell with `imageSmoothingEnabled = false`. Terrain still comes from the Ruby dungeon viewport as runtime symbols:

- `#` wall
- `.` / space open floor
- `?` unrevealed fog

Entities are drawn as overlays after terrain, preserving the existing gameplay model where enemy and loot markers are runtime entities rather than YAML terrain tiles.

## Original Dungeon Tileset

`original-dungeon-tileset.png` is an original AI-generated tileset created for Text Adventures.

It was used by the canvas dungeon renderer as the first visual direction for floor, wall, fog, player, enemy, loot, door, stairs, trap, equipment, altar, and portal tiles.

Important implementation note: this generated image is a concept asset, not a clean fixed-cell spritesheet. The visual grid is readable, but the image dimensions are not an exact clean multiple of the requested `8x4` tile layout. The canvas renderer samples measured gutter-free source rectangles from this checked-in `1254x1254` PNG so black divider pixels do not appear in the dungeon map. It also renders dungeon cells with the same rectangular proportions as the source cells instead of forcing every sprite into a square.

Walls are selected contextually by neighboring terrain so top, side, and corner wall sprites appear in the dungeon instead of repeating a single wall tile everywhere.

Recommended next steps:

- Normalize/crop the sheet into exact tile cells if the asset is regenerated.
- Re-measure the renderer source rectangles if replacing this PNG without normalizing it first.
- Create a `tileset.json` mapping logical symbols and named entities to tile coordinates.
- Add tests that assert every structured dungeon terrain and entity type maps to a valid tile.
- Keep the text map representation available for accessibility and non-canvas inspection.

## Source

- Generated specifically for this repository using the Codex image generation workflow.
- Prompt requested an original pixel-art dungeon tileset inspired only by common retro top-down fantasy dungeon crawler conventions.
- No external RPG Maker tileset was copied or adapted directly.
