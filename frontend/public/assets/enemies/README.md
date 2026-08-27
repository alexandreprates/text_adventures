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

### Satyr Duelist

The Satyr Duelist is a lean athletic fae with warm tan skin, swept dark-brown
hair, matching sideburns and goatee, pointed ears, amber eyes, and two large
segmented ram horns. An ornate brown leather vest and bracers carry gold
scrollwork above rolled pale sleeves, layered belts, and a long gold-trimmed
purple sash. Shaggy goat legs, cloven hooves, and a slim silver rapier with an
engraved round guard finish the confident silhouette. The Rapier Flourish
sequence circles into a compact high guard, extends through a straight lunge,
and returns to balance. The non-gory death sequence lowers the blade, buckles
the goat legs, drops onto one hip, and rests beside the grounded rapier.

The production sheets are:

- `satyr_duelist-attack.png`;
- `satyr_duelist-death.png`.

Both sheets passed the shared transparency, limited-palette, frame-boundary,
and phase-specific ground-anchor checks after their first production
normalization. The long rapier and trailing sash remain fully contained in
every cell.

### Dryad Thornweaver

The Dryad Thornweaver is a lithe female tree spirit whose copper-brown bark
forms a humanoid body beneath luminous yellow-green eyes, pointed ears, and a
crown of bare branching antlers. Tangled olive foliage, small white flowers,
and a layered leaf skirt soften the silhouette around rooted claw-like feet,
an elongated branch-claw, and a living thorn whip coiled in her right hand.
The Thorn Lash sequence settles into a guarded crouch, winds the whip through a
compact overhead loop, snaps it horizontally toward screen-left, and recovers
to the shared footing. The non-gory death sequence weakens her stance, drops
her onto both knees, carries her sideways with settling branches, and ends in a
low motionless silhouette with darkened eyes.

The production sheets are:

- `dryad_thornweaver-attack.png`;
- `dryad_thornweaver-death.png`.

Both sheets use four 128x128 frames in a 2x2, left-to-right then top-to-bottom
layout. Several drafts were rejected for clipped vines, inter-cell bleed, and
undersized silhouettes. The accepted sheets preserve native-size readability,
safe transparent padding, binary alpha, a 32-color RGBA palette, stable phase
anchors, and fully contained crowns, leaves, claws, and whip arcs.

### Fae Blade Dancer

The Fae Blade Dancer is an athletic female fae with warm tan skin, bright blue
eyes, very long pointed ears, and voluminous violet hair. Four translucent
blue-lilac insect wings rise behind ornate deep-blue and silver leaf-filigree
armor, while purple-gold ribbon streamers trail around bark-brown armored legs.
Two matching silver crescent blades with blue gems complete the fast, balanced
silhouette. The Spiral Slash sequence establishes a dual-blade guard, winds the
torso and ribbons into a compact turn, releases a broad moonlit spinning cut,
and brakes through the wings into recovery. The non-gory death sequence loses
lift, drops onto one knee as a blade slips free, falls sideways with folding
wings, and rests with both weapons grounded and the eyes dark.

The production sheets are:

- `fae_blade_dancer-attack.png`;
- `fae_blade_dancer-death.png`.

Both sheets use four 128x128 frames in a 2x2, left-to-right then top-to-bottom
layout. The first death draft was rejected because the final blade left only a
single transparent pixel at the cell edge. The accepted revision restores safe
padding while preserving all four wing identities, both crescent blades,
binary alpha, a 32-color RGBA palette, and phase-specific baselines.

### Dire Wolf

The Dire Wolf is an enormous low-slung predator with charcoal-gray and
deep-brown fur, a heavy black-brown spiked mane running over its head,
shoulders, and spine, fierce amber eyes, and pale gray-beige markings over the
brows, muzzle, and powerful forelegs. A broad black nose, ivory teeth,
oversized splayed paws, long black claws, dark hindquarters, and a thick heavy
tail reinforce the threatening quadruped silhouette. The Pounce sequence sinks
into a stalking crouch, compresses the hind legs, launches screen-left with
jaws and forepaws extended, and lands in a braced recovery. The non-gory death
sequence staggers, lowers the chest as the forelegs buckle, curls onto one side,
and settles fully grounded with eyes closed and the tail relaxed.

