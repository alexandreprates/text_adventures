require 'spec_helper'

RSpec.describe TextAdventures::Item do
  describe ".weapon" do
    subject(:item) { described_class.weapon("Sword", price: 15, attack: 10, weapon_class: :sword) }

    it "builds a weapon with attack value" do
      expect(item).to have_attributes(
        name: "sword",
        display_name: "Sword",
        price: 15,
        type: :weapon,
        attack: 10,
        defense: 0,
        recovery: 0,
        spell: nil,
        weapon_class: :sword
      )
      expect(item).to be_weapon
    end

    it "can represent a weapon with defense" do
      spear = described_class.weapon("Spear", price: 50, attack: 22, defense: 5, weapon_class: :spear)

      expect(spear).to have_attributes(attack: 22, defense: 5, weapon_class: :spear)
    end
  end

  describe ".armor" do
    subject(:item) { described_class.armor("Leather Armor", price: 20, defense: 20, armor_class: :light) }

    it "builds armor with defense value" do
      expect(item).to have_attributes(
        name: "leather armor",
        display_name: "Leather Armor",
        price: 20,
        type: :armor,
        attack: 0,
        defense: 20,
        armor_class: :light
      )
      expect(item).to be_armor
    end
  end

  describe ".potion" do
    subject(:item) { described_class.potion("Potion of Heal", price: 5, recovery: 20) }

    it "builds a potion with recovery value" do
      expect(item).to have_attributes(
        name: "potion of heal",
        display_name: "Potion of Heal",
        price: 5,
        type: :potion,
        recovery: 20
      )
      expect(item).to be_potion
    end
  end

  describe ".tome" do
    subject(:item) { described_class.tome("Tome of Ice Bolt", price: 25, spell: "Ice Bolt") }

    it "builds a tome with a normalized spell identity" do
      expect(item).to have_attributes(
        name: "tome of ice bolt",
        display_name: "Tome of Ice Bolt",
        price: 25,
        type: :tome,
        spell: "ice bolt"
      )
      expect(item).to be_tome
    end
  end

  describe ".junk" do
    subject(:item) { described_class.junk("Cracked Fang", price: 2) }

    it "builds a sellable junk item" do
      expect(item).to have_attributes(
        name: "cracked fang",
        display_name: "Cracked Fang",
        price: 2,
        type: :junk
      )
      expect(item).to be_junk
    end
  end

  describe ".normalize_name" do
    it "normalizes command-friendly names" do
      expect(described_class.normalize_name("  King's   Nep Sword!! ")).to eq "king s nep sword"
    end
  end

  describe "#matches?" do
    subject(:item) { described_class.weapon("Bastard Sword", price: 30, attack: 25) }

    it "matches command input by normalized name" do
      expect(item).to match_query(" bastard   sword ")
      expect(item).to_not match_query("sword")
    end

    def match_query(query)
      satisfy { |candidate| candidate.matches?(query) }
    end
  end

  describe "#==" do
    it "compares items by normalized command name" do
      sword = described_class.weapon("Sword", price: 15, attack: 10)
      same_sword = described_class.weapon("  sword  ", price: 20, attack: 50)
      spear = described_class.weapon("Spear", price: 50, attack: 22)

      expect(sword).to eq same_sword
      expect(sword).to_not eq spear
    end
  end

  describe "README examples" do
    let(:examples) do
      [
        described_class.weapon("Sword", price: 15, attack: 10),
        described_class.weapon("Bastard Sword", price: 30, attack: 25),
        described_class.weapon("Spear", price: 50, attack: 22, defense: 5),
        described_class.armor("Leather Armor", price: 20, defense: 20),
        described_class.potion("Potion of Heal", price: 10, recovery: 20),
        described_class.tome("Tome of Ice Bolt", price: 25, spell: "Ice Bolt")
      ]
    end

    it "represents every item example needed by the initial gameplay plan" do
      expect(examples.map(&:display_name)).to contain_exactly(
        "Sword",
        "Bastard Sword",
        "Spear",
        "Leather Armor",
        "Potion of Heal",
        "Tome of Ice Bolt"
      )
    end

    it "can find examples by command-friendly input" do
      expect(examples.find { |item| item.matches?("tome   of ice bolt") }.spell).to eq "ice bolt"
      expect(examples.find { |item| item.matches?("leather armor") }.defense).to eq 20
    end
  end

  describe ".new" do
    it "rejects unknown types" do
      expect do
        described_class.new(name: "Ale", price: 2, type: :drink)
      end.to raise_error(ArgumentError, "unknown item type: drink")
    end
  end
end
