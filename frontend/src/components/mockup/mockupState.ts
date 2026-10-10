import type { GameState } from "../../lib/types";

export type DemoScene = "exploration" | "combat" | "loot" | "town";

export const sceneLabels: Record<DemoScene, string> = {
  exploration: "Exploration",
  combat: "Combat",
  loot: "Loot",
  town: "Town",
};

export const initialMessages = [
  "You entered the ruins beneath Nee'Peh.",
  "A portal marks your way back to town.",
  "Footsteps echo beyond the eastern chamber.",
];

export function mockupState(
  scene: DemoScene,
  health: number,
  enemyHealth: number,
  gold: number,
): GameState {
  return {
    scene: scene === "town" ? "town" : "ruins",
    scene_display_name: scene === "town" ? "Nee'Peh" : "The Eastern Chamber",
    prompt: scene === "town" ? "Town" : "Ruins L1",
    player: {
      name: "Adventurer",
      current_class: "Adventurer",
      health: { current: health, max: 30 },
      mana: { current: 9, max: 12 },
      level: 3,
      xp: 68,
      gold,
      equipment: {
        weapon: { name: "Iron sword", attack: 10 },
        armor: { name: "Leather armor", defense: 12 },
      },
      inventory: [],
      spells: [],
      skills: {},
    },
    dungeon:
      scene === "town"
        ? null
        : {
            level: 1,
            viewport: {
              width: 11,
              height: 11,
              origin: { x: 0, y: 0 },
              theme: "stone_ruins",
              terrain: [
                "???????????",
                "?#####?????",
                "?#...#?????",
                "?#...#####?",
                "?#.......#?",
                "?###.....#?",
                "???#.....#?",
                "???#.....#?",
                "???#######?",
                "???????????",
                "???????????",
              ].join(""),
              decorations: [
                { kind: "torch", x: 2, y: 1 },
                { kind: "torch", x: 6, y: 3 },
                { kind: "barrel", x: 3, y: 2 },
                { kind: "rubble", x: 4, y: 7 },
              ],
              entities: [
                { type: "player", x: 5, y: 5 },
                { type: "portal", x: 2, y: 3 },
                { type: "descent", x: 8, y: 7 },
                ...(scene === "combat"
                  ? [
                      {
                        type: "enemy",
                        x: 7,
                        y: 5,
                        creature_id: "skeleton_guard",
                      },
                    ]
                  : []),
                ...(scene === "loot" ? [{ type: "loot", x: 7, y: 5 }] : []),
              ],
            },
          },
    battle: {
      active: scene === "combat",
      enemy: {
        name: "Skeleton guard",
        health: { current: enemyHealth, max: 24 },
      },
    },
  };
}
