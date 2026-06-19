require 'spec_helper'

RSpec.describe TextAdventures::ContentCatalog do
  describe ".item" do
    it "builds items from YAML definitions" do
      expect(described_class.item("spear")).to have_attributes(
        display_name: "Spear",
        type: :weapon,
        price: 50,
        attack: 15,
        defense: 3,
        weapon_class: :spear
      )
    end

    it "builds weapon classes from YAML definitions" do
      expect(described_class.item("assassin_dagger")).to have_attributes(
        type: :weapon,
        weapon_class: :dagger
      )
    end

    it "builds armor class from YAML definitions" do
      expect(described_class.item("chain_mail")).to have_attributes(
        display_name: "Chain Mail",
        type: :armor,
        defense: 33,
        armor_class: :heavy
      )
    end

    it "raises a clear error for unknown item ids" do
      expect do
        described_class.item("missing")
      end.to raise_error(ArgumentError, "unknown item: missing")
    end
  end

  describe ".shop" do
    it "builds shop configuration from YAML definitions" do
      shop = described_class.shop("blacksmith")

      expect(shop).to include(
        name: :blacksmith,
        display_name: "Blacksmith",
        accepted_types: [:weapon]
      )
      expect(shop.fetch(:stock).map(&:display_name)).to eq [
        "Sword",
        "Bastard Sword",
        "Longsword",
        "Greatsword",
        "Hunting Spear",
        "Spear",
        "Iron Spear",
        "Halberd",
        "Dragon Lance",
        "Rusty Dagger",
        "Iron Dagger",
        "Curved Dagger",
        "Shadow Dagger",
        "Assassin Dagger",
        "King's Nep Sword"
      ]
    end

    it "groups the blacksmith arsenal into swords, spears, and daggers" do
      stock = described_class.shop("blacksmith").fetch(:stock)

      expect(stock.count { |item| item.display_name.match?(/sword/i) }).to eq 5
      expect(stock.count { |item| item.display_name.match?(/spear|halberd|lance/i) }).to eq 5
      expect(stock.count { |item| item.display_name.match?(/dagger/i) }).to eq 5
    end

    it "groups the armorsmith stock into light, medium, and heavy armor" do
      stock = described_class.shop("armorsmith").fetch(:stock)

      expect(stock.count { |item| item.armor_class == :light }).to eq 5
      expect(stock.count { |item| item.armor_class == :medium }).to eq 5
      expect(stock.count { |item| item.armor_class == :heavy }).to eq 5
    end

    it "builds Tavern potion stock and accepts potion and junk trades" do
      shop = described_class.shop("tavern")

      expect(shop).to include(
        name: :tavern,
        display_name: "Tavern",
        accepted_types: [:potion, :junk]
      )
      expect(shop.fetch(:stock).map(&:display_name)).to eq ["Potion of Heal"]
    end
  end

  describe ".creature" do
    it "exposes the full dungeon creature roster" do
      expect(described_class.creature_ids.length).to eq 50
      expect(described_class.creature_ids).to include("giant_spider")
    end

    it "exposes dungeon creature pools by level" do
      expect(described_class.creature_ids_for_level(1)).to include("giant_spider", "goblin_skirmisher")
      expect(described_class.creature_ids_for_level(6)).to include("orc_berserker", "wight_knight")
      expect(described_class.creature_ids_for_level(10)).to include("lesser_demon", "dragon_wyrmling")
    end

    it "keeps every level creature pool backed by the creature roster" do
      pooled_ids = [1, 3, 6, 9].flat_map { |level| described_class.creature_ids_for_level(level) }

      expect(pooled_ids - described_class.creature_ids).to eq []
    end

    it "builds creatures from YAML definitions" do
      creature = described_class.creature("giant_spider")

      expect(creature).to have_attributes(
        display_name: "Giant Spider",
        defense: 1,
        xp_reward: 67,
        status_effects: [:poison]
      )
      expect(creature.health.current).to eq 35
      expect(creature.attack_named("poison bite")).to have_attributes(
        damage_range: 1..3,
        status: :poison,
        status_chance: 35
      )
      expect(creature.loot_table.map(&:display_name)).to eq ["Tome of Freezing"]
      expect(creature.loot_profile).to have_attributes(
        common_chance: 85,
        rare_chance: 10,
        gold_range: 1..6
      )
      expect(creature.loot_profile.common_items.map(&:display_name)).to eq ["Cracked Fang", "Torn Hide"]
      expect(creature.loot_profile.rare_items.map(&:display_name)).to eq ["Tome of Freezing"]
    end

    it "requires every dungeon creature to have an XP reward" do
      rewards = described_class.creature_ids.map { |id| described_class.creature(id).xp_reward }

      expect(rewards).to all(be_positive)
    end
  end

  describe ".dungeon_block" do
    it "builds dungeon blocks from YAML definitions" do
      block = described_class.dungeon_block("right_exit")

      expect(block).to have_attributes(
        id: "right_exit",
        name: "Corridor Right Exit",
        width: 6,
        height: 5,
        exits: ["right"]
      )
      expect(block).to be_exit("right")
      expect(block).to be_open(5, 2)
      expect(block).to be_wall(0, 0)
    end

    it "exposes the full dungeon block catalog" do
      expect(described_class.dungeon_blocks.map(&:id)).to eq [
        "right_exit",
        "left_exit",
        "down_exit",
        "up_exit",
        "four_exits",
        "corner_down_left",
        "corner_down_right",
        "corner_up_left",
        "corner_up_right"
      ]
    end

    it "raises a clear error for unknown dungeon block ids" do
      expect do
        described_class.dungeon_block("missing")
      end.to raise_error(ArgumentError, "unknown dungeon block: missing")
    end
  end
end
