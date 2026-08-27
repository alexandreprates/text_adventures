# Isometric Actor Sprites

## Hexblade

The Hexblade is a lean young curse assassin whose visible pale face, glowing
violet eyes, and spiky black hair with magenta tips remain readable beneath a
thorned high collar. Fitted black and deep-violet light armor, jagged shoulder
plates, and short ragged coat tails establish an agile silhouette. The
character carries exactly one compact obsidian long dagger with a violet
cursed edge, while the empty free hand contains a small violet-and-cyan curse
wisp. This design combines dagger mastery and combat magic without repeating
the hooded dual-weapon Nightblade or the pale-haired straight-sword Spellblade.

The Hexblade animation assets are:

- `hexblade-walk.png`: agile walk phase A, neutral passing pose, and walk phase
  B with the blade held low and the palm curse tightly contained.
- `hexblade-attack.png`: coiled preparation, a compact diagonal cursed cut with
  an attached violet arc, and balanced recovery with nearby fading fragments.

Both files use the shared directional actor contract:

- `384x384` RGBA PNG;
- `4` columns ordered up, right, down, left;
- `3` animation rows;
- `96x128` frames;
- local foot baseline at `y=92`;
- binary alpha and a 32-color opaque palette.

The original artwork was created with the built-in image generation workflow,
using the checked-in Hexblade class atlas as the strict identity reference and
the existing Nightblade and Spellblade directional actors only as compact
motion, layout, and restrained-magic references. Walk and attack were generated
in separate passes. Production files were normalized mechanically with
nearest-neighbor resizing, hard chroma-key removal, sheet-level empty-margin
cropping, fixed per-cell padding, row-preserving baseline alignment, binary
alpha, and non-dithered palette quantization.

## Sentinel

The Sentinel is a stocky spear-and-nature guardian whose defensive silhouette
is defined by a closed indigo helmet with a narrow antique-gold visor, a dark
blue plume, royal-indigo and violet full plate, plum shadows, thick gold-orange
edging, and a short navy cape bearing a solar-leaf emblem. The character
carries exactly one red-gold medium spear with a pale-lilac triangular point
and one compact indigo kite shield marked by a gold solar-beast crest.
Restrained amber leaf and sap light expresses nature magic without weakening
the disciplined shield wall inherited from the legacy atlas.

The Sentinel animation assets are:

- `sentinel-walk.png`: planted armored walk phase A, neutral passing pose, and
  walk phase B with the shield guarding the torso and spear held close.
- `sentinel-attack.png`: braced preparation, a compact shielded spear thrust
  with attached amber nature light, and guarded recovery with fading leaves.

Both files use the shared directional actor contract:

- `384x384` RGBA PNG;
- `4` columns ordered up, right, down, left;
- `3` animation rows;
- `96x128` frames;
- local foot baseline near `y=92`;
- binary alpha and a 32-color opaque palette.

The original artwork was created with the built-in image generation workflow,
using the checked-in Sentinel class atlas as the identity reference and the
existing Warden and Dragoon directional actors as shield, layout, and polearm
handling references. Production files were normalized mechanically with
nearest-neighbor resizing, hard chroma-key removal, sheet-level empty-margin
cropping, fixed per-cell padding, row-preserving baseline alignment, binary
alpha, and non-dithered palette quantization.

## Battlemage

The Battlemage is a young arcane lancer whose compact martial silhouette pairs
tousled white hair with pale-lilac shadows, a visible focused face, deep
indigo-black plated coat armor, plum-magenta shadows, antique-gold piping,
rounded pauldrons, and a split dark mantle. He carries exactly one ornate
red-gold spear-catalyst crowned by a faceted icy-cyan crystal. The design
combines disciplined spearmanship with contained combat magic rather than the
Dragoon's ceremonial reach or the Arcanist's dedicated spellcasting posture.

The Battlemage animation assets are:

- `battlemage-walk.png`: controlled walk phase A, neutral passing pose, and
  walk phase B with the spear-catalyst held close and stable.
- `battlemage-attack.png`: guarded preparation, a compact crystal-led thrust
  with a contained cyan arcane flare, and balanced recovery with fading motes.

Both files use the shared directional actor contract:

- `384x384` RGBA PNG;
- `4` columns ordered up, right, down, left;
- `3` animation rows;
- `96x128` frames;
- local foot baseline near `y=92`;
- binary alpha and a 32-color opaque palette.

The original artwork was created with the built-in image generation workflow,
using the checked-in Battlemage class atlas as the identity reference and the
existing Dragoon and Arcanist directional actors as layout, polearm-handling,
and restrained-magic references. Production files were normalized mechanically
with nearest-neighbor resizing, hard chroma-key removal, fixed per-cell
padding, row-preserving baseline alignment, binary alpha, and non-dithered
palette quantization.

