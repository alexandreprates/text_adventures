require 'spec_helper'

RSpec.describe TextAdventures::Character do
  subject(:character) { described_class.new(**attributes) }

  let(:attributes) { {} }

  describe ".new" do
    it "sets default identity and resources" do
      expect(character).to have_attributes(
        name: "Adventurer",
        gold: 100,
        base_attack: 1,
        base_defense: 0
      )
    end

    it "uses Extent for health" do
      expect(character.health).to be_a Extent
      expect(character.health).to have_attributes(current: 30, max: 30, min: 0)
    end

    it "starts with starter equipment" do
      expect(character.equipped_weapon).to have_attributes(name: "Sword", attack: 10)
      expect(character.equipped_armor).to have_attributes(name: "Leather Armor", defense: 20)
    end

    it "starts with an inventory" do
      expect(character.inventory).to be_a TextAdventures::Inventory
      expect(character.inventory).to be_empty
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
        expect(character.skill_experience[:swordsmanship]).to eq 60
        expect(character.status_effects).to eq %i[poison disease]
      end
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

    it "falls back to base attack without an equipped weapon" do
      character.equipped_weapon = nil

      expect(character.attack).to eq 1
    end
  end

  describe "#defense" do
    it "combines base defense and armor defense" do
      expect(character.defense).to eq 20
    end

    it "falls back to base defense without equipped armor" do
      character.equipped_armor = nil

      expect(character.defense).to eq 0
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
    it "renders an empty inventory with equipped items" do
      expect(character.inventory_report).to eq <<~TEXT.chomp
        Currently you have nothing.
        Equipped:
         weapon: Sword (Atk: 10)
         armor: Leather Armor (Def: 20)
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
         2x Potion of Heal (Recovery 20 Health)
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
         1x Heal (level 1) - Recovery 10~30 of health
         1x Ice Bolt (level 2) - Causes 8~18 of damage, with 3% chance to freeze your enemy
      TEXT
    end
  end
end
