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