The production sheets are:

- `dire_wolf-attack.png`;
- `dire_wolf-death.png`.

Both sheets use four 128x128 frames in a 2x2, left-to-right then top-to-bottom
layout. The first death draft was rejected because the third-frame tail crossed
the vertical cell boundary. The accepted revision curls that tail against the
hindquarters and passes the shared binary-alpha, limited-palette, safe-padding,
quadruped-topology, and phase-specific baseline checks.

### Owlbear Cub

The Owlbear Cub is a compact juvenile predator with a hulking russet-brown
bear body beneath a dense mantle of layered tawny owl feathers. A round
cream-and-cinnamon facial disk frames fierce amber eyes, pointed ear tufts, and
a glossy black hooked beak, while thick muscular legs end in broad splayed paws
and oversized black claws. The Beak Snap sequence crouches into anticipation,
opens the beak as the shoulders compress, lunges through a forceful snapping
impact, and recoils into its shared stance. The non-gory death sequence flinches
on all four legs, buckles through the forequarters, rolls onto one side, and
settles into a compact motionless rest with closed eyes.

The production sheets are:

- `owlbear_cub-attack.png`;
- `owlbear_cub-death.png`.

Both sheets use four 128x128 frames in a 2x2, left-to-right then top-to-bottom
layout. Multiple attack drafts were rejected for unsafe padding, an ambiguous
far hind leg, and an open beak at the intended snap impact; two death drafts
were rejected for merged limbs and insufficient edge clearance. The accepted
sheets preserve four visibly distinct connected paws in every frame, feather
and facial identity, binary alpha, 32-color RGBA palettes, at least 10 pixels
of cell padding, fixed-cell containment, and phase-specific baselines.

### Cave Troll

The Cave Troll is an enormous hunched brute whose gray stone-like skin forms
irregular boulder scales, knobs, and small dorsal spikes around a coarse
black-brown mane. Narrow amber eyes, pointed ears, a broad flattened nose, two
long ivory lower tusks, massive shoulders, elongated clawed arms, thick bent
legs, and wide three-toed feet reinforce the low heavy silhouette. Ragged hide
and rope wrappings, a bone-and-skull necklace, and a knotted wooden club with a
bulbous spiked head complete the cavern scavenger. The Club Smash sequence
holds a low diagonal guard, raises the club overhead in both hands, drives it
down toward screen-left, and recovers into the original crouch. The non-gory
death sequence staggers while gripping the club, buckles and releases it,
collapses onto one side, and rests motionless beside the grounded weapon.

The production sheets are:

- `cave_troll-attack.png`;
- `cave_troll-death.png`.

Both sheets use four 128x128 frames in a 2x2, left-to-right then top-to-bottom
layout. The first attack draft and first two death normalizations were rejected
for border contact, inconsistent scale, and an unintended mouth color. The
accepted sheets preserve two-arm/two-leg anatomy, one continuous spiked club,
binary alpha, 30/31-color RGBA palettes, at least 6 pixels of cell padding, and
phase-specific baselines. The death cells received one shared conservative
nearest-neighbor scale and fixed padding pass after visual approval.

### Hill Giant Youth

