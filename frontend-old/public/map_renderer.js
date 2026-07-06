globalThis.DungeonMapRenderer = (() => {
  const TILESET_SOURCE_SIZE = { width: 1254, height: 1254 };
  const TILESET_SOURCE_COLUMNS = [
    { x: 5, width: 151 },
    { x: 162, width: 151 },
    { x: 319, width: 149 },
    { x: 474, width: 150 },
    { x: 630, width: 149 },
    { x: 786, width: 150 },
    { x: 942, width: 150 },
    { x: 1098, width: 151 }
  ];
  const TILESET_SOURCE_ROWS = [
    { y: 5, height: 304 },
    { y: 315, height: 308 },
    { y: 633, height: 304 },
    { y: 944, height: 305 }
  ];
  const TILESET_REFERENCE_CELL = { width: 151, height: 308 };
  const TILE_WIDTH = 48;
  const TILE_HEIGHT = Math.round(TILE_WIDTH * (TILESET_REFERENCE_CELL.height / TILESET_REFERENCE_CELL.width));
  const TILE_REFERENCE_SIZE = 32;
  const ENEMY_HEIGHT_SCALE = 1.5;
  const CLASS_SPRITE_SCALE = 0.49;
  const CLASS_SPRITE_SCALE_OVERRIDES = {
    battlemage: 0.62
  };
  const ATTACK_ANIMATION_MS = 420;
  const TILESET_PATH = "/assets/tilesets/original-dungeon-tileset.png";
  const ENEMY_MANIFEST_PATH = "/assets/enemies/enemies.json";
  const CLASS_SPRITE_PATH_PREFIX = "/assets/atlas/class/";
  const CLASS_CHROMA_KEY = { redMax: 90, greenMin: 170, blueMax: 90 };
  const CLASS_SPRITE_FILES = {
    adventurer: "Adventurer.png",
    blademaster: "Blademaster.png",
    dragoon: "Dragoon.png",
    nightblade: "Nightblade.png",
    arcanist: "Arcanist.png",
    warlord: "Warlord.png",
    duelist: "Duelist.png",
    mystic: "Mystic.png",
    spellblade: "Spellblade.png",
    warden: "Warden.png",
    skirmisher: "Skirmisher.png",
    battlemage: "Battlemage.png",
    sentinel: "Sentinel.png",
    hexblade: "Hexblade.png",
    ranger: "Ranger.png"
  };
  const CLASS_SPRITE_FLIPS = {
    duelist: {
      walk: { right: true },
      attack: { right: true },
      damage: { right: true },
      dead: { right: true }
    },
    mystic: {
      walk: { right: true }
    },
    warlord: {
      walk: { left: true }
    },
    spellblade: {
      walk: { right: true }
    },
    warden: {
      walk: { left: true }
    },
    battlemage: {
      walk: { right: true }
    },
    sentinel: {
      walk: { right: true }
    },
    hexblade: {
      walk: { right: true }
    }
  };
  const CLASS_SPRITE_COORDINATES = {
    adventurer: {
      walk: {
        down: [
          { x: 57, y: 0, width: 114, height: 142 },
          { x: 257, y: 0, width: 116, height: 142 },
          { x: 457, y: 0, width: 116, height: 142 },
          { x: 658, y: 0, width: 117, height: 138 }
        ],
        left: [
          { x: 58, y: 134, width: 108, height: 141 },
          { x: 260, y: 134, width: 107, height: 141 },
          { x: 458, y: 134, width: 108, height: 141 },
          { x: 658, y: 134, width: 108, height: 141 }
        ],
        right: [
          { x: 52, y: 264, width: 111, height: 144 },
          { x: 251, y: 265, width: 109, height: 143 },
          { x: 451, y: 267, width: 105, height: 141 },
          { x: 651, y: 267, width: 107, height: 141 }
        ],
        up: [
          { x: 57, y: 401, width: 115, height: 136 },
          { x: 257, y: 401, width: 115, height: 137 },
          { x: 457, y: 401, width: 115, height: 136 },
          { x: 658, y: 401, width: 116, height: 137 }
        ]
      },
      attack: {
        down: [
          { x: 65, y: 448, width: 99, height: 116 },
          { x: 265, y: 448, width: 99, height: 116 },
          { x: 465, y: 448, width: 99, height: 116 },
          { x: 666, y: 448, width: 100, height: 116 }
        ],
        left: [
          { x: 54, y: 560, width: 126, height: 117 },
          { x: 250, y: 560, width: 189, height: 117 },
          { x: 435, y: 560, width: 179, height: 117 },
          { x: 660, y: 560, width: 139, height: 117 }
        ],
        right: [
          { x: 43, y: 673, width: 133, height: 110 },
          { x: 243, y: 673, width: 156, height: 106 },
          { x: 436, y: 673, width: 179, height: 110 },
          { x: 659, y: 673, width: 159, height: 108 }
        ],
        up: [
          { x: 53, y: 792, width: 127, height: 110 },
          { x: 248, y: 792, width: 150, height: 110 },
          { x: 446, y: 793, width: 162, height: 109 },
          { x: 666, y: 792, width: 129, height: 110 }
        ]
      },
      damage: {
        down: [
          { x: 62, y: 898, width: 104, height: 116 },
          { x: 245, y: 898, width: 137, height: 116 },
          { x: 435, y: 898, width: 173, height: 116 },
          { x: 662, y: 898, width: 108, height: 116 }
        ],
        left: [
          { x: 58, y: 1010, width: 111, height: 116 },
          { x: 263, y: 1010, width: 105, height: 116 },
          { x: 465, y: 1010, width: 97, height: 116 },
          { x: 659, y: 1010, width: 121, height: 116 }
        ],
        right: [
          { x: 63, y: 1122, width: 101, height: 117 },
          { x: 265, y: 1122, width: 91, height: 117 },
          { x: 470, y: 1122, width: 92, height: 117 },
          { x: 670, y: 1122, width: 115, height: 117 }
        ],
        up: [
          { x: 60, y: 1235, width: 100, height: 116 },
          { x: 269, y: 1235, width: 93, height: 116 },
          { x: 478, y: 1235, width: 89, height: 116 },
          { x: 678, y: 1235, width: 91, height: 116 }
        ]
      },
      dead: {
        down: [
          { x: 61, y: 1347, width: 91, height: 117 },
          { x: 260, y: 1347, width: 87, height: 117 },
          { x: 460, y: 1347, width: 87, height: 67 },
          { x: 660, y: 1347, width: 91, height: 67 }
        ],
        left: [
          { x: 58, y: 1460, width: 111, height: 116 },
          { x: 246, y: 1460, width: 135, height: 116 },
          { x: 441, y: 1468, width: 217, height: 108 },
          { x: 654, y: 1470, width: 137, height: 106 }
        ],
        right: [
          { x: 58, y: 1572, width: 111, height: 117 },
          { x: 261, y: 1572, width: 109, height: 117 },
          { x: 450, y: 1572, width: 117, height: 117 },
          { x: 672, y: 1572, width: 112, height: 77 }
        ],
        up: [
          { x: 61, y: 1685, width: 108, height: 75 },
          { x: 261, y: 1685, width: 109, height: 75 },
          { x: 444, y: 1685, width: 214, height: 72 },
          { x: 654, y: 1698, width: 138, height: 61 }
        ]
      }
    },
    blademaster: {
      walk: {
        down: [
          { x: 28, y: 0, width: 153, height: 138 },
          { x: 217, y: 0, width: 176, height: 138 },
          { x: 418, y: 0, width: 202, height: 138 },
          { x: 642, y: 0, width: 203, height: 138 }
        ],
        left: [
          { x: 28, y: 129, width: 153, height: 134 },
          { x: 217, y: 129, width: 176, height: 134 },
          { x: 418, y: 129, width: 202, height: 134 },
          { x: 642, y: 129, width: 203, height: 134 }
        ],
        right: [
          { x: 28, y: 254, width: 153, height: 133 },
          { x: 217, y: 254, width: 176, height: 133 },
          { x: 418, y: 254, width: 202, height: 133 },
          { x: 642, y: 254, width: 203, height: 133 }
        ],
        up: [
          { x: 28, y: 379, width: 153, height: 131 },
          { x: 217, y: 379, width: 176, height: 131 },
          { x: 418, y: 379, width: 202, height: 131 },
          { x: 642, y: 379, width: 203, height: 131 }
        ]
      },
      attack: {
        down: [
          { x: 40, y: 440, width: 122, height: 132 },
          { x: 262, y: 440, width: 185, height: 132 },
          { x: 427, y: 440, width: 171, height: 132 },
          { x: 700, y: 440, width: 118, height: 132 }
        ],
        left: [
          { x: 44, y: 552, width: 131, height: 133 },
          { x: 224, y: 552, width: 147, height: 133 },
          { x: 469, y: 552, width: 197, height: 133 },
          { x: 646, y: 552, width: 179, height: 133 }
        ],
        right: [
          { x: 52, y: 665, width: 96, height: 132 },
          { x: 218, y: 665, width: 229, height: 132 },
          { x: 427, y: 665, width: 182, height: 132 },
          { x: 676, y: 665, width: 155, height: 132 }
        ],
        up: [
          { x: 52, y: 777, width: 107, height: 133 },
          { x: 217, y: 777, width: 164, height: 133 },
          { x: 431, y: 777, width: 173, height: 133 },
          { x: 677, y: 777, width: 154, height: 133 }
        ]
      },
      damage: {
        down: [
          { x: 39, y: 890, width: 136, height: 132 },
          { x: 260, y: 890, width: 133, height: 118 },
          { x: 479, y: 890, width: 127, height: 132 },
          { x: 699, y: 890, width: 124, height: 132 }
        ],
        left: [
          { x: 43, y: 1002, width: 133, height: 127 },
          { x: 259, y: 1011, width: 115, height: 117 },
          { x: 466, y: 1002, width: 114, height: 127 },
          { x: 686, y: 1002, width: 114, height: 127 }
        ],
        right: [
          { x: 53, y: 1121, width: 95, height: 126 },
          { x: 272, y: 1121, width: 105, height: 126 },
          { x: 443, y: 1121, width: 158, height: 126 },
          { x: 682, y: 1122, width: 139, height: 125 }
        ],
        up: [
          { x: 40, y: 1227, width: 124, height: 132 },
          { x: 261, y: 1227, width: 125, height: 132 },
          { x: 443, y: 1227, width: 153, height: 132 },
          { x: 699, y: 1227, width: 116, height: 132 }
        ]
      },
      dead: {
        down: [
          { x: 49, y: 1339, width: 119, height: 133 },
          { x: 266, y: 1339, width: 125, height: 133 },
          { x: 468, y: 1339, width: 147, height: 133 },
          { x: 672, y: 1339, width: 159, height: 133 }
        ],
        left: [
          { x: 45, y: 1452, width: 104, height: 132 },
          { x: 269, y: 1452, width: 101, height: 132 },
          { x: 469, y: 1452, width: 145, height: 132 },
          { x: 684, y: 1452, width: 158, height: 132 }
        ],
        right: [
          { x: 40, y: 1564, width: 113, height: 133 },
          { x: 261, y: 1564, width: 112, height: 133 },
          { x: 482, y: 1564, width: 130, height: 133 },
          { x: 692, y: 1564, width: 153, height: 133 }
        ],
        up: [
          { x: 40, y: 1677, width: 141, height: 121 },
          { x: 251, y: 1677, width: 140, height: 122 },
          { x: 457, y: 1677, width: 163, height: 122 },
          { x: 671, y: 1677, width: 167, height: 122 }
        ]
      }
    },
    dragoon: {
      walk: {
        down: [
          { x: 59, y: 0, width: 117, height: 145 },
          { x: 273, y: 0, width: 116, height: 145 },
          { x: 482, y: 0, width: 120, height: 145 },
          { x: 694, y: 0, width: 120, height: 145 }
        ],
        left: [
          { x: 19, y: 140, width: 158, height: 123 },
          { x: 231, y: 140, width: 155, height: 123 },
          { x: 445, y: 140, width: 154, height: 123 },
          { x: 662, y: 140, width: 147, height: 123 }
        ],
        right: [
          { x: 54, y: 260, width: 159, height: 120 },
          { x: 267, y: 260, width: 160, height: 120 },
          { x: 483, y: 260, width: 152, height: 120 },
          { x: 698, y: 260, width: 151, height: 120 }
        ],
        up: [
          { x: 61, y: 490, width: 99, height: 142 },
          { x: 272, y: 490, width: 101, height: 142 },
          { x: 476, y: 490, width: 107, height: 142 },
          { x: 689, y: 490, width: 107, height: 142 }
        ]
      },
      attack: {
        down: [
          { x: 55, y: 438, width: 157, height: 136 },
          { x: 267, y: 438, width: 150, height: 136 },
          { x: 478, y: 438, width: 151, height: 136 },
          { x: 694, y: 438, width: 150, height: 136 }
        ],
        left: [
          { x: 53, y: 550, width: 104, height: 136 },
          { x: 255, y: 550, width: 114, height: 136 },
          { x: 472, y: 550, width: 109, height: 136 },
          { x: 689, y: 550, width: 104, height: 136 }
        ],
        right: [
          { x: 54, y: 662, width: 177, height: 137 },
          { x: 207, y: 662, width: 243, height: 137 },
          { x: 426, y: 662, width: 242, height: 137 },
          { x: 644, y: 662, width: 225, height: 137 }
        ],
        up: [
          { x: 0, y: 775, width: 231, height: 136 },
          { x: 207, y: 775, width: 243, height: 136 },
          { x: 426, y: 775, width: 242, height: 136 },
          { x: 644, y: 775, width: 167, height: 136 }
        ]
      },
      damage: {
        down: [
          { x: 45, y: 887, width: 170, height: 136 },
          { x: 257, y: 887, width: 192, height: 136 },
          { x: 473, y: 887, width: 190, height: 136 },
          { x: 687, y: 887, width: 168, height: 136 }
        ],
        left: [
          { x: 59, y: 999, width: 98, height: 137 },
          { x: 274, y: 999, width: 96, height: 137 },
          { x: 489, y: 999, width: 90, height: 137 },
          { x: 699, y: 999, width: 101, height: 137 }
        ],
        right: [
          { x: 45, y: 1112, width: 125, height: 136 },
          { x: 257, y: 1112, width: 130, height: 136 },
          { x: 458, y: 1112, width: 140, height: 136 },
          { x: 695, y: 1112, width: 113, height: 136 }
        ],
        up: [
          { x: 13, y: 1224, width: 158, height: 136 },
          { x: 215, y: 1224, width: 164, height: 136 },
          { x: 444, y: 1224, width: 157, height: 136 },
          { x: 651, y: 1224, width: 158, height: 136 }
        ]
      },
      dead: {
        down: [
          { x: 45, y: 1336, width: 167, height: 137 },
          { x: 261, y: 1336, width: 166, height: 137 },
          { x: 473, y: 1336, width: 173, height: 137 },
          { x: 689, y: 1336, width: 168, height: 137 }
        ],
        left: [
          { x: 57, y: 1449, width: 103, height: 136 },
          { x: 254, y: 1449, width: 121, height: 136 },
          { x: 464, y: 1449, width: 128, height: 136 },
          { x: 696, y: 1449, width: 107, height: 136 }
        ],
        right: [
          { x: 57, y: 1561, width: 101, height: 137 },
          { x: 232, y: 1561, width: 155, height: 137 },
          { x: 448, y: 1561, width: 155, height: 137 },
          { x: 678, y: 1561, width: 131, height: 137 }
        ],
        up: [
          { x: 60, y: 1674, width: 168, height: 66 },
          { x: 245, y: 1674, width: 205, height: 68 },
          { x: 426, y: 1674, width: 242, height: 71 },
          { x: 644, y: 1674, width: 213, height: 72 }
        ]
      }
    },
    nightblade: {
      walk: {
        down: [
          { x: 101, y: 0, width: 111, height: 140 },
          { x: 282, y: 0, width: 111, height: 140 },
          { x: 466, y: 0, width: 113, height: 140 },
          { x: 647, y: 0, width: 111, height: 140 }
        ],
        left: [
          { x: 101, y: 136, width: 109, height: 134 },
          { x: 286, y: 136, width: 109, height: 134 },
          { x: 467, y: 136, width: 108, height: 134 },
          { x: 650, y: 136, width: 108, height: 134 }
        ],
        right: [
          { x: 104, y: 266, width: 109, height: 132 },
          { x: 288, y: 266, width: 107, height: 132 },
          { x: 472, y: 266, width: 106, height: 132 },
          { x: 649, y: 266, width: 112, height: 132 }
        ],
        up: [
          { x: 104, y: 389, width: 103, height: 137 },
          { x: 284, y: 389, width: 108, height: 137 },
          { x: 467, y: 389, width: 106, height: 137 },
          { x: 652, y: 389, width: 104, height: 137 }
        ]
      },
      attack: {
        down: [
          { x: 104, y: 438, width: 103, height: 136 },
          { x: 284, y: 438, width: 108, height: 136 },
          { x: 467, y: 438, width: 201, height: 136 },
          { x: 644, y: 438, width: 112, height: 136 }
        ],
        left: [
          { x: 96, y: 550, width: 118, height: 136 },
          { x: 272, y: 550, width: 159, height: 136 },
          { x: 466, y: 550, width: 202, height: 136 },
          { x: 644, y: 550, width: 145, height: 136 }
        ],
        right: [
          { x: 99, y: 662, width: 123, height: 137 },
          { x: 234, y: 662, width: 216, height: 137 },
          { x: 426, y: 662, width: 242, height: 137 },
          { x: 644, y: 662, width: 155, height: 137 }
        ],
        up: [
          { x: 88, y: 775, width: 143, height: 136 },
          { x: 207, y: 775, width: 228, height: 135 },
          { x: 442, y: 775, width: 226, height: 136 },
          { x: 644, y: 775, width: 140, height: 136 }
        ]
      },
      damage: {
        down: [
          { x: 94, y: 887, width: 130, height: 136 },
          { x: 273, y: 887, width: 138, height: 136 },
          { x: 436, y: 887, width: 232, height: 136 },
          { x: 644, y: 887, width: 137, height: 136 }
        ],
        left: [
          { x: 95, y: 999, width: 121, height: 137 },
          { x: 276, y: 999, width: 123, height: 137 },
          { x: 453, y: 999, width: 215, height: 137 },
          { x: 644, y: 999, width: 117, height: 137 }
        ],
        right: [
          { x: 93, y: 1112, width: 123, height: 136 },
          { x: 271, y: 1112, width: 127, height: 136 },
          { x: 445, y: 1112, width: 223, height: 136 },
          { x: 644, y: 1112, width: 119, height: 136 }
        ],
        up: [
          { x: 88, y: 1224, width: 116, height: 136 },
          { x: 278, y: 1224, width: 119, height: 136 },
          { x: 459, y: 1224, width: 209, height: 136 },
          { x: 644, y: 1224, width: 117, height: 136 }
        ]
      },
      dead: {
        down: [
          { x: 99, y: 1336, width: 112, height: 137 },
          { x: 270, y: 1336, width: 129, height: 137 },
          { x: 451, y: 1336, width: 125, height: 137 },
          { x: 648, y: 1336, width: 120, height: 137 }
        ],
        left: [
          { x: 94, y: 1449, width: 123, height: 136 },
          { x: 272, y: 1449, width: 138, height: 136 },
          { x: 446, y: 1449, width: 222, height: 136 },
          { x: 644, y: 1449, width: 136, height: 136 }
        ],
        right: [
          { x: 91, y: 1561, width: 115, height: 137 },
          { x: 273, y: 1561, width: 125, height: 137 },
          { x: 452, y: 1561, width: 216, height: 83 },
          { x: 644, y: 1561, width: 126, height: 84 }
        ],
        up: [
          { x: 0, y: 1674, width: 215, height: 124 },
          { x: 279, y: 1674, width: 118, height: 109 },
          { x: 443, y: 1692, width: 225, height: 88 },
          { x: 644, y: 1695, width: 231, height: 103 }
        ]
      }
    },
    arcanist: {
      walk: {
        down: [
          { x: 22, y: 0, width: 130, height: 144 },
          { x: 196, y: 0, width: 131, height: 144 },
          { x: 372, y: 0, width: 131, height: 144 },
          { x: 551, y: 0, width: 131, height: 144 }
        ],
        left: [
          { x: 27, y: 144, width: 127, height: 130 },
          { x: 202, y: 144, width: 130, height: 130 },
          { x: 379, y: 144, width: 125, height: 130 },
          { x: 559, y: 144, width: 126, height: 130 }
        ],
        right: [
          { x: 24, y: 274, width: 130, height: 129 },
          { x: 200, y: 274, width: 127, height: 129 },
          { x: 376, y: 274, width: 126, height: 129 },
          { x: 555, y: 274, width: 123, height: 129 }
        ],
        up: [
          { x: 26, y: 403, width: 130, height: 125 },
          { x: 201, y: 403, width: 121, height: 125 },
          { x: 375, y: 403, width: 123, height: 125 },
          { x: 556, y: 403, width: 121, height: 125 }
        ]
      },
      attack: {
        down: [
          { x: 24, y: 531, width: 130, height: 160 },
          { x: 197, y: 531, width: 177, height: 160 },
          { x: 350, y: 531, width: 205, height: 160 },
          { x: 531, y: 531, width: 170, height: 160 }
        ],
        left: [
          { x: 24, y: 667, width: 128, height: 159 },
          { x: 198, y: 667, width: 176, height: 159 },
          { x: 350, y: 667, width: 205, height: 159 },
          { x: 531, y: 667, width: 154, height: 159 }
        ],
        right: [
          { x: 28, y: 802, width: 126, height: 160 },
          { x: 198, y: 802, width: 176, height: 160 },
          { x: 350, y: 802, width: 205, height: 160 },
          { x: 531, y: 802, width: 153, height: 160 }
        ],
        up: [
          { x: 34, y: 938, width: 122, height: 160 },
          { x: 203, y: 938, width: 122, height: 160 },
          { x: 373, y: 938, width: 136, height: 160 },
          { x: 554, y: 938, width: 123, height: 160 }
        ]
      },
      damage: {
        down: [
          { x: 34, y: 1074, width: 118, height: 160 },
          { x: 208, y: 1074, width: 118, height: 160 },
          { x: 386, y: 1074, width: 117, height: 160 },
          { x: 560, y: 1074, width: 119, height: 160 }
        ],
        left: [
          { x: 45, y: 1210, width: 109, height: 160 },
          { x: 217, y: 1210, width: 111, height: 160 },
          { x: 390, y: 1210, width: 115, height: 160 },
          { x: 563, y: 1210, width: 115, height: 160 }
        ],
        right: [
          { x: 38, y: 1346, width: 116, height: 159 },
          { x: 214, y: 1346, width: 115, height: 159 },
          { x: 382, y: 1346, width: 120, height: 159 },
          { x: 557, y: 1346, width: 120, height: 159 }
        ],
        up: [
          { x: 25, y: 1481, width: 126, height: 160 },
          { x: 193, y: 1481, width: 131, height: 160 },
          { x: 371, y: 1481, width: 131, height: 160 },
          { x: 555, y: 1481, width: 117, height: 160 }
        ]
      },
      dead: {
        down: [
          { x: 33, y: 1617, width: 134, height: 160 },
          { x: 204, y: 1617, width: 170, height: 160 },
          { x: 350, y: 1617, width: 205, height: 160 },
          { x: 531, y: 1617, width: 181, height: 100 }
        ],
        left: [
          { x: 35, y: 1753, width: 117, height: 159 },
          { x: 212, y: 1753, width: 162, height: 159 },
          { x: 350, y: 1753, width: 205, height: 159 },
          { x: 531, y: 1754, width: 164, height: 158 }
        ],
        right: [
          { x: 44, y: 1888, width: 113, height: 160 },
          { x: 216, y: 1888, width: 113, height: 160 },
          { x: 377, y: 1888, width: 178, height: 160 },
          { x: 531, y: 1888, width: 169, height: 160 }
        ],
        up: [
          { x: 0, y: 2024, width: 146, height: 148 },
          { x: 200, y: 2024, width: 118, height: 99 },
          { x: 362, y: 2024, width: 121, height: 97 },
          { x: 532, y: 2024, width: 121, height: 99 }
        ]
      }
    },
    warlord: {
      walk: {
        down: [
          { x: 47, y: 0, width: 133, height: 126 },
          { x: 246, y: 0, width: 131, height: 126 },
          { x: 446, y: 0, width: 128, height: 126 },
          { x: 655, y: 0, width: 130, height: 126 }
        ],
        left: [
          { x: 69, y: 124, width: 118, height: 114 },
          { x: 269, y: 124, width: 119, height: 114 },
          { x: 469, y: 124, width: 114, height: 114 },
          { x: 679, y: 124, width: 112, height: 114 }
        ],
        right: [
          { x: 64, y: 236, width: 130, height: 116 },
          { x: 259, y: 236, width: 129, height: 116 },
          { x: 462, y: 236, width: 129, height: 116 },
          { x: 673, y: 236, width: 129, height: 116 }
        ],
        up: [
          { x: 61, y: 350, width: 133, height: 115 },
          { x: 260, y: 350, width: 132, height: 115 },
          { x: 465, y: 350, width: 131, height: 115 },
          { x: 675, y: 350, width: 131, height: 115 }
        ]
      },
      attack: {
        down: [
          { x: 71, y: 437, width: 117, height: 136 },
          { x: 249, y: 437, width: 124, height: 136 },
          { x: 451, y: 437, width: 124, height: 136 },
          { x: 661, y: 437, width: 126, height: 136 }
        ],
        left: [
          { x: 63, y: 549, width: 110, height: 137 },
          { x: 249, y: 549, width: 138, height: 137 },
          { x: 428, y: 549, width: 145, height: 137 },
          { x: 678, y: 549, width: 167, height: 137 }
        ],
        right: [
          { x: 35, y: 670, width: 168, height: 128 },
          { x: 252, y: 668, width: 163, height: 130 },
          { x: 444, y: 662, width: 185, height: 133 },
          { x: 681, y: 670, width: 194, height: 127 }
        ],
        up: [
          { x: 22, y: 774, width: 147, height: 134 },
          { x: 225, y: 776, width: 225, height: 132 },
          { x: 426, y: 780, width: 243, height: 130 },
          { x: 645, y: 780, width: 148, height: 130 }
        ]
      },
      damage: {
        down: [
          { x: 36, y: 887, width: 143, height: 134 },
          { x: 239, y: 889, width: 141, height: 132 },
          { x: 439, y: 886, width: 141, height: 135 },
          { x: 652, y: 886, width: 143, height: 135 }
        ],
        left: [
          { x: 59, y: 1005, width: 136, height: 127 },
          { x: 263, y: 1007, width: 131, height: 127 },
          { x: 464, y: 1003, width: 136, height: 130 },
          { x: 679, y: 1006, width: 148, height: 128 }
        ],
        right: [
          { x: 67, y: 1115, width: 121, height: 126 },
          { x: 260, y: 1116, width: 128, height: 131 },
          { x: 465, y: 1114, width: 128, height: 133 },
          { x: 682, y: 1113, width: 128, height: 131 }
        ],
        up: [
          { x: 58, y: 1225, width: 120, height: 132 },
          { x: 261, y: 1223, width: 120, height: 135 },
          { x: 462, y: 1223, width: 121, height: 136 },
          { x: 677, y: 1227, width: 128, height: 132 }
        ]
      },
      dead: {
        down: [
          { x: 62, y: 1340, width: 136, height: 131 },
          { x: 263, y: 1342, width: 134, height: 125 },
          { x: 466, y: 1343, width: 126, height: 126 },
          { x: 682, y: 1343, width: 143, height: 126 }
        ],
        left: [
          { x: 48, y: 1447, width: 158, height: 135 },
          { x: 245, y: 1457, width: 162, height: 125 },
          { x: 445, y: 1465, width: 161, height: 117 },
          { x: 660, y: 1465, width: 160, height: 117 }
        ],
        right: [
          { x: 41, y: 1569, width: 167, height: 125 },
          { x: 242, y: 1596, width: 170, height: 92 },
          { x: 443, y: 1596, width: 168, height: 92 },
          { x: 651, y: 1595, width: 190, height: 89 }
        ],
        up: [
          { x: 38, y: 1716, width: 189, height: 80 },
          { x: 240, y: 1713, width: 189, height: 83 },
          { x: 441, y: 1711, width: 189, height: 85 },
          { x: 651, y: 1720, width: 190, height: 76 }
        ]
      }
    },
    duelist: {
      walk: {
        down: [
          { x: 32, y: 0, width: 108, height: 137 },
          { x: 212, y: 0, width: 109, height: 137 },
          { x: 392, y: 0, width: 109, height: 137 },
          { x: 568, y: 0, width: 116, height: 137 }
        ],
        left: [
          { x: 21, y: 137, width: 123, height: 127 },
          { x: 208, y: 137, width: 121, height: 127 },
          { x: 386, y: 137, width: 126, height: 127 },
          { x: 567, y: 137, width: 123, height: 127 }
        ],
        right: [
          { x: 27, y: 264, width: 120, height: 130 },
          { x: 209, y: 264, width: 118, height: 130 },
          { x: 388, y: 264, width: 121, height: 130 },
          { x: 571, y: 264, width: 114, height: 130 }
        ],
        up: [
          { x: 45, y: 394, width: 107, height: 135 },
          { x: 224, y: 394, width: 106, height: 135 },
          { x: 405, y: 394, width: 109, height: 135 },
          { x: 585, y: 394, width: 110, height: 135 }
        ]
      },
      attack: {
        down: [
          { x: 14, y: 529, width: 135, height: 134 },
          { x: 179, y: 529, width: 154, height: 134 },
          { x: 326, y: 529, width: 219, height: 134 },
          { x: 570, y: 529, width: 113, height: 134 }
        ],
        left: [
          { x: 12, y: 663, width: 131, height: 134 },
          { x: 183, y: 669, width: 179, height: 128 },
          { x: 369, y: 663, width: 145, height: 134 },
          { x: 535, y: 663, width: 160, height: 134 }
        ],
        right: [
          { x: 18, y: 797, width: 129, height: 134 },
          { x: 191, y: 797, width: 142, height: 134 },
          { x: 398, y: 797, width: 135, height: 134 },
          { x: 545, y: 797, width: 154, height: 134 }
        ],
        up: [
          { x: 34, y: 931, width: 117, height: 136 },
          { x: 185, y: 931, width: 146, height: 136 },
          { x: 385, y: 931, width: 199, height: 136 },
          { x: 577, y: 931, width: 121, height: 136 }
        ]
      },
      damage: {
        down: [
          { x: 18, y: 1067, width: 133, height: 136 },
          { x: 226, y: 1067, width: 108, height: 136 },
          { x: 397, y: 1067, width: 116, height: 136 },
          { x: 593, y: 1067, width: 96, height: 136 }
        ],
        left: [
          { x: 28, y: 1203, width: 120, height: 133 },
          { x: 224, y: 1203, width: 106, height: 133 },
          { x: 401, y: 1203, width: 109, height: 133 },
          { x: 571, y: 1203, width: 117, height: 133 }
        ],
        right: [
          { x: 26, y: 1336, width: 122, height: 131 },
          { x: 227, y: 1336, width: 105, height: 131 },
          { x: 410, y: 1336, width: 99, height: 131 },
          { x: 569, y: 1336, width: 122, height: 131 }
        ],
        up: [
          { x: 50, y: 1467, width: 96, height: 137 },
          { x: 216, y: 1467, width: 111, height: 135 },
          { x: 395, y: 1467, width: 111, height: 136 },
          { x: 594, y: 1467, width: 101, height: 137 }
        ]
      },
      dead: {
        down: [
          { x: 17, y: 1604, width: 128, height: 130 },
          { x: 188, y: 1611, width: 139, height: 123 },
          { x: 371, y: 1621, width: 156, height: 113 },
          { x: 538, y: 1645, width: 173, height: 89 }
        ],
        left: [
          { x: 18, y: 1734, width: 129, height: 128 },
          { x: 179, y: 1750, width: 156, height: 112 },
          { x: 354, y: 1773, width: 175, height: 89 },
          { x: 533, y: 1782, width: 180, height: 80 }
        ],
        right: [
          { x: 26, y: 1862, width: 116, height: 141 },
          { x: 198, y: 1870, width: 133, height: 133 },
          { x: 365, y: 1895, width: 160, height: 108 },
          { x: 523, y: 1923, width: 184, height: 80 }
        ],
        up: [
          { x: 41, y: 2003, width: 106, height: 148 },
          { x: 215, y: 2012, width: 128, height: 141 },
          { x: 350, y: 2070, width: 181, height: 88 },
          { x: 523, y: 2074, width: 181, height: 86 }
        ]
      }
    },
    mystic: {
      walk: {
        down: [
          { x: 45, y: 0, width: 123, height: 124 },
          { x: 186, y: 0, width: 128, height: 124 },
          { x: 337, y: 0, width: 127, height: 124 },
          { x: 486, y: 0, width: 127, height: 124 }
        ],
        left: [
          { x: 34, y: 121, width: 133, height: 121 },
          { x: 183, y: 121, width: 134, height: 120 },
          { x: 331, y: 121, width: 136, height: 120 },
          { x: 484, y: 121, width: 134, height: 120 }
        ],
        right: [
          { x: 32, y: 240, width: 135, height: 116 },
          { x: 184, y: 240, width: 133, height: 116 },
          { x: 333, y: 240, width: 133, height: 116 },
          { x: 484, y: 240, width: 134, height: 116 }
        ],
        up: [
          { x: 49, y: 470, width: 121, height: 117 },
          { x: 191, y: 470, width: 122, height: 117 },
          { x: 349, y: 470, width: 120, height: 117 },
          { x: 502, y: 470, width: 120, height: 117 }
        ]
      }
    },
    spellblade: {
      walk: {
        down: [
          { x: 18, y: 6, width: 130, height: 134 },
          { x: 189, y: 6, width: 130, height: 134 },
          { x: 358, y: 6, width: 126, height: 134 },
          { x: 525, y: 6, width: 125, height: 134 }
        ],
        left: [
          { x: 23, y: 132, width: 126, height: 121 },
          { x: 226, y: 132, width: 100, height: 120 },
          { x: 396, y: 132, width: 93, height: 120 },
          { x: 524, y: 132, width: 128, height: 120 }
        ],
        right: [
          { x: 62, y: 256, width: 104, height: 120 },
          { x: 226, y: 255, width: 110, height: 121 },
          { x: 393, y: 256, width: 109, height: 120 },
          { x: 561, y: 256, width: 110, height: 120 }
        ],
        up: [
          { x: 47, y: 379, width: 116, height: 121 },
          { x: 218, y: 380, width: 97, height: 120 },
          { x: 382, y: 380, width: 119, height: 120 },
          { x: 552, y: 379, width: 96, height: 121 }
        ]
      }
    },
    warden: {
      walk: {
        down: [
          { x: 25, y: 0, width: 115, height: 140 },
          { x: 160, y: 0, width: 145, height: 140 },
          { x: 330, y: 0, width: 131, height: 140 },
          { x: 476, y: 0, width: 147, height: 140 }
        ],
        left: [
          { x: 24, y: 138, width: 120, height: 127 },
          { x: 185, y: 138, width: 113, height: 127 },
          { x: 330, y: 138, width: 134, height: 127 },
          { x: 508, y: 138, width: 109, height: 127 }
        ],
        right: [
          { x: 24, y: 268, width: 115, height: 124 },
          { x: 182, y: 268, width: 115, height: 124 },
          { x: 343, y: 268, width: 118, height: 124 },
          { x: 501, y: 268, width: 117, height: 124 }
        ],
        up: [
          { x: 17, y: 392, width: 121, height: 128 },
          { x: 181, y: 392, width: 124, height: 128 },
          { x: 334, y: 392, width: 129, height: 128 },
          { x: 496, y: 392, width: 129, height: 140 }
        ]
      }
    },
    skirmisher: {
      walk: {
        down: [
          { x: 56, y: 0, width: 126, height: 120 },
          { x: 262, y: 0, width: 124, height: 120 },
          { x: 467, y: 0, width: 125, height: 120 },
          { x: 676, y: 0, width: 124, height: 120 }
        ],
        left: [
          { x: 70, y: 112, width: 94, height: 124 },
          { x: 274, y: 112, width: 97, height: 124 },
          { x: 481, y: 112, width: 94, height: 124 },
          { x: 692, y: 112, width: 87, height: 124 }
        ],
        right: [
          { x: 77, y: 232, width: 100, height: 120 },
          { x: 277, y: 232, width: 100, height: 120 },
          { x: 479, y: 232, width: 103, height: 120 },
          { x: 691, y: 232, width: 100, height: 120 }
        ],
        up: [
          { x: 62, y: 344, width: 123, height: 120 },
          { x: 262, y: 344, width: 124, height: 120 },
          { x: 467, y: 344, width: 124, height: 120 },
          { x: 676, y: 344, width: 123, height: 120 }
        ]
      }
    },
    battlemage: {
      walk: {
        down: [
          { x: 45, y: 0, width: 111, height: 100 },
          { x: 259, y: 0, width: 106, height: 100 },
          { x: 469, y: 0, width: 112, height: 100 },
          { x: 678, y: 0, width: 108, height: 100 }
        ],
        left: [
          { x: 271, y: 198, width: 84, height: 104 },
          { x: 484, y: 198, width: 87, height: 106 },
          { x: 694, y: 198, width: 88, height: 104 },
          { x: 50, y: 198, width: 97, height: 104 }
        ],
        right: [
          { x: 271, y: 198, width: 84, height: 104 },
          { x: 484, y: 198, width: 87, height: 106 },
          { x: 694, y: 198, width: 88, height: 104 },
          { x: 50, y: 198, width: 97, height: 104 }
        ],
        up: [
          { x: 45, y: 396, width: 112, height: 104 },
          { x: 268, y: 396, width: 102, height: 104 },
          { x: 465, y: 396, width: 116, height: 104 },
          { x: 690, y: 396, width: 102, height: 104 }
        ]
      }
    },
    sentinel: {
      walk: {
        down: [
          { x: 46, y: 0, width: 111, height: 134 },
          { x: 237, y: 0, width: 112, height: 134 },
          { x: 391, y: 0, width: 111, height: 134 },
          { x: 538, y: 0, width: 113, height: 134 }
        ],
        left: [
          { x: 42, y: 264, width: 115, height: 132 },
          { x: 221, y: 268, width: 115, height: 128 },
          { x: 393, y: 270, width: 112, height: 126 },
          { x: 549, y: 270, width: 121, height: 126 }
        ],
        right: [
          { x: 42, y: 264, width: 115, height: 132 },
          { x: 221, y: 268, width: 115, height: 128 },
          { x: 393, y: 270, width: 112, height: 126 },
          { x: 549, y: 270, width: 121, height: 126 }
        ],
        up: [
          { x: 48, y: 392, width: 104, height: 136 },
          { x: 225, y: 394, width: 105, height: 134 },
          { x: 394, y: 392, width: 105, height: 136 },
          { x: 549, y: 392, width: 107, height: 136 }
        ]
      }
    },
    hexblade: {
      walk: {
        down: [
          { x: 59, y: 0, width: 143, height: 148 },
          { x: 251, y: 0, width: 156, height: 148 },
          { x: 458, y: 0, width: 162, height: 148 },
          { x: 663, y: 0, width: 146, height: 148 }
        ],
        left: [
          { x: 69, y: 142, width: 117, height: 136 },
          { x: 251, y: 142, width: 130, height: 136 },
          { x: 466, y: 142, width: 144, height: 136 },
          { x: 667, y: 142, width: 129, height: 136 }
        ],
        right: [
          { x: 69, y: 142, width: 117, height: 136 },
          { x: 251, y: 142, width: 130, height: 136 },
          { x: 466, y: 142, width: 144, height: 136 },
          { x: 667, y: 142, width: 129, height: 136 }
        ],
        up: [
          { x: 47, y: 528, width: 154, height: 140 },
          { x: 242, y: 528, width: 173, height: 140 },
          { x: 453, y: 528, width: 158, height: 140 },
          { x: 647, y: 528, width: 161, height: 140 }
        ]
      }
    },
    ranger: {
      walk: {
        down: [
          { x: 133, y: 4, width: 115, height: 122 },
          { x: 293, y: 4, width: 116, height: 122 },
          { x: 455, y: 4, width: 116, height: 122 },
          { x: 618, y: 4, width: 116, height: 122 }
        ],
        left: [
          { x: 120, y: 122, width: 120, height: 110 },
          { x: 284, y: 122, width: 123, height: 110 },
          { x: 444, y: 122, width: 122, height: 110 },
          { x: 606, y: 122, width: 122, height: 110 }
        ],
        right: [
          { x: 123, y: 232, width: 117, height: 106 },
          { x: 290, y: 232, width: 116, height: 106 },
          { x: 452, y: 232, width: 117, height: 106 },
          { x: 617, y: 232, width: 114, height: 106 }
        ],
        up: [
          { x: 119, y: 344, width: 117, height: 106 },
          { x: 295, y: 344, width: 110, height: 106 },
          { x: 454, y: 344, width: 112, height: 106 },
          { x: 622, y: 344, width: 112, height: 106 }
        ]
      }
    }
  };

  const TILE_INDEXES = {
    floor: [0, 0],
    crackedFloor: [1, 0],
    wall: [2, 0],
    wallTop: [3, 0],
    wallLeft: [4, 0],
    wallRight: [5, 0],
    wallCorner: [6, 0],
    fog: [7, 0],
    player: [0, 1],
    goblin: [1, 1],
    skeleton: [2, 1],
    slime: [3, 1],
    lootBag: [4, 1],
    treasure: [5, 1],
    closedChest: [6, 1],
    openChest: [7, 1],
    door: [0, 2],
    ironDoor: [1, 2],
    stairsUp: [2, 2],
    stairsDown: [3, 2],
    unlitTorch: [4, 2],
    litTorch: [5, 2],
    spikeTrap: [6, 2],
    pitTrap: [7, 2],
    potion: [0, 3],
    tome: [1, 3],
    sword: [2, 3],
    spear: [3, 3],
    dagger: [4, 3],
    shield: [5, 3],
    altar: [6, 3],
    portal: [7, 3]
  };

  const ENTITY_SPRITES = {
    player: {
      source: { x: 13, y: 358, width: 132, height: 160 },
      underlay: "floor"
    }
  };

  const SYMBOL_TILES = {
    "#": "wall",
    ".": "floor",
    " ": "floor",
    "?": "fog"
  };

  const FALLBACK_COLORS = {
    "#": "#343a40",
    ".": "#1d2428",
    " ": "#1d2428",
    "?": "#08090b"
  };
  const ENTITY_FALLBACK_COLORS = {
    player: "#f8f5c7",
    portal: "#7dd3fc",
    stairsUp: "#38bdf8",
    stairsDown: "#f59e0b",
    lootBag: "#facc15",
    goblin: "#f87171"
  };
  const FOG_DOTS = [
    [3, 4, 10, 0.28],
    [15, 2, 12, 0.2],
    [25, 9, 9, 0.16],
    [7, 20, 13, 0.22],
    [22, 24, 11, 0.18]
  ];

  function create(canvas) {
    const context = canvas?.getContext?.("2d");
    const tileset = new Image();
    const classImages = new Map();
    const classSpriteCache = new WeakMap();
    const enemyImages = new Map();
    const renderer = {
      ready: false,
      enemiesReady: false,
      failed: false,
      animationFrame: null,
      playerDirection: "down",
      enemyManifest: {},
      lastViewport: null,
      lastOptions: {},
      lastRows: [],
      lastEntities: [],
      render(viewport, options = {}) {
        if (!context || !validViewport(viewport)) return false;

        const rows = normalizeRows(rowsFromViewport(viewport));
        const entities = viewport.entities || [];
        renderer.lastViewport = viewport;
        renderer.lastOptions = options;
        renderer.lastRows = rows;
        renderer.lastEntities = entities;
        const columns = Math.max(...rows.map(row => row.length));
        canvas.width = columns * TILE_WIDTH;
        canvas.height = rows.length * TILE_HEIGHT;
        canvas.style.aspectRatio = `${canvas.width} / ${canvas.height}`;
        context.imageSmoothingEnabled = false;
        context.clearRect(0, 0, canvas.width, canvas.height);

        rows.forEach((row, y) => {
          [...row.padEnd(columns, "?")].forEach((symbol, x) => {
            drawSymbol(context, tileset, renderer.ready, rows, symbol, x, y);
          });
        });
        drawEntities(context, renderer, enemyImages, classImages, classSpriteCache, tileset, entities, options);
        if (options.playerDead) drawDeathOverlay(context, canvas);

        return true;
      },
      animateAttack(source, effect = "magic") {
        if (!context || !renderer.lastViewport) return false;

        const points = combatPoints(renderer, source);
        if (!points) return false;

        if (renderer.animationFrame) cancelAnimationFrame(renderer.animationFrame);
        const startedAt = performance.now();

        function drawFrame(now) {
          const progress = Math.min(1, (now - startedAt) / ATTACK_ANIMATION_MS);
          renderer.render(renderer.lastViewport, renderer.lastOptions);
          drawAttackTrace(context, points.from, points.to, progress, source, effect);
          if (renderer.lastOptions.playerDead) drawDeathOverlay(context, canvas);

          if (progress < 1) {
            renderer.animationFrame = requestAnimationFrame(drawFrame);
          } else {
            renderer.animationFrame = null;
            renderer.render(renderer.lastViewport, renderer.lastOptions);
          }
        }

        renderer.animationFrame = requestAnimationFrame(drawFrame);
        return true;
      },
      clearAttackAnimation() {
        if (renderer.animationFrame) cancelAnimationFrame(renderer.animationFrame);
        renderer.animationFrame = null;
        rerender(renderer);
      }
    };

    tileset.onload = () => {
      renderer.ready = true;
      canvas.dispatchEvent(new CustomEvent("tileset:ready"));
    };
    tileset.onerror = () => {
      renderer.failed = true;
      canvas.dispatchEvent(new CustomEvent("tileset:failed"));
    };
    tileset.src = TILESET_PATH;
    loadEnemyManifest(renderer, enemyImages, canvas);

    return renderer;
  }

  function normalizeRows(mapRows) {
    return mapRows.map(row => String(row).replace(/ /g, "."));
  }

  function validViewport(viewport) {
    return Boolean(viewport?.terrain && Number.isInteger(viewport.width) && Number.isInteger(viewport.height));
  }

  function rowsFromViewport(viewport) {
    const terrain = String(viewport.terrain || "").padEnd(viewport.width * viewport.height, "?");
    return Array.from({ length: viewport.height }, (_, rowIndex) => {
      const start = rowIndex * viewport.width;
      return terrain.slice(start, start + viewport.width);
    });
  }

  function drawSymbol(context, tileset, tilesetReady, rows, symbol, x, y) {
    if (symbol === "?") {
      drawFog(context, x, y);
      return;
    }

    const tileName = tileNameForSymbol(rows, symbol, x, y);

    if (tilesetReady) {
      drawTile(context, tileset, tileName, x, y);
      return;
    }

    context.fillStyle = FALLBACK_COLORS[symbol] || FALLBACK_COLORS["?"];
    context.fillRect(tileOriginX(x), tileOriginY(y), TILE_WIDTH, TILE_HEIGHT);
  }

  function tileNameForSymbol(rows, symbol, x, y) {
    if (symbol === "#") return wallTileName(rows, x, y);
    if (symbol === "." || symbol === " ") return floorTileName(x, y);
    return SYMBOL_TILES[symbol] || "fog";
  }

  function floorTileName(x, y) {
    return ((x * 17) + (y * 31)) % 11 === 0 ? "crackedFloor" : "floor";
  }

  function wallTileName(rows, x, y) {
    const northOpen = openTerrainAt(rows, x, y - 1);
    const southOpen = openTerrainAt(rows, x, y + 1);
    const westOpen = openTerrainAt(rows, x - 1, y);
    const eastOpen = openTerrainAt(rows, x + 1, y);

    if (southOpen && (westOpen || eastOpen)) return "wallCorner";
    if (southOpen) return "wallTop";
    if (eastOpen && !westOpen) return "wallLeft";
    if (westOpen && !eastOpen) return "wallRight";
    if (northOpen && (westOpen || eastOpen)) return "wallCorner";
    if (eastOpen) return "wallLeft";
    if (westOpen) return "wallRight";
    return ((x + y) % 5 === 0) ? "wallTop" : "wall";
  }

  function openTerrainAt(rows, x, y) {
    if (y < 0 || y >= rows.length) return false;
    const symbol = rows[y]?.[x];
    return symbol === "." || symbol === " ";
  }

  function drawFog(context, x, y) {
    const originX = tileOriginX(x);
    const originY = tileOriginY(y);
    const noiseSeed = (x * 37 + y * 53) % 11;

    context.fillStyle = "#020305";
    context.fillRect(originX, originY, TILE_WIDTH, TILE_HEIGHT);
    context.fillStyle = "rgba(0, 0, 0, 0.55)";
    context.fillRect(originX, originY, TILE_WIDTH, TILE_HEIGHT);

    FOG_DOTS.forEach(([dotX, dotY, radius, alpha], index) => {
      const shiftedX = originX + ((((dotX + noiseSeed + index * 3) % TILE_REFERENCE_SIZE) / TILE_REFERENCE_SIZE) * TILE_WIDTH);
      const shiftedY = originY + ((((dotY + noiseSeed * 2 + index * 5) % TILE_REFERENCE_SIZE) / TILE_REFERENCE_SIZE) * TILE_HEIGHT);
      const gradient = context.createRadialGradient(shiftedX, shiftedY, 0, shiftedX, shiftedY, scaleReference(radius));
      gradient.addColorStop(0, `rgba(32, 36, 48, ${alpha})`);
      gradient.addColorStop(0.55, `rgba(9, 11, 17, ${alpha * 0.55})`);
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = gradient;
      context.fillRect(originX, originY, TILE_WIDTH, TILE_HEIGHT);
    });

    context.fillStyle = "rgba(0, 0, 0, 0.38)";
    context.fillRect(originX, originY, TILE_WIDTH, 2);
    context.fillRect(originX, originY + TILE_HEIGHT - 2, TILE_WIDTH, 2);
    context.fillRect(originX, originY, 2, TILE_HEIGHT);
    context.fillRect(originX + TILE_WIDTH - 2, originY, 2, TILE_HEIGHT);
  }

  function loadEnemyManifest(renderer, enemyImages, canvas) {
    fetch(ENEMY_MANIFEST_PATH)
      .then(response => (response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`))))
      .then(manifest => {
        renderer.enemyManifest = manifest;
        renderer.enemiesReady = true;
        canvas.dispatchEvent(new CustomEvent("enemies:ready"));
        rerender(renderer);
      })
      .catch(() => {
        renderer.enemiesReady = false;
        canvas.dispatchEvent(new CustomEvent("enemies:failed"));
      });
  }

  function drawEntities(context, renderer, enemyImages, classImages, classSpriteCache, tileset, entities, options) {
    [...entities].sort(compareEntitiesForDrawing).forEach(entity => {
      if (entity.type === "enemy") {
        drawEnemy(context, renderer, enemyImages, tileset, entity);
        return;
      }
      if (entity.type === "player") {
        drawPlayer(context, renderer, tileset, classImages, classSpriteCache, entity, options.playerClass, options.playerDirection);
        return;
      }

      const tileName = ENTITY_TILES[entity.type];
      if (tileName) drawEntityTile(context, renderer.ready ? tileset : null, tileName, entity.x, entity.y);
    });
  }

  const ENTITY_TILES = {
    player: "player",
    portal: "portal",
    ascent: "stairsUp",
    descent: "stairsDown",
    loot: "lootBag"
  };

  function compareEntitiesForDrawing(left, right) {
    return entityPriority(left.type) - entityPriority(right.type);
  }

  function entityPriority(type) {
    return {
      portal: 10,
      ascent: 10,
      descent: 10,
      loot: 20,
      enemy: 30,
      player: 40
    }[type] || 0;
  }

  function drawEnemy(context, renderer, enemyImages, tileset, enemy) {
    const image = imageForEnemy(renderer, enemyImages, enemy.creature_id);
    if (image?.complete && image.naturalWidth > 0) {
      drawEnemyImage(context, image, renderer.ready ? tileset : null, enemy.x, enemy.y);
      return;
    }

    drawEntityTile(context, renderer.ready ? tileset : null, "goblin", enemy.x, enemy.y);
  }

  function drawPlayer(context, renderer, tileset, classImages, classSpriteCache, player, playerClass, playerDirection) {
    const classKey = classSpriteKey(playerClass);
    const classImage = imageForClass(renderer, classImages, classKey);
    if (!classImage?.complete || classImage.naturalWidth <= 0) {
      drawEntityTile(context, renderer.ready ? tileset : null, "player", player.x, player.y);
      return;
    }

    if (renderer.ready) drawTile(context, tileset, "floor", player.x, player.y);
    const action = "walk";
    const direction = normalizeDirection(playerDirection || renderer.playerDirection) || "down";
    const source = classSpriteSourceRect(classKey, action, direction, 0);
    const target = renderer.ready
      ? classSpriteTargetRect(tileset, source, player.x, player.y, classKey)
      : unscaledTileActorTargetRect(source.width, source.height, player.x, player.y);
    const sprite = chromaKeyedClassSprite(classImage, classSpriteCache, source);
    drawClassSprite(context, sprite, target, classSpriteFlipX(classKey, action, direction));
  }

  function classSpriteSourceRect(classKey, action = "walk", playerDirection = "down", frameIndex = 0) {
    const direction = normalizeDirection(playerDirection) || "down";
    const frames = CLASS_SPRITE_COORDINATES[classKey]?.[action]?.[direction] ||
      CLASS_SPRITE_COORDINATES.adventurer.walk.down;
    return frames[frameIndex % frames.length] || frames[0];
  }

  function classSpriteKey(playerClass) {
    const key = String(playerClass || "adventurer").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
    return Object.hasOwn(CLASS_SPRITE_FILES, key) ? key : "adventurer";
  }

  function imageForClass(renderer, classImages, key) {
    if (classImages.has(key)) return classImages.get(key);

    const image = new Image();
    image.onload = () => rerender(renderer);
    image.src = `${CLASS_SPRITE_PATH_PREFIX}${CLASS_SPRITE_FILES[key]}`;
    classImages.set(key, image);
    return image;
  }

  function chromaKeyedClassSprite(image, classSpriteCache, source) {
    let imageCache = classSpriteCache.get(image);
    if (!imageCache) {
      imageCache = new Map();
      classSpriteCache.set(image, imageCache);
    }

    const cacheKey = `${source.x},${source.y},${source.width},${source.height}`;
    if (imageCache.has(cacheKey)) return imageCache.get(cacheKey);

    const canvas = document.createElement("canvas");
    canvas.width = source.width;
    canvas.height = source.height;
    const context = canvas.getContext("2d");
    context.imageSmoothingEnabled = false;
    context.drawImage(image, source.x, source.y, source.width, source.height, 0, 0, source.width, source.height);

    const sprite = context.getImageData(0, 0, source.width, source.height);
    for (let index = 0; index < sprite.data.length; index += 4) {
      const red = sprite.data[index];
      const green = sprite.data[index + 1];
      const blue = sprite.data[index + 2];
      if (red <= CLASS_CHROMA_KEY.redMax && green >= CLASS_CHROMA_KEY.greenMin && blue <= CLASS_CHROMA_KEY.blueMax) {
        sprite.data[index + 3] = 0;
      }
    }
    context.putImageData(sprite, 0, 0);
    imageCache.set(cacheKey, canvas);
    return canvas;
  }

  function classSpriteFlipX(classKey, action, direction) {
    return CLASS_SPRITE_FLIPS[classKey]?.[action]?.[direction] === true;
  }

  function drawClassSprite(context, sprite, target, flipX = false) {
    if (!flipX) {
      context.drawImage(sprite, target.x, target.y, target.width, target.height);
      return;
    }

    context.save();
    context.translate(target.x + target.width, target.y);
    context.scale(-1, 1);
    context.drawImage(sprite, 0, 0, target.width, target.height);
    context.restore();
  }

  function normalizeDirection(direction) {
    return ["up", "right", "down", "left"].includes(direction) ? direction : null;
  }

  function imageForEnemy(renderer, enemyImages, creatureId) {
    const entry = renderer.enemyManifest[creatureId];
    if (!entry?.sprite) return null;
    if (enemyImages.has(creatureId)) return enemyImages.get(creatureId);

    const image = new Image();
    image.onload = () => rerender(renderer);
    image.src = entry.sprite;
    enemyImages.set(creatureId, image);
    return image;
  }

  function drawEnemyImage(context, image, tileset, x, y) {
    const target = tileset
      ? enemySpriteTargetRect(tileset, image, x, y)
      : containedTileRect(image.naturalWidth, image.naturalHeight, x, y);
    context.drawImage(
      image,
      target.x,
      target.y,
      target.width,
      target.height
    );
  }

  function combatPoints(renderer, source) {
    const player = firstEntityPosition(renderer.lastEntities, "player");
    const enemy = firstEntityPosition(renderer.lastEntities, "enemy");
    if (!player || !enemy) return null;

    return source === "enemy"
      ? { from: tileCenter(enemy), to: tileCenter(player) }
      : { from: tileCenter(player), to: tileCenter(enemy) };
  }

  function firstEntityPosition(entities, type) {
    const entity = entities.find(entry => entry.type === type);
    return entity ? { x: entity.x, y: entity.y } : null;
  }

  function tileCenter(position) {
    return {
      x: tileOriginX(position.x) + (TILE_WIDTH / 2),
      y: tileOriginY(position.y) + (TILE_HEIGHT / 2)
    };
  }

  function drawAttackTrace(context, from, to, progress, source, effect = "magic") {
    if (effect === "slash") {
      drawSlashTrace(context, from, to, progress, source);
      return;
    }

    drawMagicTrace(context, from, to, progress, source);
  }

  function drawMagicTrace(context, from, to, progress, source) {
    const eased = 1 - ((1 - progress) ** 2);
    const head = interpolatePoint(from, to, eased);
    const tail = interpolatePoint(from, to, Math.max(0, eased - 0.28));
    const color = source === "enemy" ? "255, 51, 51" : "255, 242, 102";

    context.save();
    context.globalCompositeOperation = "lighter";
    context.lineCap = "round";
    context.strokeStyle = `rgba(${color}, ${1 - (progress * 0.45)})`;
    context.shadowColor = `rgba(${color}, 0.8)`;
    context.shadowBlur = 12;
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(tail.x, tail.y);
    context.lineTo(head.x, head.y);
    context.stroke();

    context.fillStyle = `rgba(${color}, ${1 - (progress * 0.25)})`;
    context.beginPath();
    context.arc(head.x, head.y, 4 + (progress * 5), 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawSlashTrace(context, from, to, progress, source) {
    const eased = 1 - ((1 - progress) ** 2);
    const center = interpolatePoint(from, to, Math.min(1, 0.35 + (eased * 0.65)));
    const alpha = 1 - (progress * 0.55);
    const color = source === "enemy" ? "255, 77, 77" : "244, 245, 246";
    const angle = source === "enemy" ? -Math.PI / 4 : Math.PI / 4;
    const length = Math.min(TILE_WIDTH, TILE_HEIGHT) * (0.35 + (progress * 0.45));
    const spread = Math.min(TILE_WIDTH, TILE_HEIGHT) * 0.14;

    context.save();
    context.globalCompositeOperation = "lighter";
    context.lineCap = "round";
    context.strokeStyle = `rgba(${color}, ${alpha})`;
    context.shadowColor = `rgba(${color}, 0.75)`;
    context.shadowBlur = 10;
    context.lineWidth = 4;

    drawSlashLine(context, center, angle, length);
    context.lineWidth = 2;
    drawSlashLine(
      context,
      {
        x: center.x + (Math.cos(angle + (Math.PI / 2)) * spread),
        y: center.y + (Math.sin(angle + (Math.PI / 2)) * spread)
      },
      angle,
      length * 0.72
    );

    context.restore();
  }

  function drawSlashLine(context, center, angle, length) {
    const offsetX = Math.cos(angle) * length;
    const offsetY = Math.sin(angle) * length;

    context.beginPath();
    context.moveTo(center.x - offsetX, center.y - offsetY);
    context.lineTo(center.x + offsetX, center.y + offsetY);
    context.stroke();
  }

  function interpolatePoint(from, to, progress) {
    return {
      x: from.x + ((to.x - from.x) * progress),
      y: from.y + ((to.y - from.y) * progress)
    };
  }

  function rerender(renderer) {
    if (renderer.lastViewport) renderer.render(renderer.lastViewport, renderer.lastOptions);
  }

  function drawDeathOverlay(context, canvas) {
    context.save();
    context.fillStyle = "rgba(0, 0, 0, 0.68)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.restore();
  }

  function drawTile(context, tileset, tileName, x, y) {
    const [tileX, tileY] = TILE_INDEXES[tileName] || TILE_INDEXES.fog;
    if (!tileset) {
      context.fillStyle = ENTITY_FALLBACK_COLORS[tileName] || FALLBACK_COLORS["?"];
      context.fillRect(tileOriginX(x), tileOriginY(y), TILE_WIDTH, TILE_HEIGHT);
      return;
    }
    const sourceRect = sourceRectForTile(tileset, tileX, tileY);

    context.drawImage(
      tileset,
      sourceRect.x,
      sourceRect.y,
      sourceRect.width,
      sourceRect.height,
      tileOriginX(x),
      tileOriginY(y),
      TILE_WIDTH,
      TILE_HEIGHT
    );
  }

  function drawEntityTile(context, tileset, tileName, x, y) {
    const sprite = ENTITY_SPRITES[tileName];
    if (!sprite || !tileset) {
      drawTile(context, tileset, tileName, x, y);
      return;
    }

    if (sprite.underlay) drawTile(context, tileset, sprite.underlay, x, y);
    const sourceRect = entitySpriteSourceRect(tileset, tileName);
    const targetRect = entitySpriteTargetRect(tileset, tileName, x, y);

    context.drawImage(
      tileset,
      sourceRect.x,
      sourceRect.y,
      sourceRect.width,
      sourceRect.height,
      targetRect.x,
      targetRect.y,
      targetRect.width,
      targetRect.height
    );
  }

  function entitySpriteSourceRect(tileset, tileName) {
    return scaledSourceRect(tileset, ENTITY_SPRITES[tileName].source);
  }

  function entitySpriteTargetRect(tileset, tileName, x, y) {
    return spriteTargetRect(tileset, tileName, entitySpriteSourceRect(tileset, tileName), x, y);
  }

  function enemySpriteTargetRect(tileset, image, x, y) {
    return scaledActorTargetRect(tileset, image.naturalWidth, image.naturalHeight, x, y);
  }

  function classSpriteTargetRect(tileset, source, x, y, classKey = "adventurer") {
    const playerTarget = entitySpriteTargetRect(tileset, "player", x, y);
    const scale = CLASS_SPRITE_SCALE_OVERRIDES[classKey] || CLASS_SPRITE_SCALE;
    const width = source.width * scale;
    const height = source.height * scale;

    return {
      x: playerTarget.x + Math.round((playerTarget.width - width) / 2),
      y: playerTarget.y + playerTarget.height - height,
      width,
      height
    };
  }

  function scaledActorTargetRect(tileset, sourceWidth, sourceHeight, x, y) {
    const playerTarget = entitySpriteTargetRect(tileset, "player", x, y);
    const height = playerTarget.height * ENEMY_HEIGHT_SCALE;
    const width = height * (sourceWidth / sourceHeight);

    return {
      x: playerTarget.x + Math.round((playerTarget.width - width) / 2),
      y: playerTarget.y + playerTarget.height - height,
      width,
      height
    };
  }

  function spriteTargetRect(tileset, tileName, sourceRect, x, y) {
    const [tileX, tileY] = TILE_INDEXES[tileName] || TILE_INDEXES.floor;
    const sourceCell = sourceRectForTile(tileset, tileX, tileY);

    return {
      x: tileOriginX(x) + (((sourceRect.x - sourceCell.x) / sourceCell.width) * TILE_WIDTH),
      y: tileOriginY(y) + (((sourceRect.y - sourceCell.y) / sourceCell.height) * TILE_HEIGHT),
      width: (sourceRect.width / sourceCell.width) * TILE_WIDTH,
      height: (sourceRect.height / sourceCell.height) * TILE_HEIGHT
    };
  }

  function unscaledTileActorTargetRect(sourceWidth, sourceHeight, x, y) {
    return {
      x: tileOriginX(x) + Math.round((TILE_WIDTH - sourceWidth) / 2),
      y: tileOriginY(y) + TILE_HEIGHT - sourceHeight,
      width: sourceWidth,
      height: sourceHeight
    };
  }

  function sourceRectForTile(tileset, tileX, tileY) {
    const column = TILESET_SOURCE_COLUMNS[tileX] || TILESET_SOURCE_COLUMNS[0];
    const row = TILESET_SOURCE_ROWS[tileY] || TILESET_SOURCE_ROWS[0];
    const scaleX = tileset.naturalWidth / TILESET_SOURCE_SIZE.width;
    const scaleY = tileset.naturalHeight / TILESET_SOURCE_SIZE.height;

    return {
      x: column.x * scaleX,
      y: row.y * scaleY,
      width: column.width * scaleX,
      height: row.height * scaleY
    };
  }

  function scaledSourceRect(tileset, source) {
    const scaleX = tileset.naturalWidth / TILESET_SOURCE_SIZE.width;
    const scaleY = tileset.naturalHeight / TILESET_SOURCE_SIZE.height;

    return {
      x: source.x * scaleX,
      y: source.y * scaleY,
      width: source.width * scaleX,
      height: source.height * scaleY
    };
  }

  function containedTileRect(sourceWidth, sourceHeight, x, y) {
    const sourceRatio = sourceWidth / sourceHeight;
    const tileRatio = TILE_WIDTH / TILE_HEIGHT;
    const width = sourceRatio > tileRatio ? TILE_WIDTH : Math.round(TILE_HEIGHT * sourceRatio);
    const height = sourceRatio > tileRatio ? Math.round(TILE_WIDTH / sourceRatio) : TILE_HEIGHT;

    return {
      x: tileOriginX(x) + Math.round((TILE_WIDTH - width) / 2),
      y: tileOriginY(y) + TILE_HEIGHT - height,
      width,
      height
    };
  }

  function tileOriginX(x) {
    return x * TILE_WIDTH;
  }

  function tileOriginY(y) {
    return y * TILE_HEIGHT;
  }

  function scaleReference(value) {
    return value * (Math.max(TILE_WIDTH, TILE_HEIGHT) / TILE_REFERENCE_SIZE);
  }

  return {
    create,
    symbolTiles: SYMBOL_TILES,
    tileIndexes: TILE_INDEXES,
    entitySprites: ENTITY_SPRITES,
    tileSize: { width: TILE_WIDTH, height: TILE_HEIGHT },
    tilesetSourceColumns: TILESET_SOURCE_COLUMNS,
    tilesetSourceRows: TILESET_SOURCE_ROWS,
    tilesetPath: TILESET_PATH,
    classSpritePathPrefix: CLASS_SPRITE_PATH_PREFIX,
    enemyManifestPath: ENEMY_MANIFEST_PATH
  };
})();
