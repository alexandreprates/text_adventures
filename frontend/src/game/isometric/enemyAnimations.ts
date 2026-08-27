export type EnemyAnimationAction = "attack" | "death";

type EnemyActionSheet = {
  path: string;
  baselines: readonly [number, number, number, number];
};

export type EnemyAnimation = Record<EnemyAnimationAction, EnemyActionSheet>;

export const enemyAnimationRegistry = {
  giant_spider: {
    attack: {
      path: "/assets/isometric/enemies/giant_spider-attack.png",
      baselines: [103, 112, 94, 96],
    },
    death: {
      path: "/assets/isometric/enemies/giant_spider-death.png",
      baselines: [112, 109, 79, 76],
    },
  },
  orc_raider: {
    attack: {
      path: "/assets/isometric/enemies/orc_raider-attack.png",
      baselines: [121, 119, 117, 104],
    },
    death: {
      path: "/assets/isometric/enemies/orc_raider-death.png",
      baselines: [119, 116, 103, 106],
    },
  },
  orc_berserker: {
    attack: {
      path: "/assets/isometric/enemies/orc_berserker-attack.png",
      baselines: [117, 116, 106, 106],
    },
    death: {
      path: "/assets/isometric/enemies/orc_berserker-death.png",
      baselines: [118, 125, 108, 108],
    },
  },
  kobold_trapper: {
    attack: {
      path: "/assets/isometric/enemies/kobold_trapper-attack.png",
      baselines: [116, 115, 86, 88],
    },
    death: {
      path: "/assets/isometric/enemies/kobold_trapper-death.png",
      baselines: [114, 112, 88, 90],
    },
  },
  kobold_sparkmage: {
    attack: {
      path: "/assets/isometric/enemies/kobold_sparkmage-attack.png",
      baselines: [116, 114, 105, 105],
    },
    death: {
      path: "/assets/isometric/enemies/kobold_sparkmage-death.png",
      baselines: [120, 120, 88, 92],
    },
  },
  gnoll_hunter: {
    attack: {
      path: "/assets/isometric/enemies/gnoll_hunter-attack.png",
      baselines: [109, 107, 97, 99],
    },
    death: {
      path: "/assets/isometric/enemies/gnoll_hunter-death.png",
      baselines: [113, 113, 105, 105],
    },
  },
  gnoll_bonecaller: {
    attack: {
      path: "/assets/isometric/enemies/gnoll_bonecaller-attack.png",
      baselines: [119, 119, 106, 111],
    },
    death: {
      path: "/assets/isometric/enemies/gnoll_bonecaller-death.png",
      baselines: [116, 115, 79, 80],
    },
  },
  wight_knight: {
    attack: {
      path: "/assets/isometric/enemies/wight_knight-attack.png",
      baselines: [120, 120, 107, 106],
    },
    death: {
      path: "/assets/isometric/enemies/wight_knight-death.png",
      baselines: [118, 116, 96, 104],
    },
  },
  ghoul_stalker: {
    attack: {
      path: "/assets/isometric/enemies/ghoul_stalker-attack.png",
      baselines: [125, 121, 108, 103],
    },
    death: {
      path: "/assets/isometric/enemies/ghoul_stalker-death.png",
      baselines: [125, 122, 88, 89],
    },
  },
  zombie_brute: {
    attack: {
      path: "/assets/isometric/enemies/zombie_brute-attack.png",
      baselines: [124, 123, 108, 114],
    },
    death: {
      path: "/assets/isometric/enemies/zombie_brute-death.png",
      baselines: [124, 121, 101, 107],
    },
  },
  shadow_imp: {
    attack: {
      path: "/assets/isometric/enemies/shadow_imp-attack.png",
      baselines: [118, 124, 108, 115],
    },
    death: {
      path: "/assets/isometric/enemies/shadow_imp-death.png",
      baselines: [113, 113, 84, 83],
    },
  },
  brimstone_imp: {
    attack: {
      path: "/assets/isometric/enemies/brimstone_imp-attack.png",
      baselines: [112, 114, 98, 99],
    },
    death: {
      path: "/assets/isometric/enemies/brimstone_imp-death.png",
      baselines: [124, 120, 94, 95],
    },
  },
  lesser_demon: {
    attack: {
      path: "/assets/isometric/enemies/lesser_demon-attack.png",
      baselines: [120, 120, 109, 107],
    },
    death: {
      path: "/assets/isometric/enemies/lesser_demon-death.png",
      baselines: [126, 117, 94, 94],
    },
  },
  forest_sprite: {
    attack: {
      path: "/assets/isometric/enemies/forest_sprite-attack.png",
      baselines: [118, 119, 104, 106],
    },
    death: {
      path: "/assets/isometric/enemies/forest_sprite-death.png",
      baselines: [113, 117, 94, 95],
    },
  },
  pixie_trickster: {
    attack: {
      path: "/assets/isometric/enemies/pixie_trickster-attack.png",
      baselines: [119, 106, 95, 104],
    },
    death: {
      path: "/assets/isometric/enemies/pixie_trickster-death.png",
      baselines: [109, 114, 91, 93],
    },
  },
  satyr_duelist: {
    attack: {
      path: "/assets/isometric/enemies/satyr_duelist-attack.png",
      baselines: [116, 114, 100, 105],
    },
    death: {
      path: "/assets/isometric/enemies/satyr_duelist-death.png",
      baselines: [123, 123, 101, 106],
    },
  },
  dryad_thornweaver: {
    attack: {
      path: "/assets/isometric/enemies/dryad_thornweaver-attack.png",
      baselines: [114, 114, 100, 101],
    },
    death: {
      path: "/assets/isometric/enemies/dryad_thornweaver-death.png",
      baselines: [109, 110, 97, 103],
    },
  },
  fae_blade_dancer: {
    attack: {
      path: "/assets/isometric/enemies/fae_blade_dancer-attack.png",
      baselines: [119, 118, 103, 104],
    },
    death: {
      path: "/assets/isometric/enemies/fae_blade_dancer-death.png",
      baselines: [116, 118, 95, 100],
    },
  },
  dire_wolf: {
    attack: {
      path: "/assets/isometric/enemies/dire_wolf-attack.png",
      baselines: [109, 109, 90, 95],
    },
    death: {
      path: "/assets/isometric/enemies/dire_wolf-death.png",
      baselines: [116, 121, 82, 85],
    },
  },
  owlbear_cub: {
    attack: {
      path: "/assets/isometric/enemies/owlbear_cub-attack.png",
      baselines: [115, 115, 96, 98],
    },
    death: {
      path: "/assets/isometric/enemies/owlbear_cub-death.png",
      baselines: [109, 109, 81, 81],
    },
  },
  cave_troll: {
    attack: {
      path: "/assets/isometric/enemies/cave_troll-attack.png",
      baselines: [110, 110, 88, 84],
    },
    death: {
      path: "/assets/isometric/enemies/cave_troll-death.png",
      baselines: [106, 109, 82, 89],
    },
  },
  hill_giant_youth: {
    attack: {
      path: "/assets/isometric/enemies/hill_giant_youth-attack.png",
      baselines: [115, 112, 103, 104],
    },
    death: {
      path: "/assets/isometric/enemies/hill_giant_youth-death.png",
      baselines: [111, 112, 95, 99],
    },
  },
  minotaur_guardian: {
    attack: {
      path: "/assets/isometric/enemies/minotaur_guardian-attack.png",
      baselines: [116, 114, 103, 104],
    },
    death: {
      path: "/assets/isometric/enemies/minotaur_guardian-death.png",
      baselines: [119, 121, 107, 107],
    },
  },
  ogre_marauder: {
    attack: {
      path: "/assets/isometric/enemies/ogre_marauder-attack.png",
      baselines: [112, 111, 104, 102],
    },
    death: {
      path: "/assets/isometric/enemies/ogre_marauder-death.png",
      baselines: [113, 118, 107, 101],
    },
  },
  lizardfolk_scout: {
    attack: {
      path: "/assets/isometric/enemies/lizardfolk_scout-attack.png",
      baselines: [110, 105, 91, 101],
    },
    death: {
      path: "/assets/isometric/enemies/lizardfolk_scout-death.png",
      baselines: [116, 116, 95, 100],
    },
  },
  naga_apprentice: {
    attack: {
      path: "/assets/isometric/enemies/naga_apprentice-attack.png",
      baselines: [115, 114, 104, 106],
    },
    death: {
      path: "/assets/isometric/enemies/naga_apprentice-death.png",
      baselines: [116, 111, 93, 95],
    },
  },
  yuan_ti_cutthroat: {
    attack: {
      path: "/assets/isometric/enemies/yuan_ti_cutthroat-attack.png",
      baselines: [112, 112, 102, 106],
    },
    death: {
      path: "/assets/isometric/enemies/yuan_ti_cutthroat-death.png",
      baselines: [113, 114, 95, 97],
    },
  },
  basilisk_hatchling: {
    attack: {
      path: "/assets/isometric/enemies/basilisk_hatchling-attack.png",
      baselines: [110, 110, 90, 91],
    },
    death: {
      path: "/assets/isometric/enemies/basilisk_hatchling-death.png",
      baselines: [112, 114, 87, 88],
    },
  },
  harpy_screecher: {
    attack: {
      path: "/assets/isometric/enemies/harpy_screecher-attack.png",
      baselines: [119, 121, 105, 108],
    },
    death: {
      path: "/assets/isometric/enemies/harpy_screecher-death.png",
      baselines: [110, 115, 96, 98],
    },
  },
  griffin_fledgling: {
    attack: {
      path: "/assets/isometric/enemies/griffin_fledgling-attack.png",
      baselines: [112, 110, 98, 99],
    },
    death: {
      path: "/assets/isometric/enemies/griffin_fledgling-death.png",
      baselines: [107, 106, 89, 87],
    },
  },
  manticore_whelp: {
    attack: {
      path: "/assets/isometric/enemies/manticore_whelp-attack.png",
      baselines: [114, 116, 101, 99],
    },
    death: {
      path: "/assets/isometric/enemies/manticore_whelp-death.png",
      baselines: [115, 115, 93, 94],
    },
  },
  wyvern_juvenile: {
    attack: {
      path: "/assets/isometric/enemies/wyvern_juvenile-attack.png",
      baselines: [100, 101, 91, 92],
    },
    death: {
      path: "/assets/isometric/enemies/wyvern_juvenile-death.png",
      baselines: [100, 102, 72, 72],
    },
  },
  dragon_wyrmling: {
    attack: {
      path: "/assets/isometric/enemies/dragon_wyrmling-attack.png",
      baselines: [97, 97, 78, 78],
    },
    death: {
      path: "/assets/isometric/enemies/dragon_wyrmling-death.png",
      baselines: [95, 97, 66, 66],
    },
  },
} as const satisfies Record<string, EnemyAnimation>;

export const enemyAnimationLayout = {
  frameWidth: 128,
  frameHeight: 128,
  columns: 2,
  rows: 2,
  phaseCount: 4,
  drawSize: 80,
} as const;

export function enemyAnimationFor(creatureId?: string): EnemyAnimation | null {
  const normalized = creatureId?.trim().toLowerCase();
  if (!normalized || !(normalized in enemyAnimationRegistry)) return null;

  return enemyAnimationRegistry[normalized as keyof typeof enemyAnimationRegistry];
}

export function enemyAnimationCell(phase: number): { column: number; row: number } {
  const normalized = Math.max(0, Math.min(enemyAnimationLayout.phaseCount - 1, phase));
  return {
    column: normalized % enemyAnimationLayout.columns,
    row: Math.floor(normalized / enemyAnimationLayout.columns),
  };
}