The Hill Giant Youth is a towering young humanoid with a broad, heavily muscled
frame, weathered tan-ochre skin, a stern square face beneath a heavy brow,
pointed ears, and a shaggy dark-brown mane with two beaded front braids. A
stitched ragged hide tunic and rough shoulder pelt cover the torso, while rope
belts and wraps, a leather pouch, a tooth necklace, and oversized bare
five-toed feet reinforce the primitive hill-raider identity. The giant carries
one immense two-handed maul made from a wooden trunk capped by a single
irregular gray boulder lashed in thick rope. The Boulder Swing sequence moves
from a low diagonal guard through a high two-handed wind-up, a compressed
down-left ground impact, and a low recovery. The non-gory death sequence
staggers with the weapon dropping, buckles onto one knee, collapses onto one
side beside the released maul, and settles into a compact motionless rest.

The production sheets are:

- `hill_giant_youth-attack.png`;
- `hill_giant_youth-death.png`.

Both sheets use four 128x128 frames in a 2x2, left-to-right then top-to-bottom
layout. The first death draft was rejected because its boulder crossed the
vertical cell boundary. The accepted sheets preserve two-arm/two-leg anatomy,
one continuous boulder-maul, binary alpha, 30 opaque colors plus transparency,
and phase-specific baselines. A shared conservative nearest-neighbor scale to
120x120 inside each fixed 128x128 cell raised the minimum padding to 6 pixels
without changing frame content or relative attack/death scale.

### Minotaur Guardian

The Minotaur Guardian is a massive bull-headed sentinel covered in dense
dark-brown fur with a thick black-brown mane and beard, fierce amber eyes, a
broad bovine muzzle pierced by a gold nose ring, two long symmetrical
ivory-brown horns, pointed bull ears, cloven hooves, and one visible tufted
tail. Heavy aged-bronze armor engraved with angular labyrinth motifs protects
the chest, asymmetric right shoulder, forearms, belt, and lower legs above a
layered leather war skirt. One ceremonial long-shafted labyrinth axe carries
an elaborate double-bladed steel head with bronze geometric fittings. The Horn
Gore sequence moves from an axe-forward guard through a compressed head-lowering
anticipation, a short down-left horn charge with the axe drawn behind the
shoulder, and a braking recovery. The non-gory death sequence staggers with the
axe dropping, buckles onto one knee, collapses onto one armored side, and rests
motionless beside the released weapon.

The production sheets are:

- `minotaur_guardian-attack.png`;
- `minotaur_guardian-death.png`.

Both sheets use four 128x128 frames in a 2x2, left-to-right then top-to-bottom
layout. Attack drafts were rejected for detached impact debris, hoof pixels
crossing the horizontal cell boundary, and global scale drift during a repair.
The accepted sheets preserve two horns, two-arm/two-leg anatomy, one connected
tail, one continuous labyrinth axe, binary alpha, 31/30 opaque colors, at least
6 pixels of cell padding, and phase-specific baselines. Both sheets received
the same conservative nearest-neighbor scale to 116x116 inside fixed 128x128
cells so attack and death retain a shared runtime scale.

### Ogre Marauder

The Ogre Marauder is an enormous hunched brute with pale olive-beige warty
skin, massively muscled long arms, oversized hands, broad bare five-toed feet,
a mostly bald knobbled scalp beneath a swept-back dark-brown crest, pointed
ears, amber eyes, a flattened nose, two long lower ivory tusks, and uneven
smaller teeth. A ragged brown leather-and-fur tunic, torn rust-red loincloth,
diagonal spiked leather harness, heavy bracers, belt pouches, bone charms, and
a skull pendant reinforce the marauder identity. One two-handed maul combines
a leather-wrapped wooden shaft with a single irregular gray boulder locked
inside a riveted, spiked dark-iron cage. The Maul Swing sequence moves from a
low guard through a two-handed overhead wind-up, a compressed down-left ground
impact, and a low recovery. The non-gory death sequence staggers while losing
the weapon, buckles onto one knee, collapses onto one side beside the released
maul, and settles into a compact motionless rest.

The production sheets are:

- `ogre_marauder-attack.png`;
- `ogre_marauder-death.png`.

