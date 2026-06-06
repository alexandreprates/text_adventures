require 'spec_helper'

RSpec.describe TextAdventures::ContentCatalog do
  describe ".item" do
    it "builds items from YAML definitions" do
      expect(described_class.item("spear")).to have_attributes(
        display_name: "Spear",
        type: :weapon,
        price: 50,
        attack: 22,
        defense: 5
      )
    end

    it "builds armor class from YAML definitions" do
      expect(described_class.item("chain_mail")).to have_attributes(
        display_name: "Chain Mail",
        type: :armor,
        defense: 54,
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
        "Spear",
        "Hunting Spear",
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
  end

  describe ".creature" do
    it "exposes the full dungeon creature roster" do
      expect(described_class.creature_ids.length).to eq 50
      expect(described_class.creature_ids).to include("giant_spider")
    end

    it "builds creatures from YAML definitions" do
      creature = described_class.creature("giant_spider")

      expect(creature).to have_attributes(
        display_name: "Giant Spider",
        defense: 1,
        status_effects: [:poison]
      )
      expect(creature.health.current).to eq 35
      expect(creature.attack_named("poison bite")).to have_attributes(
        damage_range: 1..3,
        status: :poison,
        status_chance: 35
      )
      expect(creature.loot_table.map(&:display_name)).to eq ["Tome of Freezing"]
    end
  end
end
