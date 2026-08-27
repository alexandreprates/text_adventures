# Enemy Sprites

This directory contains separated enemy sprites for Text Adventures.

Sprites are created one creature at a time following the order from `data/creatures.yml`. Each completed enemy should have:

- a source file under `sources/`
- a transparent PNG under `sprites/`
- an entry in `enemies.json`
- a dedicated commit

## Completed Sprites

- `air_elemental_ling`: Air Elemental Ling
- `basilisk_hatchling`: Basilisk Hatchling
- `brimstone_imp`: Brimstone Imp
- `cave_troll`: Cave Troll
- `crystal_golem`: Crystal Golem
- `cursed_paladin`: Cursed Paladin
- `dark_elf_arcanist`: Dark Elf Arcanist
- `dark_elf_assassin`: Dark Elf Assassin
- `dire_wolf`: Dire Wolf
- `dragon_wyrmling`: Dragon Wyrmling
- `dryad_thornweaver`: Dryad Thornweaver
- `dwarven_ghost`: Dwarven Ghost
- `earth_elemental_ling`: Earth Elemental Ling
- `elemental_spark`: Elemental Spark
- `enchanted_armor`: Enchanted Armor
- `fae_blade_dancer`: Fae Blade Dancer
- `fire_elemental_ling`: Fire Elemental Ling
- `forest_sprite`: Forest Sprite
- `ghoul_stalker`: Ghoul Stalker
- `giant_spider`: Giant Spider
- `gnoll_bonecaller`: Gnoll Bonecaller
- `gnoll_hunter`: Gnoll Hunter
- `goblin_hexer`: Goblin Hexer
- `goblin_skirmisher`: Goblin Skirmisher
- `griffin_fledgling`: Griffin Fledgling
- `harpy_screecher`: Harpy Screecher
- `hill_giant_youth`: Hill Giant Youth
- `hobgoblin_soldier`: Hobgoblin Soldier
- `ice_elemental_ling`: Ice Elemental Ling
- `kobold_sparkmage`: Kobold Sparkmage
- `kobold_trapper`: Kobold Trapper
- `lesser_demon`: Lesser Demon
- `lich_acolyte`: Lich Acolyte
- `lizardfolk_scout`: Lizardfolk Scout
- `manticore_whelp`: Manticore Whelp
- `minotaur_guardian`: Minotaur Guardian
- `naga_apprentice`: Naga Apprentice
- `ogre_marauder`: Ogre Marauder
- `orc_berserker`: Orc Berserker
- `orc_raider`: Orc Raider
- `owlbear_cub`: Owlbear Cub
- `pixie_trickster`: Pixie Trickster
- `satyr_duelist`: Satyr Duelist
- `shadow_imp`: Shadow Imp
- `skeleton_archer`: Skeleton Archer
- `skeleton_guard`: Skeleton Guard
- `wight_knight`: Wight Knight
- `wyvern_juvenile`: Wyvern Juvenile
- `yuan_ti_cutthroat`: Yuan-ti Cutthroat
- `zombie_brute`: Zombie Brute

## Animated Sprites

Enemy action sheets use a shared production contract:

- separate attack and death RGBA PNGs;
- `256x256` sheets arranged as a `2x2` grid;
- four phases read left-to-right, then top-to-bottom;
- `128x128` frames with binary alpha and at most 32 opaque colors;
- per-phase ground baselines recorded by the renderer.

### Giant Spider

The Giant Spider is a massive cave arachnid with a low, forward-facing
silhouette. Its oval abdomen is segmented into dark-brown armor plates above
an almost black cephalothorax. Eight angular legs carry copper-brown joint
highlights, while ivory chelicerae frame a dense cluster of threatening
ruby-red eyes. The attack animation raises the forelegs, coils the body into a
short bite lunge, reaches decisive contact, and returns to a planted stance.
The non-gory death animation contracts the legs, lowers the body, rolls the
weight sideways, and finishes as a readable curled corpse.

The production sheets are:

- `giant_spider-attack.png`;
- `giant_spider-death.png`.

The original static sprite was the strict identity reference. The sheets were
created with the built-in image-generation workflow, regenerated to correct
cell clipping and anchor drift, then normalized mechanically with hard chroma
removal, nearest-neighbor resizing, binary alpha, and non-dithered palette
quantization.

## Workflow

1. Load the next creature from `data/creatures.yml`.
2. Create an original sprite matching the existing retro fantasy pixel-art direction.
3. Export a transparent PNG.
4. Validate dimensions, alpha channel, and manifest entry.
5. Commit that creature before moving to the next one.