Both sheets use four 128x128 frames in a 2x2, left-to-right then top-to-bottom
layout. The first attack draft was rejected because the recovery maul crossed
the vertical cell boundary. Death drafts were rejected for multiple cell
boundary crossings, an over-shrunk global repair that broke attack/death scale,
and remaining top-right and bottom-left composition overflows. The accepted
sheets preserve two-arm/two-leg anatomy, two lower tusks, one continuous
boulder-maul, binary alpha, 30 opaque colors plus transparency, at least 6
pixels of production-cell padding, and phase-specific baselines. Both sheets
received the same conservative nearest-neighbor scale to 116x116 inside fixed
128x128 cells so attack and death retain a shared runtime scale.

### Lizardfolk Scout

The Lizardfolk Scout is an athletic upright reptile with olive-ochre scales
broken by dark slate plate markings, a broad low snout, one visible amber
slit-pupil eye beneath a ridged brow, and a swept line of brown-gold hornlike
spines running from the skull down the back and long muscular tail. Digitigrade
legs end in broad clawed feet, while weathered brown leather armor combines a
heavy right pauldron, diagonal buckled chest harness, bracers, ragged waist
panels, and wrapped lower legs. One long wooden javelin carries a lashed angular
gray spearhead and fiber ties. One round wooden shield has a rope-bound rim,
pale chevron-and-diamond pattern, and central iron boss. The Javelin Thrust
sequence moves from a low shield-forward guard through a braced draw-back, a
forceful low lunge toward down-left, and a controlled recovery. The non-gory
death sequence staggers with the guard failing, buckles onto one knee as the
equipment slips free, collapses onto one side, and rests motionless beside the
intact released javelin and shield.

The production sheets are:

- `lizardfolk_scout-attack.png`;
- `lizardfolk_scout-death.png`.

Both sheets use four 128x128 frames in a 2x2, left-to-right then top-to-bottom
layout. Attack drafts were rejected for a tail crossing the vertical cell
boundary and ambiguous or detached spear-arm anatomy. The first death draft
was rejected because the opening javelin disappeared and the final released
spear crossed into the neighboring cell. The accepted sheets preserve two-arm/
two-leg anatomy, one connected tail, one continuous javelin, one round shield,
binary alpha, 31/30 opaque colors, at least 7 pixels of cell padding, and exact
phase-specific baselines. Both sheets received the same conservative
nearest-neighbor scale to 120x120 inside fixed 128x128 cells so attack and death
retain a shared runtime scale.

### Naga Apprentice

The Naga Apprentice has a feminine scaled humanoid upper torso, exactly two
clawed arms, and no legs above one long dark bronze-olive serpent body looped
into a broad ground coil, with pale segmented belly plates and one curling tail
tip. Her refined dragonlike face has amber eyes, a swept crown of hornlike
gold-brown head fins, a blue diamond forehead gem, and dark indigo-black back
fins or hair bound with gold beads and torn purple ribbons. Layered violet
robes with narrow gold trim form a crossed bodice, tattered sleeve scarves, and
ragged skirt panels around gold armbands, bracers, an ornate blue-gem belt and
collar, and several potion vials. Cyan-white arcane flame gathers above one
open palm. The Arcane Fang sequence moves from a guarded flame through a
two-handed concentration, launches one spectral serpent-fang bolt down-left,
and returns to a controlled magical guard. The non-gory death sequence recoils
as the flame gutters, slumps over the planted coil, collapses onto one side as
the coil loosens, and rests motionless with the torso folded across the tail.

The production sheets are:

- `naga_apprentice-attack.png`;
- `naga_apprentice-death.png`.

Both sheets use four 128x128 frames in a 2x2, left-to-right then top-to-bottom
layout. The first generated drafts passed the visual topology gate: every frame
preserves exactly two connected arms, zero legs, one natural torso-to-tail
junction, one continuous coil, one tail tip, stable gems and clothing, and
magic that remains distinct from anatomy. The shared conservative
nearest-neighbor scale to 116x116 inside fixed 128x128 cells raised the attack
impact's two-source-pixel margin to 6 production pixels without changing
content or relative scale. The accepted sheets use binary alpha, 31 opaque
colors, at least 6/9 pixels of attack/death padding, and exact phase-specific
baselines.

