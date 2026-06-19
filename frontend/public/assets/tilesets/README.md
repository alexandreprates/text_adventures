# Tilesets

## Original Dungeon Tileset

`original-dungeon-tileset.png` is an original AI-generated tileset created for Text Adventures.

It is used by the canvas dungeon renderer as the first visual direction for floor, wall, fog, player, enemy, loot, door, stairs, trap, equipment, altar, and portal tiles.

Important implementation note: this generated image is a concept asset, not yet a production-ready spritesheet. The visual grid is readable, but the image dimensions are not an exact clean multiple of the requested `8x4` tile layout. Before wiring it into the canvas renderer, normalize it into a deterministic spritesheet with exact tile bounds, such as `8 columns x 4 rows` using `32x32`, `48x48`, or `64x64` tiles.

Recommended next steps:

- Normalize/crop the sheet into exact tile cells.
- Create a `tileset.json` mapping logical symbols and named entities to tile coordinates.
- Add tests that assert every structured dungeon terrain and entity type maps to a valid tile.
- Keep the text map representation available for accessibility and non-canvas inspection.

## Source

- Generated specifically for this repository using the Codex image generation workflow.
- Prompt requested an original pixel-art dungeon tileset inspired only by common retro top-down fantasy dungeon crawler conventions.
- No external RPG Maker tileset was copied or adapted directly.
