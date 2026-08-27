# Isometric Actor Sprites

## Druid

The Druid is an adult wildwood guardian whose warm umber-brown face remains
visible beneath thick copper-auburn hair gathered into one practical braid
with small leaf ties. Layered moss-green and deep forest-teal robes, russet
leather, deep-plum shadows, aged-gold fasteners, compact bracers and boots, an
asymmetric leaf mantle, and short split robe tails define a grounded forest
caster. She carries exactly one dark crooked branch staff capped by a faceted
amber seed held between two green leaves. Small amber-green sprouts and leaf
motes express controlled nature magic without repeating the Ranger's hood and
bow, the Mystic's lunar scepter, or the Arcanist's crystalline staff.

The Druid animation assets are:

- `druid-walk.png`: walk phase A, neutral passing pose, and walk phase B with
  the staff held close and the braid and robe tails following the gait.
- `druid-attack.png`: planted preparation, a compact staff-led seed and leaf
  strike, and recovery with at most a few nearby fading leaf motes.

Both files use the shared directional actor contract:

- `384x384` RGBA PNG;
- `4` columns ordered up, right, down, left;
- `3` animation rows;
- `96x128` frames;
- local foot baseline near `y=92`;
- binary alpha and a 32-color opaque palette.

The original artwork was created with the built-in image generation workflow.
The Druid had no dedicated legacy class atlas and previously used the generic
Adventurer fallback, so her identity was consolidated from the pure
nature-magic class role. Existing Arcanist, Ranger, and Mystic directional
actors were used only for style, layout, scale, staff handling, and restrained
nature-magic guidance. Walk and attack were generated in separate passes, and
the approved walk sheet became the strict identity reference for attack.
Production files were normalized mechanically with nearest-neighbor resizing,
conservative chroma-key removal, sheet-level empty-margin cropping, fixed
per-cell padding, row-preserving baseline alignment, binary alpha, and
non-dithered palette quantization.

## Adventurer

The Adventurer is a young independent dungeon explorer whose determined pale
face remains visible beneath short, unruly wine-red hair. Layered charcoal,
blackened-leather, plum, and burgundy light armor, rounded shoulder plates,
utility belts, bracers, and a short split wine-red mantle establish a practical
and versatile silhouette. He carries exactly two compact curved
falchion-daggers with pale lilac-silver steel, dark grips, and restrained
antique-gold fittings. Tiny amber sparks accent decisive strikes without
turning the base-class delver into a spellcaster or repeating the hooded
Nightblade and rapier-focused Duelist.

The Adventurer animation assets are:

- `adventurer-walk.png`: walk phase A, neutral passing pose, and walk phase B
  with both curved blades carried low and the split mantle following the gait.
- `adventurer-attack.png`: grounded preparation, a compact opposing
  twin-blade cut with attached pale arcs and amber sparks, and balanced
  recovery toward the low guard.

Both files use the shared directional actor contract:

- `384x384` RGBA PNG;
- `4` columns ordered up, right, down, left;
- `3` animation rows;
- `96x128` frames;
- local foot baseline near `y=92`;
- binary alpha and a 32-color opaque palette.

The original artwork was created with the built-in image generation workflow,
using the checked-in Adventurer class atlas as the strict identity and action
reference. Existing Nightblade and Duelist directional actors were used only
for layout, scale, twin-blade readability, outline, and phase timing. Walk and
attack were generated in separate passes. Production files were normalized
mechanically with nearest-neighbor resizing, hard chroma-key removal,
sheet-level row separation, fixed per-cell padding, row-preserving baseline
alignment, binary alpha, and non-dithered palette quantization.

## Mystic

The Mystic is a young astral oracle whose pale face and magenta eyes remain
visible beneath very long white-to-lavender hair. Her flowing ivory, lilac,
and violet ceremonial dress combines a deep-violet bodice with restrained
gold and coral-pink filigree in star and flower motifs. She carries exactly
one short ornate scepter whose rose-coral faceted orb rests in a gold-violet
cradle. Small cyan-violet moon and petal motes express her combined combat and
nature magic without repeating the Arcanist's long staff or the Ranger's bow.

The Mystic animation assets are:

- `mystic-walk.png`: walk phase A, neutral passing pose, and walk phase B with
  the short scepter present in every frame and only tightly contained motes.
- `mystic-attack.png`: preparation, a compact lunar-flower sigil attached to
  the scepter, and recovery as the sigil contracts into nearby motes.

Both files use the shared directional actor contract:

- `384x384` RGBA PNG;
- `4` columns ordered up, right, down, left;
- `3` animation rows;
- `96x128` frames;
- local foot baseline near `y=92`;
- binary alpha and a 32-color opaque palette.

The original artwork was created with the built-in image generation workflow,
using the checked-in Mystic class atlas as the strict identity reference. The
existing Arcanist and Ranger directional actors were used only for layout,
scale, caster timing, outline, and restrained nature-light guidance. Walk and
attack were generated in separate passes, with dedicated revisions to preserve
the scepter across the walk cycle and keep attack effects inside their cells.
Production files were normalized mechanically with nearest-neighbor resizing,
hard chroma-key removal, fixed per-cell padding, row-preserving baseline
alignment, binary alpha, and non-dithered palette quantization.

## Ranger

The Ranger is a lean young dark-woodland hunter whose visible pale face and
auburn strands sit beneath a pointed wine-red hood. Layered burgundy and
charcoal leather armor, compact bracers and boots, a short ragged cloak, and a
small back quiver define a light, mobile silhouette. She carries exactly one
dark-wood recurved shortbow with crimson bindings. Restrained amber and
leaf-green light binds nature magic to the bowstring and arrowhead instead of
forming a broad spell effect. This design preserves the legacy atlas while
remaining distinct from the Nightblade's paired daggers and the Warden's heavy
sword-and-shield defense.

The Ranger animation assets are:

- `ranger-walk.png`: light walk phase A, neutral passing pose, and walk phase B
  with the shortbow carried low and the quiver fixed to the back.
- `ranger-attack.png`: arrow preparation, a fully drawn nature-charged release,
  and recovery with tiny fading amber and leaf-green motes.

Both files use the shared directional actor contract:

- `384x384` RGBA PNG;
- `4` columns ordered up, right, down, left;
- `3` animation rows;
- `96x128` frames;
- local foot baseline near `y=92`;
- binary alpha and a 32-color opaque palette.

The original artwork was created with the built-in image generation workflow,
using the checked-in Ranger class atlas as the strict identity and bow-action
reference. Existing Nightblade and Warden directional actors were used only
for layout, scale, outline, and restrained nature-light guidance. Walk and
attack were generated in separate passes. Production files were normalized
mechanically with nearest-neighbor resizing, hard chroma-key removal,
sheet-level empty-margin cropping, fixed per-cell padding, row-preserving
baseline alignment, binary alpha, and non-dithered palette quantization.

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
