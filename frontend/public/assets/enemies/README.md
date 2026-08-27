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

### Kobold Sparkmage

The Kobold Sparkmage is a small rust-red reptilian caster with a long toothy
snout, backward head spines, cyan-glowing eyes, ragged leather mage robes, and
small copper charms. Blue-white electricity crawls across both bare claws and
provides a tightly controlled cool accent against the earthy palette. Its Spark
Bolt sequence cups a compact charge between the hands, snaps one claw forward
with an attached lightning flare, and recovers as residual arcs fade. The
non-gory death sequence begins with magical backlash, drains the current while
the kobold falls, and ends in a compact curled pose with no remaining charge.

The production sheets are:

- `kobold_sparkmage-attack.png`;
- `kobold_sparkmage-death.png`.

The sheets passed the shared transparency, limited-palette, cell-boundary, and
ground-anchor checks while keeping every electrical accent inside its frame.

### Gnoll Hunter

The Gnoll Hunter is a tall, lean hyena humanoid with mottled ochre-brown fur, a
dark bristled mane, pointed ears, an amber eye, and a long fanged muzzle. Crude
rawhide and bone gear carries a scratched round wooden shield and a long hunting
spear with a dark leaf-shaped point. Digitigrade clawed feet and a low hunched
posture keep the silhouette predatory. The Hunting Spear sequence loads behind
the shield, reaches into a long protected thrust, and withdraws into guard. The
non-gory death sequence drops both tools as the legs buckle and ends with the
lean body, spear, and shield grounded together.

The production sheets are:

- `gnoll_hunter-attack.png`;
- `gnoll_hunter-death.png`.

The full spear remained inside the attack cells, and both sheets passed the
shared transparency, palette, boundary, and phase-specific ground-anchor checks.

### Gnoll Bonecaller

The Gnoll Bonecaller is a hunched ochre-brown hyena shaman with a dark bristled
mane, long fanged muzzle, worn hide garments, and tooth-and-bone amulets. A
twisted skull focus and sickly emerald spirit flame distinguish both hands. The
Bone Shards sequence raises the focus, forms pale splinters inside the green
energy, casts a short attached fan, and returns to a faint ritual flicker. The
non-gory death sequence suffers magical backlash, sinks to one knee, loses the
focus, and ends with the body and extinguished fetish grounded together.

The production sheets are:

- `gnoll_bonecaller-attack.png`;
- `gnoll_bonecaller-death.png`.

The death sheet was regenerated twice: the first draft touched a cell edge and
the second introduced horizontal anchor drift. The accepted draft preserves
safe padding and a stable torso axis while passing the shared alpha, palette,
boundary, and ground-anchor checks.

### Wight Knight

The Wight Knight is a tall, rigid undead warrior enclosed in blackened
blue-steel plate armor. A pointed closed helm exposes only a narrow violet eye
slit, while a layered gorget, heavy pauldrons, clawed gauntlet, and shredded
near-black purple cloak give the silhouette a funereal weight. Its broad
spectral Graveblade burns with an icy cyan core and magenta-violet edges. The
attack sequence lifts the blade into a deliberate high guard, drives a heavy
diagonal slash, and ends in a low recovery. The non-gory death sequence drains
the spectral light, buckles the knight to one knee, and collapses the empty
armor and cloak beside the extinguished sword.

The production sheets are:

- `wight_knight-attack.png`;
- `wight_knight-death.png`.

Both sheets passed the shared transparency, limited-palette, frame-boundary,
and phase-specific ground-anchor checks after their first production
normalization. Runtime inspection confirmed that the long blade remains inside
the combat cells and that the final armor heap stays fixed to the dungeon floor.

### Ghoul Stalker

The Ghoul Stalker is a feral, deeply hunched undead predator with taut ash-gray
cadaver skin stretched over knotted muscles. A scarred bald skull, sparse
stringy black hair, pointed ears, glowing amber eyes, and a broad mouth of
irregular fangs form its corpse-like face. Disproportionately long arms end in
oversized black claws, while bent legs and clawed feet support an almost
quadrupedal stance beneath ragged brown burial wraps and a decayed hide shroud.
The Rending Claws sequence coils the shoulders, drives a short two-claw lunge,
and withdraws into a low stalking guard. The non-gory death sequence dims the
eyes, buckles the limbs, rolls the body onto one hip, and ends as a compact
curled corpse.

The production sheets are:

- `ghoul_stalker-attack.png`;
- `ghoul_stalker-death.png`.

The death sheet was regenerated once because a claw in the second phase touched
its cell boundary. The accepted sheet restores an internal inset while both
animations pass the shared alpha, palette, boundary, and phase-specific
ground-anchor checks.

### Zombie Brute

The Zombie Brute is a colossal, asymmetrical corpse with leathery gray-brown
skin, a scarred bald head, sparse dark hair, milky eyes, and a broad mouth of
broken yellow teeth. Swollen shoulders feed enormous arms and blocky fists,
while massive bare feet carry its top-heavy frame. A ragged slate-blue tabard,
torn brown trousers and wraps, a heavy belt, and broken iron chains around both
wrists preserve the prison-break silhouette of the original sprite. The Heavy
Slam sequence bends the knees, lifts both fists, drives them down together, and
returns through a weighted recovery. The non-gory death sequence sags, buckles,
topples onto one hip, and settles as a broad lateral corpse with slack chains.

The production sheets are:

