# Enemy Sprites

This directory contains separated enemy sprites for Text Adventures.

Sprites are created one creature at a time following the order from `data/creatures.yml`. Each completed enemy should have:

- a source file under `sources/`
- a transparent PNG under `sprites/`
- an entry in `enemies.json`
- a dedicated commit

## Completed Sprites

- `basilisk_hatchling`: Basilisk Hatchling
- `brimstone_imp`: Brimstone Imp
- `cave_troll`: Cave Troll
- `dire_wolf`: Dire Wolf
- `dryad_thornweaver`: Dryad Thornweaver
- `fae_blade_dancer`: Fae Blade Dancer
- `forest_sprite`: Forest Sprite
- `ghoul_stalker`: Ghoul Stalker
- `giant_spider`: Giant Spider
- `gnoll_bonecaller`: Gnoll Bonecaller
- `gnoll_hunter`: Gnoll Hunter
- `goblin_hexer`: Goblin Hexer
- `goblin_skirmisher`: Goblin Skirmisher
- `hill_giant_youth`: Hill Giant Youth
- `hobgoblin_soldier`: Hobgoblin Soldier
- `kobold_sparkmage`: Kobold Sparkmage
- `kobold_trapper`: Kobold Trapper
- `lesser_demon`: Lesser Demon
- `lizardfolk_scout`: Lizardfolk Scout
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
- `yuan_ti_cutthroat`: Yuan-ti Cutthroat
- `zombie_brute`: Zombie Brute

## Workflow

1. Load the next creature from `data/creatures.yml`.
2. Create an original sprite matching the existing retro fantasy pixel-art direction.
3. Export a transparent PNG.
4. Validate dimensions, alpha channel, and manifest entry.
5. Commit that creature before moving to the next one.
