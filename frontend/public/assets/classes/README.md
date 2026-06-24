# Class Sprites

`class-spritesheet.png` contains transparent animated chibi pixel-art player class sprites.

- Source size: 1254x1254 px
- Layout: 13 visual pose columns x 16 class rows
- Source frame rectangles are measured at runtime from fixed crop metadata because the generated sheet does not use evenly spaced columns.
- Rows: Adventurer, Blademaster, Dragoon, Nightblade, Arcanist, Druid, Warlord, Duelist, Spellblade, Warden, Skirmisher, Battlemage, Sentinel, Hexblade, Ranger, Mystic
- Columns 0-3: walking down
- Columns 4-6: walking left, with the center frame repeated for the 4-frame cycle
- Columns 7-9: walking right, with the center frame repeated for the 4-frame cycle
- Columns 10-12: walking up, with the center frame repeated for the 4-frame cycle
- Individual first-frame sprite exports are kept in `sprites/` for inspection and future iteration.