- `zombie_brute-attack.png`;
- `zombie_brute-death.png`.

Both sheets passed the shared transparency, limited-palette, cell-boundary, and
phase-specific ground-anchor checks after their first production normalization.
The conservative scale keeps every fist, foot, chain, and cloth strip inside its
animation cell.

### Shadow Imp

The Shadow Imp is a small, wiry fiend with near-black violet reptilian skin, two
tall ridged horns, long pointed ears, luminous magenta eyes, and a grin of thin
sharp teeth. Elongated clawed hands and feet, one prominent ragged bat wing, a
curled tail, torn brown loincloth, and metal wrist and ankle bands create its
agile silhouette. Purple shadow flame clings to the horns, limbs, wing, and tail
without obscuring those features. The Shadow Claw sequence coils the body,
concentrates an attached flame around one hand, rakes forward, and settles back
into a crouch. The non-gory death sequence dims the flame, droops the wing,
folds the limbs, and leaves a compact grounded body with one fading tail ember.

The production sheets are:

- `shadow_imp-attack.png`;
- `shadow_imp-death.png`.

Both sheets passed the shared transparency, limited-palette, frame-boundary,
and phase-specific ground-anchor checks after their first production
normalization. The attached flame remains inside each cell and never becomes a
detached generic combat effect.

### Brimstone Imp

The Brimstone Imp is a small muscular fiend covered in rust-red scales cracked
with ember-orange light. A crown of ridged horns and head spikes frames long
pointed ears, glowing amber eyes, and serrated teeth. Black-tipped claws, one
ragged red bat wing, a burning spined tail, brown wraps, and a skull-charmed
loincloth reinforce its volcanic identity. The Ember Spit sequence draws a
breath, builds a glow behind the teeth, releases a short mouth-attached flame
cone, and recovers with a fading lip wisp. The non-gory death sequence gutters
the hand and tail flames, drops the wing and knees, and finishes as a curled,
fully extinguished body.

The production sheets are:

- `brimstone_imp-attack.png`;
- `brimstone_imp-death.png`.

Both first drafts were regenerated because horns and wing tips reached the top
edge of lower cells. The accepted sheets use a more conservative scale and pass
the shared alpha, palette, boundary, and phase-specific ground-anchor checks
with every flame fully contained.

### Lesser Demon

The Lesser Demon is a tall muscular fiend with dark rust-red scales split by
molten orange veins. Two massive ridged black horns, smaller facial spikes,
glowing orange eyes, and a broad fanged maw dominate its head. One enormous
ragged wing, long black-tipped claws, cloven hooves, a bladed spined tail, iron
bracers, chains, skull trophies, and a torn black loincloth distinguish it from
the smaller imps. The Hellish Claw sequence twists through a heavy anticipation,
lunges into a diagonal body-driven rake, and ends in a low recovery. The
non-gory death sequence dims the molten cracks, drops the wing and knees,
topples the torso, and leaves the horned body grounded beneath the folded wing.

The production sheets are:

- `lesser_demon-attack.png`;
- `lesser_demon-death.png`.

Both sheets passed the shared transparency, limited-palette, cell-boundary, and
phase-specific ground-anchor checks after their first production normalization.
The conservative pose scale keeps the large horns, wing, claws, and bladed tail
inside every cell.

### Forest Sprite

The Forest Sprite is a tiny, wiry fae with warm bark-like skin, amber eyes, a
mischievous smile, enormous pointed ears, and olive leaf hair crowned by twig
antlers. Four translucent pale-gold wings carry leaf-like veins, while layered
foliage, vine cords, wraps, twig-shaped feet, and a short thorny branch focus
complete its woodland silhouette. The Thorn Dart sequence grows a dark thorn at
the focus, snaps forward to release one contained dart, and rebalances in the
air. The non-gory death sequence dims the eyes and wings, descends, folds the
foliage inward, and rests the sprite beside its branch on the floor.

The production sheets are:

- `forest_sprite-attack.png`;
- `forest_sprite-death.png`.

The death sheet was regenerated once because a foot touched the lower edge of
the second cell. The accepted sheet restores safe vertical padding while both
animations pass the shared alpha, palette, boundary, and phase-specific
ground-anchor checks.

### Pixie Trickster

The Pixie Trickster is a tiny feminine fae duelist with warm skin, long pointed
ears, violet eyes, and a sly smile. Short swept purple hair surrounds two curled
blue antennae decorated with gold fittings and blue gems. Four translucent
blue-lilac wings, a blue feather collar, purple petal garments, violet leggings,
curled boots, bells, bangles, and gems create her theatrical silhouette. A slim
silver needle dagger completes the disguise. The Needle Prick sequence coils in
midair, dashes through one fully extended thrust, and recovers into guard. The
non-gory death sequence dims the wings, releases the dagger, descends to both
knees, and settles on one side beside the weapon.

The production sheets are:

- `pixie_trickster-attack.png`;
- `pixie_trickster-death.png`.

The death sheet was regenerated twice: the first draft touched a lower-cell
edge, and the second introduced visible grid separators. The accepted source is
separator-free, restores safe padding, and passes the shared alpha, palette,
boundary, and phase-specific ground-anchor checks.

## Workflow

1. Load the next creature from `data/creatures.yml`.
2. Create an original sprite matching the existing retro fantasy pixel-art direction.
3. Export a transparent PNG.
4. Validate dimensions, alpha channel, and manifest entry.
5. Commit that creature before moving to the next one.