### Yuan-ti Cutthroat

The Yuan-ti Cutthroat is a hooded serpent assassin with an olive-bronze scaled
humanoid torso, exactly two clawed arms, and no legs above one heavy snake body
coiled on the ground, its pale tan belly plates ending in a single curled tail
tip. A long narrow reptilian face peers from a charcoal-black hood with one
visible amber slit-pupil eye and a short purple forked tongue. A torn
gold-trimmed cowl and layered split tunic sit beneath brown leather straps,
buckles, belts, and bracers. An angular gold belt emblem, one attached green
poison vial, and one brown pouch accompany exactly one broad curved silver
knife with a wavy engraved groove, ornate gold guard, and ring pommel. The
Venom Knife sequence moves from a low guard through an overhead wind-up, a
short low cut toward down-left, and a controlled recovery. The non-gory death
sequence staggers with the knife lowering, slumps over the coil as the weapon
slips free, collapses onto one side, and rests motionless beside the intact
released knife.

The production sheets are:

- `yuan_ti_cutthroat-attack.png`;
- `yuan_ti_cutthroat-death.png`.

Both sheets use four 128x128 frames in a 2x2, left-to-right then top-to-bottom
layout. The first attack draft was rejected because detached green venom
streaks obscured the otherwise clean knife impact. The accepted attack and
first death draft preserve exactly two connected arms, zero legs, one natural
torso-to-tail junction, one continuous coil, one tail tip, one curved knife,
and stable poison vial and pouch details. Both sheets received the same
conservative nearest-neighbor scale to 116x116 inside fixed 128x128 cells. The
production results use binary alpha, 31 opaque colors, at least 9/7 pixels of
attack/death padding, shared runtime scale, and exact phase-specific baselines.

### Basilisk Hatchling

The Basilisk Hatchling is a squat six-legged reptile with three pairs of broad
clawed feet, a low armored body, and one thick muscular tail curled upward into
a tight loop. Overlapping dark olive-gray scales cover its back and limbs like
weathered stone plates, while pale bronze-tan segments protect the throat and
underside. Its wedge-shaped head ends in a hooked stone-hard beak above a
tooth-lined jaw and dark tongue, with one visible amber slit-pupil eye beneath
a heavy brow. Uneven hornlike brown spikes frame the forehead and cheeks, rise
into a tall jagged dorsal ridge, and taper along the back and tail. The Stone
Beak sequence moves from a low stalking guard through a raised-head recoil, a
short snapping strike toward down-left, and a braced recovery. The non-gory
death sequence staggers, buckles as all three leg pairs give way, collapses
onto one side, and rests motionless with the armored head and curled tail
settled on the ground.

The production sheets are:

- `basilisk_hatchling-attack.png`;
- `basilisk_hatchling-death.png`.

Both sheets use four 128x128 frames in a 2x2, left-to-right then top-to-bottom
layout. The first attack draft passed visual review. The first death draft was
rejected because the second pose touched its cell boundary; a focused image
edit restored generous separation without changing the approved sequence.
The accepted sheets preserve exactly six legs, one head, one continuous tail,
stable stone scales and dorsal spikes, and a shared nearest-neighbor scale of
116x116 inside fixed 128x128 cells. The production results use binary alpha,
31/29 opaque colors, at least 11/9 pixels of attack/death padding, shared
runtime scale, and exact phase-specific baselines.

## Workflow

1. Load the next creature from `data/creatures.yml`.
2. Create an original sprite matching the existing retro fantasy pixel-art direction.
3. Export a transparent PNG.
4. Validate dimensions, alpha channel, and manifest entry.
5. Commit that creature before moving to the next one.