## Skirmisher

The Skirmisher is a lean young front-line scout whose low athletic silhouette
combines unruly dark wine-red hair, a visible focused face, crimson and oxblood
flexible armor, compact rounded shoulder plates, charcoal leather, and crossed
back straps. The character carries exactly one compact leaf-bladed short spear
for reach control and one straight parrying dagger for close pressure. This
design balances spearmanship and dagger mastery without the Dragoon's heavy
ceremonial armor or the Nightblade's hooded stealth language.

The Skirmisher animation assets are:

- `skirmisher-walk.png`: light walk phase A, neutral passing pose, and walk
  phase B with both weapons controlled close to the body.
- `skirmisher-attack.png`: low guarded preparation, a compact advancing dagger
  check while the short spear controls reach, and a balanced recovery.

Both files use the shared directional actor contract:

- `384x384` RGBA PNG;
- `4` columns ordered up, right, down, left;
- `3` animation rows;
- `96x128` frames;
- local foot baseline near `y=92`;
- binary alpha and a 32-color opaque palette.

The original artwork was created with the built-in image generation workflow,
using the checked-in Skirmisher class atlas as the identity reference and the
existing Nightblade and Dragoon directional actors as style, scale, and weapon
handling references. Production files were normalized mechanically with
nearest-neighbor resizing, hard chroma-key removal, fixed per-cell padding,
row-preserving baseline alignment, binary alpha, and non-dithered palette
quantization.

## Warden

The Warden is a stocky petrified-forest knight whose defensive silhouette is
defined by a closed helmet with a short crest, heavy purple-black full plate,
magenta-plum shadows, antique-gold edging, and a dark cape. The character
carries exactly one short silver-lilac sword and one rectangular shield marked
by an amber tree rune. Restrained moss-green pinpoints and sap-colored light
connect the design to nature magic without weakening the disciplined armored
identity inherited from the legacy atlas.

The Warden animation assets are:

- `warden-walk.png`: heavy walk phase A, neutral passing pose, and walk phase B
  with the sword carried close and the shield guarding the torso.
- `warden-attack.png`: rooted defensive preparation, compact enchanted
  short-sword contact, and recovery behind the shield with fading amber motes.

Both files use the shared directional actor contract:

- `384x384` RGBA PNG;
- `4` columns ordered up, right, down, left;
- `3` animation rows;
- `96x128` frames;
- local foot baseline near `y=92`;
- binary alpha and a 32-color opaque palette.

The original artwork was created with the built-in image generation workflow,
using the checked-in Warden class atlas as the identity reference and the
existing directional armored actors as style and layout references. Production
files were normalized mechanically with nearest-neighbor resizing, hard
chroma-key removal, row-preserving baseline alignment, binary alpha, and
non-dithered palette quantization.

## Spellblade

The Spellblade is a lean young arcane swordsman whose compact silhouette pairs
short windswept white-lilac hair with fitted black and midnight-purple coat
armor, dark-plum plates, restrained magenta-red trim, and a split navy cape
marked by subtle cyan runes. He carries exactly one straight silver-cyan sword
and sustains a small spellflame in his free hand. The design balances agile
swordsmanship with disciplined combat magic rather than heavy armor or
long-range spellcasting.

The Spellblade animation assets are:

- `spellblade-walk.png`: measured walk phase A, neutral passing pose, and walk
  phase B with the sword carried low and the off-hand spellflame contained.
- `spellblade-attack.png`: close guarded preparation, compact enchanted
  diagonal cut, and controlled recovery with fading cyan motes.

Both files use the shared directional actor contract:

- `384x384` RGBA PNG;
- `4` columns ordered up, right, down, left;
- `3` animation rows;
- `96x128` frames;
- local foot baseline near `y=92`;
- binary alpha and a 32-color opaque palette.

The original artwork was created with the built-in image generation workflow,
using the checked-in Spellblade class atlas as the identity reference and the
Blademaster and Arcanist directional sheets as style and layout references.
Production files were normalized mechanically with nearest-neighbor resizing,
hard chroma-key removal, row-preserving baseline alignment, binary alpha, and
non-dithered palette quantization.

## Arcanist

The Arcanist is a poised scholarly battle mage whose silhouette combines long
coral-pink hair, a layered royal-indigo and midnight-violet robe, compact
violet shoulder armor, restrained antique-gold filigree, and one short ornate
staff crowned by a faceted cyan-blue crystal. Her upright stance and controlled
gestures emphasize disciplined arcane study and precise spellcraft rather than
melee strength or uncontrolled magical spectacle.

The Arcanist animation assets are:

