require 'spec_helper'

RSpec.describe TextAdventures::Character do
  subject(:character) { described_class.new(**attributes) }

  let(:attributes) { {} }

  describe ".new" do
    it "sets default identity and resources" do
      expect(character).to have_attributes(
        name: "Adventurer",
        gold: 0,
        base_attack: 1,
        base_defense: 0
      )
    end

    it "uses Extent for health" do
      expect(character.health).to be_a Extent
      expect(character.health).to have_attributes(current: 30, max: 30, min: 0)
    end

    it "uses Extent for mana" do
      expect(character.mana).to be_a Extent
      expect(character.mana).to have_attributes(current: 12, max: 12, min: 0)
    end

    it "derives max health from total class levels" do
      progression = TextAdventures::CharacterProgression.new(skill_experience: { swordsmanship: 50 })
      leveled_character = described_class.new(progression: progression)

      expect(leveled_character.health).to have_attributes(current: 35, max: 35)
    end

    it "derives max mana from magic skill and overall levels" do
      progression = TextAdventures::CharacterProgression.new(skill_experience: { combat_magic: 50, nature_magic: 50 })
      leveled_character = described_class.new(progression: progression)

      expect(leveled_character.mana).to have_attributes(current: 21, max: 21)
    end

    it "starts with starter equipment" do
      expect(character.equipped_weapon).to have_attributes(name: "Sword", attack: 10)
      expect(character.equipped_armor).to have_attributes(name: "Leather Armor", defense: 12)
    end

    it "keeps starter equipment compatible with inventory entries" do
      expect(character.equipped_weapon).to have_attributes(
        command_name: "sword",
        display_name: "Sword",
        weapon?: true,
        armor?: false
      )
      expect(character.equipped_armor).to have_attributes(
        command_name: "leather armor",
        display_name: "Leather Armor",
        weapon?: false,
        armor?: true
      )
    end

    it "starts with an inventory" do
      expect(character.inventory).to be_a TextAdventures::Inventory
      expect(character.inventory.quantity("potion of heal")).to eq 5
    end

    it "starts without active status effects" do
      expect(character.status_effects).to be_empty
    end

    it "starts with progression state" do
      expect(character.progression).to be_a TextAdventures::CharacterProgression
      expect(character.overall_experience).to eq 0
      expect(character.overall_level).to eq 1
      expect(character.skill_levels.values).to all(eq 1)
    end

    context "with custom attributes" do
      let(:weapon) { described_class::Equipment.new(name: "Axe", attack: 15, defense: 0) }
      let(:armor) { described_class::Equipment.new(name: "Chainmail", attack: 0, defense: 8) }
      let(:inventory) { TextAdventures::Inventory.new }
      let(:attributes) do
        {
          name: "Nee Peh",
          health: 12,
          max_health: 40,
          mana: 5,
          max_mana: 18,
          gold: 7,
          base_attack: 3,
          base_defense: 2,
          equipped_weapon: weapon,
          equipped_armor: armor,
          inventory: inventory,
          progression: TextAdventures::CharacterProgression.new(skill_experience: { swordsmanship: 60 }),
          status_effects: [:poison, "disease", "poison"]
        }
      end

      it "uses the provided values" do
        expect(character).to have_attributes(
          name: "Nee Peh",
          gold: 7,
          base_attack: 3,
          base_defense: 2,
          equipped_weapon: weapon,
          equipped_armor: armor,
          inventory: inventory
        )
        expect(character.health).to have_attributes(current: 12, max: 40)
        expect(character.mana).to have_attributes(current: 5, max: 18)
        expect(character.skill_experience[:swordsmanship]).to eq 60
        expect(character.status_effects).to eq %i[poison disease]
      end
    end
  end

  describe "#spend_mana and #recover_mana" do
    it "spends and recovers mana inside the mana extent" do
      expect(character.spend_mana(5)).to be true
      expect(character.mana.current).to eq 7

      expect(character.recover_mana(0.5)).to eq 0.5
      expect(character.mana.current).to eq 7.5

      expect(character.recover_mana(20)).to eq 4.5
      expect(character.mana.current).to eq 12
    end

    it "does not spend mana when the character cannot afford the cost" do
      expect(character.spend_mana(13)).to be false
      expect(character.mana.current).to eq 12
    end
  end

  describe "#tick_status_effects" do
    it "applies poison damage and expires the status after its duration" do
      character.apply_status(:poison, duration: 2)

      expect(character.tick_status_effects).to eq ["Poison deals 2 damage."]
      expect(character.health.current).to eq 28
      expect(character).to be_status(:poison)

      expect(character.tick_status_effects).to eq ["Poison deals 2 damage.", "Poison wears off."]
      expect(character.health.current).to eq 26
      expect(character).to_not be_status(:poison)
    end

    it "expires non-damaging curable debuffs without applying damage" do
      character.apply_status(:disease, duration: 1)

      expect(character.tick_status_effects).to eq ["Disease wears off."]
      expect(character.health.current).to eq 30
      expect(character).to_not be_status(:disease)
    end
  end

  describe "#gain_skill_xp" do
    it "delegates XP gains to character progression" do
      expect { character.gain_skill_xp(:spearmanship, 50) }
        .to change { character.skill_experience[:spearmanship] }
        .from(0).to(50)

      expect(character.skill_levels[:spearmanship]).to eq 2
      expect(character.overall_experience).to eq 50
      expect(character.overall_level).to eq 2
    end

    it "increases max and current health when a class level increases" do
      expect { character.gain_skill_xp(:spearmanship, 50) }
        .to change { [character.health.current, character.health.max] }
        .from([30, 30]).to([35, 35])
    end

    it "fully heals damaged characters when a class level increases" do
      character.take_damage(10)

      expect { character.gain_skill_xp(:spearmanship, 50) }
        .to change { [character.health.current, character.health.max] }
        .from([20, 30]).to([35, 35])
    end

    it "does not change health when XP does not increase a class level" do
      expect { character.gain_skill_xp(:spearmanship, 49) }
        .to_not change { [character.health.current, character.health.max] }
    end

    it "keeps explicitly configured max health independent from progression" do
      custom_character = described_class.new(health: 12, max_health: 40)

      expect { custom_character.gain_skill_xp(:spearmanship, 50) }
        .to_not change { custom_character.health.max }
    end

    it "tracks health through class name changes and class level increases" do
      character.take_damage(12)

      character.gain_skill_xp(:swordsmanship, 49)
      expect(character.current_class).to eq "Warlord"
      expect(character.progression.total_class_level).to eq 5
      expect(character.health).to have_attributes(current: 18, max: 30)

      character.gain_skill_xp(:swordsmanship, 1)
      expect(character.current_class).to eq "Warlord"
      expect(character.skill_levels[:swordsmanship]).to eq 2
      expect(character.progression.total_class_level).to eq 6
      expect(character.health).to have_attributes(current: 35, max: 35)

      character.take_damage(7)
      character.gain_skill_xp(:combat_magic, 50)
      expect(character.current_class).to eq "Spellblade"
      expect(character.skill_levels.values_at(:swordsmanship, :combat_magic)).to eq [2, 2]
      expect(character.progression.total_class_level).to eq 7
      expect(character.health).to have_attributes(current: 40, max: 40)

      character.take_damage(15)
      character.gain_skill_xp(:dagger_mastery, 200)
      expect(character.current_class).to eq "Duelist"
      expect(character.skill_levels[:dagger_mastery]).to eq 3
      expect(character.progression.total_class_level).to eq 9
      expect(character.health).to have_attributes(current: 50, max: 50)

      character.take_damage(20)
      character.gain_skill_xp(:dagger_mastery, 250)
      expect(character.current_class).to eq "Nightblade"
      expect(character.skill_levels[:dagger_mastery]).to eq 4
      expect(character.progression.total_class_level).to eq 10
      expect(character.health).to have_attributes(current: 55, max: 55)
    end
  end

  describe "#take_damage" do
    it "reduces health" do
      expect { character.take_damage(7) }
        .to change { character.health.current }
        .from(30).to(23)
    end

    it "does not reduce health below the minimum" do
      character.take_damage(50)

      expect(character.health).to have_attributes(current: 0, overload: 20)
    end

    it "returns the character for command chaining" do
      expect(character.take_damage(1)).to be character
    end
  end

  describe "#heal" do
    before { character.take_damage(12) }

    it "increases health" do
      expect { character.heal(5) }
        .to change { character.health.current }
        .from(18).to(23)
    end

    it "does not heal above max health" do
      character.heal(50)

      expect(character.health).to have_attributes(current: 30, overload: 38)
    end

    it "returns the character for command chaining" do
      expect(character.heal(1)).to be character
    end
  end

  describe "life predicates" do
    it "is alive while health is above minimum" do
      expect(character).to be_alive
      expect(character).to_not be_dead
    end

    it "is dead when health reaches minimum" do
      character.take_damage(30)

      expect(character).to be_dead
      expect(character).to_not be_alive
    end
  end

  describe "#attack" do
    it "combines base attack and weapon attack" do
      expect(character.attack).to eq 11
    end

    it "adds swordsmanship bonus when using swords" do
      character.gain_skill_xp(:swordsmanship, 50)

      expect(character.attack).to eq 13
    end

    it "adds a smaller spearmanship attack bonus when using spears" do
      spear = TextAdventures::Item.weapon("Spear", price: 50, attack: 22, defense: 5, weapon_class: :spear)
      character.equip(spear)
      character.gain_skill_xp(:spearmanship, 50)

      expect(character.attack).to eq 24
    end

    it "falls back to base attack without an equipped weapon" do
      character.equipped_weapon = nil

      expect(character.attack).to eq 1
    end
  end

  describe "#defense" do
    it "combines base defense and armor defense" do
      expect(character.defense).to eq 12
    end

    it "adds spearmanship defense bonus when using spears" do
      spear = TextAdventures::Item.weapon("Spear", price: 50, attack: 15, defense: 3, weapon_class: :spear)
      character.equip(spear)
      character.gain_skill_xp(:spearmanship, 50)

      expect(character.defense).to eq 13
    end

    it "falls back to base defense without equipped armor" do
      character.equipped_armor = nil

      expect(character.defense).to eq 0
    end
  end

  describe "skill combat bonuses" do
    it "adds dagger mastery to critical chance" do
      dagger = TextAdventures::Item.weapon("Iron Dagger", price: 18, attack: 12, weapon_class: :dagger)
      character.equip(dagger)
      character.gain_skill_xp(:dagger_mastery, 50)

      expect(character.dagger_critical_bonus).to eq 3
    end

    it "adds magic skill bonuses" do
      character.gain_skill_xp(:combat_magic, 50)
      character.gain_skill_xp(:nature_magic, 50)

      expect(character.combat_magic_damage_bonus).to eq 2
      expect(character.nature_magic_healing_bonus).to eq 3
    end
  end

  describe "#equip" do
    it "equips a weapon" do
      weapon = TextAdventures::Item.weapon("Bastard Sword", price: 30, attack: 25)

      result = character.equip(weapon)

      expect(result).to have_attributes(
        success?: true,
        item: weapon,
        message: "Equipped Bastard Sword."
      )
      expect(character.equipped_weapon).to eq weapon
      expect(character.attack).to eq 26
    end

    it "replaces the equipped weapon" do
      sword = TextAdventures::Item.weapon("Sword", price: 15, attack: 10)
      spear = TextAdventures::Item.weapon("Spear", price: 50, attack: 22)

      character.equip(sword)
      character.equip(spear)

      expect(character.equipped_weapon).to eq spear
      expect(character.attack).to eq 23
    end

    it "equips armor" do
      armor = TextAdventures::Item.armor("Iron Armor", price: 40, defense: 35)

      result = character.equip(armor)

      expect(result).to have_attributes(
        success?: true,
        item: armor,
        message: "Equipped Iron Armor."
      )
      expect(character.equipped_armor).to eq armor
      expect(character.defense).to eq 35
    end

    it "replaces the equipped armor" do
      leather = TextAdventures::Item.armor("Leather Armor", price: 20, defense: 20)
      iron = TextAdventures::Item.armor("Iron Armor", price: 40, defense: 35)

      character.equip(leather)
      character.equip(iron)

      expect(character.equipped_armor).to eq iron
      expect(character.defense).to eq 35
    end

    it "rejects non-equippable items" do
      potion = TextAdventures::Item.potion("Potion of Heal", price: 10, recovery: 20)

      result = character.equip(potion)

      expect(result).to have_attributes(
        success?: false,
        item: potion,
        message: "Potion of Heal cannot be equipped."
      )
    end
  end

  describe "status effects" do
    it "applies unique normalized statuses" do
      character.apply_status(:poison)
      character.apply_status("poison")
      character.apply_status("disease")

      expect(character.status_effects).to eq %i[poison disease]
      expect(character).to be_status(:poison)
      expect(character).to be_status("disease")
    end

    it "clears one or more statuses" do
      character.apply_status(:poison)
      character.apply_status(:disease)
      character.apply_status(:blessed)

      character.clear_statuses(:poison, "disease")

      expect(character).to_not be_status(:poison)
      expect(character).to_not be_status(:disease)
      expect(character).to be_status(:blessed)
    end
  end

  describe "#inventory_report" do
    it "renders the starter inventory with equipped items" do
      expect(character.inventory_report).to eq <<~TEXT.chomp
        Currently you have:
         5x Potion of Heal (Recovery 20 Health)
        Equipped:
         weapon: Sword (Atk: 10)
         armor: Leather Armor (Def: 12)
      TEXT
    end

    it "renders item quantities with equipped item indicators" do
      sword = TextAdventures::Item.weapon("Sword", price: 15, attack: 10)
      potion = TextAdventures::Item.potion("Potion of Heal", price: 10, recovery: 20)
      armor = TextAdventures::Item.armor("Leather Armor", price: 20, defense: 20)
      character.inventory.add(potion, quantity: 2)
      character.inventory.add(sword)
      character.equip(armor)

      expect(character.inventory_report).to eq <<~TEXT.chomp
        Currently you have:
         7x Potion of Heal (Recovery 20 Health)
         1x Sword (Atk: 10)
        Equipped:
         weapon: Sword (Atk: 10)
         armor: Leather Armor (Def: 20)
      TEXT
    end
  end

  describe "#learn_spell" do
    it "learns a new spell" do
      character.learn_spell(TextAdventures::Spell.fireball)

      expect(character).to be_known_spell("fireball")
      expect(character.spells["fireball"]).to have_attributes(level: 1)
    end

    it "levels an existing known spell" do
      character.learn_spell(TextAdventures::Spell.ice_bolt)
      character.learn_spell(TextAdventures::Spell.ice_bolt)

      expect(character.spells["ice bolt"]).to have_attributes(
        level: 2,
        damage_range: 8..18,
        status_chance: 3
      )
    end

    it "can learn from a tome item" do
      tome = TextAdventures::Item.tome("Tome of Ice Bolt", price: 25, spell: "Ice Bolt")

      character.learn_spell_from_tome(tome)

      expect(character).to be_known_spell("ice bolt")
    end
  end

  describe "#spellbook" do
    it "renders an empty spellbook" do
      expect(character.spellbook).to eq "You cannot cast any spells yet."
    end

    it "renders known spells sorted by display name" do
      character.learn_spell(TextAdventures::Spell.ice_bolt)
      character.learn_spell(TextAdventures::Spell.heal)
      character.learn_spell(TextAdventures::Spell.ice_bolt)

      expect(character.spellbook).to eq <<~TEXT.chomp
        You can cast:
         1x Heal (level 1, 4 MP) - Recovery 10~30 of health
         1x Ice Bolt (level 2, 9 MP) - Causes 8~18 of damage, with 3% chance to freeze your enemy
      TEXT
    end
  end

  describe "#level_report" do
    it "renders overall level and XP progress" do
      character.gain_skill_xp(:swordsmanship, 60)

      expect(character.level_report).to eq <<~TEXT.chomp
        Adventurer level 2
        [60/200 XP]
      TEXT
    end
  end

  describe "#skills_report" do
    it "renders every skill track with XP progress" do
      character.gain_skill_xp(:swordsmanship, 60)
      character.gain_skill_xp(:combat_magic, 20)

      expect(character.skills_report).to eq <<~TEXT.chomp
        Skills:
         Swordsmanship: level 2 (60/200 XP)
         Spearmanship: level 1 (0/50 XP)
         Dagger Mastery: level 1 (0/50 XP)
         Combat Magic: level 1 (20/50 XP)
         Nature Magic: level 1 (0/50 XP)
      TEXT
    end
  end
end
