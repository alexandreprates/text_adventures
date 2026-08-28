import { describe, expect, it } from "vitest";

import {
  enemyAnimationCell,
  enemyAnimationFor,
  enemyAnimationLayout,
  enemyAnimationRegistry,
} from "./enemyAnimations";

describe("enemy animations", () => {
  it("registers dedicated Giant Spider attack and death sheets", () => {
    expect(enemyAnimationRegistry.giant_spider).toEqual({
      attack: {
        path: "/assets/isometric/enemies/giant_spider-attack.png",
        baselines: [103, 112, 94, 96],
      },
      death: {
        path: "/assets/isometric/enemies/giant_spider-death.png",
        baselines: [112, 109, 79, 76],
      },
    });
    expect(enemyAnimationFor(" giant_spider ")).toBe(enemyAnimationRegistry.giant_spider);
    expect(enemyAnimationFor("unknown")).toBeNull();
  });

  it("registers dedicated Orc Raider attack and death sheets", () => {
    expect(enemyAnimationRegistry.orc_raider).toEqual({
      attack: {
        path: "/assets/isometric/enemies/orc_raider-attack.png",
        baselines: [121, 119, 117, 104],
      },
      death: {
        path: "/assets/isometric/enemies/orc_raider-death.png",
        baselines: [119, 116, 103, 106],
      },
    });
    expect(enemyAnimationFor("ORC_RAIDER")).toBe(enemyAnimationRegistry.orc_raider);
  });

  it("registers dedicated Orc Berserker attack and death sheets", () => {
    expect(enemyAnimationRegistry.orc_berserker).toEqual({
      attack: {
        path: "/assets/isometric/enemies/orc_berserker-attack.png",
        baselines: [117, 116, 106, 106],
      },
      death: {
        path: "/assets/isometric/enemies/orc_berserker-death.png",
        baselines: [118, 125, 108, 108],
      },
    });
    expect(enemyAnimationFor("orc_berserker")).toBe(enemyAnimationRegistry.orc_berserker);
  });

  it("registers dedicated Kobold Trapper attack and death sheets", () => {
    expect(enemyAnimationRegistry.kobold_trapper).toEqual({
      attack: {
        path: "/assets/isometric/enemies/kobold_trapper-attack.png",
        baselines: [116, 115, 86, 88],
      },
      death: {
        path: "/assets/isometric/enemies/kobold_trapper-death.png",
        baselines: [114, 112, 88, 90],
      },
    });
    expect(enemyAnimationFor("kobold_trapper")).toBe(enemyAnimationRegistry.kobold_trapper);
  });

  it("registers dedicated Kobold Sparkmage attack and death sheets", () => {
    expect(enemyAnimationRegistry.kobold_sparkmage).toEqual({
      attack: {
        path: "/assets/isometric/enemies/kobold_sparkmage-attack.png",
        baselines: [116, 114, 105, 105],
      },
      death: {
        path: "/assets/isometric/enemies/kobold_sparkmage-death.png",
        baselines: [120, 120, 88, 92],
      },
    });
    expect(enemyAnimationFor("kobold_sparkmage")).toBe(enemyAnimationRegistry.kobold_sparkmage);
  });

  it("registers dedicated Gnoll Hunter attack and death sheets", () => {
    expect(enemyAnimationRegistry.gnoll_hunter).toEqual({
      attack: {
        path: "/assets/isometric/enemies/gnoll_hunter-attack.png",
        baselines: [109, 107, 97, 99],
      },
      death: {
        path: "/assets/isometric/enemies/gnoll_hunter-death.png",
        baselines: [113, 113, 105, 105],
      },
    });
    expect(enemyAnimationFor("gnoll_hunter")).toBe(enemyAnimationRegistry.gnoll_hunter);
  });

  it("registers dedicated Gnoll Bonecaller attack and death sheets", () => {
    expect(enemyAnimationRegistry.gnoll_bonecaller).toEqual({
      attack: {
        path: "/assets/isometric/enemies/gnoll_bonecaller-attack.png",
        baselines: [119, 119, 106, 111],
      },
      death: {
        path: "/assets/isometric/enemies/gnoll_bonecaller-death.png",
        baselines: [116, 115, 79, 80],
      },
    });
    expect(enemyAnimationFor("gnoll_bonecaller")).toBe(enemyAnimationRegistry.gnoll_bonecaller);
  });

  it("registers dedicated Wight Knight attack and death sheets", () => {
    expect(enemyAnimationRegistry.wight_knight).toEqual({
      attack: {
        path: "/assets/isometric/enemies/wight_knight-attack.png",
        baselines: [120, 120, 107, 106],
      },
      death: {
        path: "/assets/isometric/enemies/wight_knight-death.png",
        baselines: [118, 116, 96, 104],
      },
    });
    expect(enemyAnimationFor("wight_knight")).toBe(enemyAnimationRegistry.wight_knight);
  });

  it("registers dedicated Ghoul Stalker attack and death sheets", () => {
    expect(enemyAnimationRegistry.ghoul_stalker).toEqual({
      attack: {
        path: "/assets/isometric/enemies/ghoul_stalker-attack.png",
        baselines: [125, 121, 108, 103],
      },
      death: {
        path: "/assets/isometric/enemies/ghoul_stalker-death.png",
        baselines: [125, 122, 88, 89],
      },
    });
    expect(enemyAnimationFor("ghoul_stalker")).toBe(enemyAnimationRegistry.ghoul_stalker);
  });

  it("registers dedicated Zombie Brute attack and death sheets", () => {
    expect(enemyAnimationRegistry.zombie_brute).toEqual({
      attack: {
        path: "/assets/isometric/enemies/zombie_brute-attack.png",
        baselines: [124, 123, 108, 114],
      },
      death: {
        path: "/assets/isometric/enemies/zombie_brute-death.png",
        baselines: [124, 121, 101, 107],
      },
    });
    expect(enemyAnimationFor("zombie_brute")).toBe(enemyAnimationRegistry.zombie_brute);
  });

  it("registers dedicated Shadow Imp attack and death sheets", () => {
    expect(enemyAnimationRegistry.shadow_imp).toEqual({
      attack: {
        path: "/assets/isometric/enemies/shadow_imp-attack.png",
        baselines: [118, 124, 108, 115],
      },
      death: {
        path: "/assets/isometric/enemies/shadow_imp-death.png",
        baselines: [113, 113, 84, 83],
      },
    });
    expect(enemyAnimationFor("shadow_imp")).toBe(enemyAnimationRegistry.shadow_imp);
  });

  it("registers dedicated Brimstone Imp attack and death sheets", () => {
    expect(enemyAnimationRegistry.brimstone_imp).toEqual({
      attack: {
        path: "/assets/isometric/enemies/brimstone_imp-attack.png",
        baselines: [112, 114, 98, 99],
      },
      death: {
        path: "/assets/isometric/enemies/brimstone_imp-death.png",
        baselines: [124, 120, 94, 95],
      },
    });
    expect(enemyAnimationFor("brimstone_imp")).toBe(enemyAnimationRegistry.brimstone_imp);
  });

  it("registers dedicated Lesser Demon attack and death sheets", () => {
    expect(enemyAnimationRegistry.lesser_demon).toEqual({
      attack: {
        path: "/assets/isometric/enemies/lesser_demon-attack.png",
        baselines: [120, 120, 109, 107],
      },
      death: {
        path: "/assets/isometric/enemies/lesser_demon-death.png",
        baselines: [126, 117, 94, 94],
      },
    });
    expect(enemyAnimationFor("lesser_demon")).toBe(enemyAnimationRegistry.lesser_demon);
  });

  it("registers dedicated Forest Sprite attack and death sheets", () => {
    expect(enemyAnimationRegistry.forest_sprite).toEqual({
      attack: {
        path: "/assets/isometric/enemies/forest_sprite-attack.png",
        baselines: [118, 119, 104, 106],
      },
      death: {
        path: "/assets/isometric/enemies/forest_sprite-death.png",
        baselines: [113, 117, 94, 95],
      },
    });
    expect(enemyAnimationFor("forest_sprite")).toBe(enemyAnimationRegistry.forest_sprite);
  });

  it("registers dedicated Pixie Trickster attack and death sheets", () => {
    expect(enemyAnimationRegistry.pixie_trickster).toEqual({
      attack: {
        path: "/assets/isometric/enemies/pixie_trickster-attack.png",
        baselines: [119, 106, 95, 104],
      },
      death: {
        path: "/assets/isometric/enemies/pixie_trickster-death.png",
        baselines: [109, 114, 91, 93],
      },
    });
    expect(enemyAnimationFor("pixie_trickster")).toBe(enemyAnimationRegistry.pixie_trickster);
  });

  it("registers dedicated Satyr Duelist attack and death sheets", () => {
    expect(enemyAnimationRegistry.satyr_duelist).toEqual({
      attack: {
        path: "/assets/isometric/enemies/satyr_duelist-attack.png",
        baselines: [116, 114, 100, 105],
      },
      death: {
        path: "/assets/isometric/enemies/satyr_duelist-death.png",
        baselines: [123, 123, 101, 106],
      },
    });
    expect(enemyAnimationFor("satyr_duelist")).toBe(enemyAnimationRegistry.satyr_duelist);
  });

  it("registers dedicated Dryad Thornweaver attack and death sheets", () => {
    expect(enemyAnimationRegistry.dryad_thornweaver).toEqual({
      attack: {
        path: "/assets/isometric/enemies/dryad_thornweaver-attack.png",
        baselines: [114, 114, 100, 101],
      },
      death: {
        path: "/assets/isometric/enemies/dryad_thornweaver-death.png",
        baselines: [109, 110, 97, 103],
      },
    });
    expect(enemyAnimationFor("DRYAD_THORNWEAVER")).toBe(
      enemyAnimationRegistry.dryad_thornweaver,
    );
  });

  it("registers dedicated Fae Blade Dancer attack and death sheets", () => {
    expect(enemyAnimationRegistry.fae_blade_dancer).toEqual({
      attack: {
        path: "/assets/isometric/enemies/fae_blade_dancer-attack.png",
        baselines: [119, 118, 103, 104],
      },
      death: {
        path: "/assets/isometric/enemies/fae_blade_dancer-death.png",
        baselines: [116, 118, 95, 100],
      },
    });
    expect(enemyAnimationFor(" FAE_BLADE_DANCER ")).toBe(
      enemyAnimationRegistry.fae_blade_dancer,
    );
  });

  it("registers dedicated Dire Wolf attack and death sheets", () => {
    expect(enemyAnimationRegistry.dire_wolf).toEqual({
      attack: {
        path: "/assets/isometric/enemies/dire_wolf-attack.png",
        baselines: [109, 109, 90, 95],
      },
      death: {
        path: "/assets/isometric/enemies/dire_wolf-death.png",
        baselines: [116, 121, 82, 85],
      },
    });
    expect(enemyAnimationFor("DIRE_WOLF")).toBe(enemyAnimationRegistry.dire_wolf);
  });

  it("registers dedicated Owlbear Cub attack and death sheets", () => {
    expect(enemyAnimationRegistry.owlbear_cub).toEqual({
      attack: {
        path: "/assets/isometric/enemies/owlbear_cub-attack.png",
        baselines: [115, 115, 96, 98],
      },
      death: {
        path: "/assets/isometric/enemies/owlbear_cub-death.png",
        baselines: [109, 109, 81, 81],
      },
    });
    expect(enemyAnimationFor(" OWLBEAR_CUB ")).toBe(enemyAnimationRegistry.owlbear_cub);
  });

  it("registers dedicated Cave Troll attack and death sheets", () => {
    expect(enemyAnimationRegistry.cave_troll).toEqual({
      attack: {
        path: "/assets/isometric/enemies/cave_troll-attack.png",
        baselines: [110, 110, 88, 84],
      },
      death: {
        path: "/assets/isometric/enemies/cave_troll-death.png",
        baselines: [106, 109, 82, 89],
      },
    });
    expect(enemyAnimationFor("CAVE_TROLL")).toBe(enemyAnimationRegistry.cave_troll);
  });

  it("registers dedicated Hill Giant Youth attack and death sheets", () => {
    expect(enemyAnimationRegistry.hill_giant_youth).toEqual({
      attack: {
        path: "/assets/isometric/enemies/hill_giant_youth-attack.png",
        baselines: [115, 112, 103, 104],
      },
      death: {
        path: "/assets/isometric/enemies/hill_giant_youth-death.png",
        baselines: [111, 112, 95, 99],
      },
    });
    expect(enemyAnimationFor(" HILL_GIANT_YOUTH ")).toBe(
      enemyAnimationRegistry.hill_giant_youth,
    );
  });

  it("registers dedicated Minotaur Guardian attack and death sheets", () => {
    expect(enemyAnimationRegistry.minotaur_guardian).toEqual({
      attack: {
        path: "/assets/isometric/enemies/minotaur_guardian-attack.png",
        baselines: [116, 114, 103, 104],
      },
      death: {
        path: "/assets/isometric/enemies/minotaur_guardian-death.png",
        baselines: [119, 121, 107, 107],
      },
    });
    expect(enemyAnimationFor("MINOTAUR_GUARDIAN")).toBe(
      enemyAnimationRegistry.minotaur_guardian,
    );
  });

  it("registers dedicated Ogre Marauder attack and death sheets", () => {
    expect(enemyAnimationRegistry.ogre_marauder).toEqual({
      attack: {
        path: "/assets/isometric/enemies/ogre_marauder-attack.png",
        baselines: [112, 111, 104, 102],
      },
      death: {
        path: "/assets/isometric/enemies/ogre_marauder-death.png",
        baselines: [113, 118, 107, 101],
      },
    });
    expect(enemyAnimationFor(" OGRE_MARAUDER ")).toBe(
      enemyAnimationRegistry.ogre_marauder,
    );
  });

  it("registers dedicated Lizardfolk Scout attack and death sheets", () => {
    expect(enemyAnimationRegistry.lizardfolk_scout).toEqual({
      attack: {
        path: "/assets/isometric/enemies/lizardfolk_scout-attack.png",
        baselines: [110, 105, 91, 101],
      },
      death: {
        path: "/assets/isometric/enemies/lizardfolk_scout-death.png",
        baselines: [116, 116, 95, 100],
      },
    });
    expect(enemyAnimationFor("LIZARDFOLK_SCOUT")).toBe(
      enemyAnimationRegistry.lizardfolk_scout,
    );
  });

  it("registers dedicated Naga Apprentice attack and death sheets", () => {
    expect(enemyAnimationRegistry.naga_apprentice).toEqual({
      attack: {
        path: "/assets/isometric/enemies/naga_apprentice-attack.png",
        baselines: [115, 114, 104, 106],
      },
      death: {
        path: "/assets/isometric/enemies/naga_apprentice-death.png",
        baselines: [116, 111, 93, 95],
      },
    });
    expect(enemyAnimationFor(" NAGA_APPRENTICE ")).toBe(
      enemyAnimationRegistry.naga_apprentice,
    );
  });

  it("registers dedicated Yuan-ti Cutthroat attack and death sheets", () => {
    expect(enemyAnimationRegistry.yuan_ti_cutthroat).toEqual({
      attack: {
        path: "/assets/isometric/enemies/yuan_ti_cutthroat-attack.png",
        baselines: [112, 112, 102, 106],
      },
      death: {
        path: "/assets/isometric/enemies/yuan_ti_cutthroat-death.png",
        baselines: [113, 114, 95, 97],
      },
    });
    expect(enemyAnimationFor("YUAN_TI_CUTTHROAT")).toBe(
      enemyAnimationRegistry.yuan_ti_cutthroat,
    );
  });

  it("registers dedicated Basilisk Hatchling attack and death sheets", () => {
    expect(enemyAnimationRegistry.basilisk_hatchling).toEqual({
      attack: {
        path: "/assets/isometric/enemies/basilisk_hatchling-attack.png",
        baselines: [110, 110, 90, 91],
      },
      death: {
        path: "/assets/isometric/enemies/basilisk_hatchling-death.png",
        baselines: [112, 114, 87, 88],
      },
    });
    expect(enemyAnimationFor(" BASILISK_HATCHLING ")).toBe(
      enemyAnimationRegistry.basilisk_hatchling,
    );
  });

  it("registers dedicated Harpy Screecher attack and death sheets", () => {
    expect(enemyAnimationRegistry.harpy_screecher).toEqual({
      attack: {
        path: "/assets/isometric/enemies/harpy_screecher-attack.png",
        baselines: [119, 121, 105, 108],
      },
      death: {
        path: "/assets/isometric/enemies/harpy_screecher-death.png",
        baselines: [110, 115, 96, 98],
      },
    });
    expect(enemyAnimationFor("HARPY_SCREECHER")).toBe(
      enemyAnimationRegistry.harpy_screecher,
    );
  });

  it("registers dedicated Griffin Fledgling attack and death sheets", () => {
    expect(enemyAnimationRegistry.griffin_fledgling).toEqual({
      attack: {
        path: "/assets/isometric/enemies/griffin_fledgling-attack.png",
        baselines: [112, 110, 98, 99],
      },
      death: {
        path: "/assets/isometric/enemies/griffin_fledgling-death.png",
        baselines: [107, 106, 89, 87],
      },
    });
    expect(enemyAnimationFor(" GRIFFIN_FLEDGLING ")).toBe(
      enemyAnimationRegistry.griffin_fledgling,
    );
  });

  it("registers dedicated Manticore Whelp attack and death sheets", () => {
    expect(enemyAnimationRegistry.manticore_whelp).toEqual({
      attack: {
        path: "/assets/isometric/enemies/manticore_whelp-attack.png",
        baselines: [114, 116, 101, 99],
      },
      death: {
        path: "/assets/isometric/enemies/manticore_whelp-death.png",
        baselines: [115, 115, 93, 94],
      },
    });
    expect(enemyAnimationFor("MANTICORE_WHELP")).toBe(
      enemyAnimationRegistry.manticore_whelp,
    );
  });

  it("registers dedicated Wyvern Juvenile attack and death sheets", () => {
    expect(enemyAnimationRegistry.wyvern_juvenile).toEqual({
      attack: {
        path: "/assets/isometric/enemies/wyvern_juvenile-attack.png",
        baselines: [100, 101, 91, 92],
      },
      death: {
        path: "/assets/isometric/enemies/wyvern_juvenile-death.png",
        baselines: [100, 102, 72, 72],
      },
    });
    expect(enemyAnimationFor(" WYVERN_JUVENILE ")).toBe(
      enemyAnimationRegistry.wyvern_juvenile,
    );
  });

  it("registers dedicated Dragon Wyrmling attack and death sheets", () => {
    expect(enemyAnimationRegistry.dragon_wyrmling).toEqual({
      attack: {
        path: "/assets/isometric/enemies/dragon_wyrmling-attack.png",
        baselines: [97, 97, 78, 78],
      },
      death: {
        path: "/assets/isometric/enemies/dragon_wyrmling-death.png",
        baselines: [95, 97, 66, 66],
      },
    });
    expect(enemyAnimationFor("DRAGON_WYRMLING")).toBe(
      enemyAnimationRegistry.dragon_wyrmling,
    );
  });

  it("registers dedicated Elemental Spark attack and death sheets", () => {
    expect(enemyAnimationRegistry.elemental_spark).toEqual({
      attack: {
        path: "/assets/isometric/enemies/elemental_spark-attack.png",
        baselines: [107, 107, 94, 94],
      },
      death: {
        path: "/assets/isometric/enemies/elemental_spark-death.png",
        baselines: [104, 104, 87, 79],
      },
    });
    expect(enemyAnimationFor(" ELEMENTAL_SPARK ")).toBe(
      enemyAnimationRegistry.elemental_spark,
    );
  });

  it("registers dedicated Fire Elemental Ling attack and death sheets", () => {
    expect(enemyAnimationRegistry.fire_elemental_ling).toEqual({
      attack: {
        path: "/assets/isometric/enemies/fire_elemental_ling-attack.png",
        baselines: [107, 107, 107, 107],
      },
      death: {
        path: "/assets/isometric/enemies/fire_elemental_ling-death.png",
        baselines: [107, 107, 107, 107],
      },
    });
    expect(enemyAnimationFor(" FIRE_ELEMENTAL_LING ")).toBe(
      enemyAnimationRegistry.fire_elemental_ling,
    );
  });

  it("registers dedicated Ice Elemental Ling attack and death sheets", () => {
    expect(enemyAnimationRegistry.ice_elemental_ling).toEqual({
      attack: {
        path: "/assets/isometric/enemies/ice_elemental_ling-attack.png",
        baselines: [106, 106, 106, 106],
      },
      death: {
        path: "/assets/isometric/enemies/ice_elemental_ling-death.png",
        baselines: [106, 106, 106, 106],
      },
    });
    expect(enemyAnimationFor(" ICE_ELEMENTAL_LING ")).toBe(
      enemyAnimationRegistry.ice_elemental_ling,
    );
  });

  it("registers dedicated Earth Elemental Ling attack and death sheets", () => {
    expect(enemyAnimationRegistry.earth_elemental_ling).toEqual({
      attack: {
        path: "/assets/isometric/enemies/earth_elemental_ling-attack.png",
        baselines: [112, 112, 112, 112],
      },
      death: {
        path: "/assets/isometric/enemies/earth_elemental_ling-death.png",
        baselines: [112, 112, 112, 112],
      },
    });
    expect(enemyAnimationFor(" EARTH_ELEMENTAL_LING ")).toBe(
      enemyAnimationRegistry.earth_elemental_ling,
    );
  });

  it("registers dedicated Air Elemental Ling attack and death sheets", () => {
    expect(enemyAnimationRegistry.air_elemental_ling).toEqual({
      attack: {
        path: "/assets/isometric/enemies/air_elemental_ling-attack.png",
        baselines: [109, 109, 109, 109],
      },
      death: {
        path: "/assets/isometric/enemies/air_elemental_ling-death.png",
        baselines: [109, 109, 109, 109],
      },
    });
    expect(enemyAnimationFor(" AIR_ELEMENTAL_LING ")).toBe(
      enemyAnimationRegistry.air_elemental_ling,
    );
  });

  it("registers dedicated Dark Elf Assassin attack and death sheets", () => {
    expect(enemyAnimationRegistry.dark_elf_assassin).toEqual({
      attack: {
        path: "/assets/isometric/enemies/dark_elf_assassin-attack.png",
        baselines: [115, 115, 115, 115],
      },
      death: {
        path: "/assets/isometric/enemies/dark_elf_assassin-death.png",
        baselines: [117, 117, 117, 117],
      },
    });
    expect(enemyAnimationFor(" DARK_ELF_ASSASSIN ")).toBe(
      enemyAnimationRegistry.dark_elf_assassin,
    );
  });

  it("registers dedicated Dark Elf Arcanist attack and death sheets", () => {
    expect(enemyAnimationRegistry.dark_elf_arcanist).toEqual({
      attack: {
        path: "/assets/isometric/enemies/dark_elf_arcanist-attack.png",
        baselines: [108, 108, 108, 108],
      },
      death: {
        path: "/assets/isometric/enemies/dark_elf_arcanist-death.png",
        baselines: [112, 112, 112, 112],
      },
    });
    expect(enemyAnimationFor(" DARK_ELF_ARCANIST ")).toBe(
      enemyAnimationRegistry.dark_elf_arcanist,
    );
  });

  it("registers dedicated Dwarven Ghost attack and death sheets", () => {
    expect(enemyAnimationRegistry.dwarven_ghost).toEqual({
      attack: {
        path: "/assets/isometric/enemies/dwarven_ghost-attack.png",
        baselines: [113, 115, 106, 107],
      },
      death: {
        path: "/assets/isometric/enemies/dwarven_ghost-death.png",
        baselines: [115, 109, 94, 96],
      },
    });
    expect(enemyAnimationFor(" DWARVEN_GHOST ")).toBe(
      enemyAnimationRegistry.dwarven_ghost,
    );
  });

  it("maps four phases across the shared two-by-two sheet", () => {
    expect(enemyAnimationLayout).toMatchObject({
      frameWidth: 128,
      frameHeight: 128,
      columns: 2,
      rows: 2,
      phaseCount: 4,
    });
    expect([0, 1, 2, 3].map(enemyAnimationCell)).toEqual([
      { column: 0, row: 0 },
      { column: 1, row: 0 },
      { column: 0, row: 1 },
      { column: 1, row: 1 },
    ]);
  });
});
