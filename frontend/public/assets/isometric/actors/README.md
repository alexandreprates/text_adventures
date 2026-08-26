# Isometric Actor Sprites

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
