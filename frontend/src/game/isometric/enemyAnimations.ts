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