- `arcanist-walk.png`: measured walk phase A, neutral passing pose, and walk
  phase B with the staff held steady beside the body.
- `arcanist-attack.png`: guarded preparation, compact free-hand spell release,
  and controlled recovery with the staff kept upright.

Both files use the shared directional actor contract:

- `384x384` RGBA PNG;
- `4` columns ordered up, right, down, left;
- `3` animation rows;
- `96x128` frames;
- local foot baseline near `y=92`;
- binary alpha and a 32-color opaque palette.

The original artwork was created with the built-in image generation workflow,
using the checked-in Arcanist class atlas as the identity reference and the
existing directional actors as style and layout references. Production files
were normalized mechanically with nearest-neighbor resizing, hard chroma-key
removal, row-preserving baseline alignment, binary alpha, and non-dithered
palette quantization.

## Nightblade

The Nightblade is a lean ambidextrous assassin whose low silhouette is defined
by a deep hood, a ragged split cloak, and two matching curved daggers held in
reverse grip. The face remains almost entirely hidden except for narrow
ember-magenta eyes. Layered midnight-black and indigo leather, dark-violet
plates, crimson-magenta straps, fitted bracers, and pale lilac-silver blades
balance stealth with enough edge contrast to remain readable in the dungeon.
The visual language emphasizes silence, close-range pressure, and controlled
lethality rather than magic or theatrical shadow effects.

The Nightblade animation assets are:

- `nightblade-walk.png`: stealth-walk phase A, neutral guarded passing pose,
  and stealth-walk phase B with both daggers held close.
- `nightblade-attack.png`: crossed preparation, decisive advancing dual strike,
  and low guarded recovery.

Both files use the shared directional actor contract:

- `384x384` RGBA PNG;
- `4` columns ordered up, right, down, left;
- `3` animation rows;
- `96x128` frames;
- local foot baseline near `y=92`;
- binary alpha and a 32-color opaque palette.

The original artwork was created with the built-in image generation workflow,
using the checked-in Nightblade class atlas as the identity reference and the
existing directional actors as style and layout references. Production files
were normalized mechanically with nearest-neighbor resizing, hard chroma-key
removal, row-preserving baseline alignment, binary alpha, and non-dithered
palette quantization.

## Dragoon

The Dragoon is a disciplined elite spear fighter whose compact armored
silhouette is defined by a long steel spear and a closed helmet with prominent
metallic wing fins. The character wears royal cobalt-blue plate with navy
shadows, rich gold edging, small crimson-violet accents, a short split mantle,
and fully armored boots and gauntlets. The visual language emphasizes reach,
control, ceremonial authority, and the planted weight of a trained lancer
rather than agility or magic.

The Dragoon animation assets are:

- `dragoon-walk.png`: controlled armored stride phase A, neutral passing pose,
  and stride phase B with a stabilized spear.
- `dragoon-attack.png`: braced preparation, decisive long spear thrust, and
  guarded recovery.

Both files use the shared directional actor contract:

- `384x384` RGBA PNG;
- `4` columns ordered up, right, down, left;
- `3` animation rows;
- `96x128` frames;
- local foot baseline near `y=92`;
- binary alpha and a 32-color opaque palette.

The original artwork was created with the built-in image generation workflow,
using the checked-in Dragoon class atlas as the identity reference and the
existing directional actors as style and layout references. Production files
were normalized mechanically with nearest-neighbor resizing, hard chroma-key
removal, row-preserving baseline alignment, binary alpha, and non-dithered
palette quantization.

## Duelist

The Duelist is a lean, agile sword-and-dagger fighter whose silhouette combines
the long line of a rapier with the compact guard of a parrying dagger. The
character has swept pale-gold hair, fitted deep-purple and plum light armor,
cool silver-violet trim, one modest shoulder guard, tall dark boots, and
asymmetric split coat tails. The visual language emphasizes precision,
confidence, speed, and fencing technique rather than heavy strength or magic.

The Duelist animation assets are:

- `duelist-walk.png`: walk phase A, neutral passing pose, and walk phase B.
- `duelist-attack.png`: preparation, decisive rapier contact, and recovery.

Both files use the shared directional actor contract:

- `384x384` RGBA PNG;
- `4` columns ordered up, right, down, left;
- `3` animation rows;
- `96x128` frames;
- local foot baseline near `y=92`;
- binary alpha and a 32-color opaque palette.

The original artwork was created with the built-in image generation workflow,
using the checked-in Duelist class atlas as the identity reference and the
existing directional actors as style and layout references. Production files
were normalized mechanically with nearest-neighbor resizing, hard chroma-key
removal, frame-preserving alignment, binary alpha, and non-dithered palette
quantization.
