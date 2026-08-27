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

### Orc Raider

The Orc Raider is a stocky, heavily muscled marauder with moss-green skin,
yellow eyes, prominent ivory tusks, and a short dark crest. Worn asymmetrical
leather and iron armor protects the torso, a single spiked pauldron reinforces
the weapon shoulder, and bone trophies hang from the belt. His broad, notched
crescent axe has a wrapped wooden haft and carries most of the silhouette's
weight. The attack sequence plants the stance, lifts the axe overhead, delivers
a decisive diagonal chop, and settles into a low recovery. The non-gory death
sequence loses the axe, buckles at the knees, collapses sideways, and finishes
with the body and weapon grounded together.

The production sheets are:

- `orc_raider-attack.png`;
- `orc_raider-death.png`.

The static sprite remained the strict identity reference. Both generated sheets
passed the shared transparency, palette, frame-boundary, and runtime anchor
checks without requiring a corrective regeneration.

### Orc Berserker

The Orc Berserker is a massive, hunched brute with olive-green skin, ember-red
eyes, large ivory tusks, a scarred roaring face, and a short dark-red crest.
Patched rust-red leather hangs beneath dark iron plates and spikes, while thick
wrappings reinforce the forearms and boots. An enormous chipped two-handed axe
distinguishes him from the lighter Orc Raider. His Frenzied Cleave coils the
torso, drives the axe through a wide horizontal arc, and ends in a deep,
over-rotated recovery. The non-gory death sequence breaks the rage, drops him to
one knee, and topples the heavy body beside the released axe.

The production sheets are:

- `orc_berserker-attack.png`;
- `orc_berserker-death.png`.

The generated sheets preserved the static sprite's feral identity and passed
the shared transparency, palette, frame-boundary, and ground-anchor checks on
their first production normalization.

### Kobold Trapper

The Kobold Trapper is a small, wiry reptilian hunter with rust-red scales, a
long toothy snout, one sharp amber eye, and backward-swept dark head spines. A
ragged hide hood, leather straps, pouches, and a coiled snare rope identify its
profession, while a barbed silver dagger, clawed feet, and long counterbalancing
tail define its quick silhouette. The attack coils low, darts into a fast dagger
thrust, and skids into a guarded recovery. The non-gory death sequence loses the
dagger, folds to the floor, curls the tail inward, and leaves the compact body,
rope, and weapon readable as one grounded composition.

The production sheets are:

- `kobold_trapper-attack.png`;
- `kobold_trapper-death.png`.

Both sheets retained the trapper equipment and passed the shared transparency,
palette, frame-boundary, and phase-specific ground-anchor checks after the first
production normalization.

## Workflow

1. Load the next creature from `data/creatures.yml`.
2. Create an original sprite matching the existing retro fantasy pixel-art direction.
3. Export a transparent PNG.
4. Validate dimensions, alpha channel, and manifest entry.
5. Commit that creature before moving to the next one.
