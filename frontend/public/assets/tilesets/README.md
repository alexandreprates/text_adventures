# Tilesets

## Original Dungeon Tileset

`original-dungeon-tileset.png` is an original AI-generated tileset created for Text Adventures.

It is used by the canvas dungeon renderer as the first visual direction for floor, wall, fog, player, enemy, loot, door, stairs, trap, equipment, altar, and portal tiles.

Important implementation note: this generated image is a concept asset, not a clean fixed-cell spritesheet. The visual grid is readable, but the image dimensions are not an exact clean multiple of the requested `8x4` tile layout. The canvas renderer samples measured gutter-free source rectangles from this checked-in `1254x1254` PNG so black divider pixels do not appear in the dungeon map.

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
