require 'spec_helper'

RSpec.describe TextAdventures::CommandParser do
  describe ".parse" do
    it "parses targeted commands" do
      expect(described_class.parse("go blacksmith")).to have_attributes(
        verb: :go,
        target: "blacksmith",
        known?: true,
        unknown?: false
      )
      expect(described_class.parse("go ruins")).to have_attributes(verb: :go, target: "ruins")
      expect(described_class.parse("cast fireball")).to have_attributes(verb: :cast, target: "fireball")
      expect(described_class.parse("equip sword")).to have_attributes(verb: :equip, target: "sword")
      expect(described_class.parse("use potion")).to have_attributes(verb: :use, target: "potion")
      expect(described_class.parse("drop sword")).to have_attributes(verb: :drop, target: "sword")
    end

    it "parses standalone commands" do
      expect(described_class.parse("attack")).to have_attributes(verb: :attack, target: nil, known?: true)
      expect(described_class.parse("heal")).to have_attributes(verb: :heal, target: nil)
      expect(described_class.parse("cure")).to have_attributes(verb: :cure, target: nil)
      expect(described_class.parse("inventory")).to have_attributes(verb: :inventory, target: nil)
      expect(described_class.parse("level")).to have_attributes(verb: :level, target: nil)
      expect(described_class.parse("agree")).to have_attributes(verb: :agree, target: nil)
      expect(described_class.parse("no")).to have_attributes(verb: :no, target: nil)
    end

    it "parses merchant and exploration commands from the README" do
      expect(described_class.parse("show")).to have_attributes(verb: :show, target: nil)
      expect(described_class.parse("buy spear")).to have_attributes(verb: :buy, target: "spear")
      expect(described_class.parse("sell sword")).to have_attributes(verb: :sell, target: "sword")
      expect(described_class.parse("look")).to have_attributes(verb: :look, target: nil)
      expect(described_class.parse("loot")).to have_attributes(verb: :loot, target: nil)
      expect(described_class.parse("skills")).to have_attributes(verb: :skills, target: nil)
      expect(described_class.parse("spellbook")).to have_attributes(verb: :spellbook, target: nil)
    end

    it "normalizes casing and whitespace" do
      command = described_class.parse("  CAST    FireBall  ")

      expect(command).to have_attributes(
        verb: :cast,
        target: "fireball",
        raw: "  CAST    FireBall  ",
        known?: true
      )
    end

    it "keeps multi-word targets normalized" do
      expect(described_class.parse("use tome   of ice bolt")).to have_attributes(
        verb: :use,
        target: "tome of ice bolt"
      )
    end

    it "supports aliases implied by the README text" do
      expect(described_class.parse("invetory")).to have_attributes(verb: :inventory, target: nil)
      expect(described_class.parse("spell heal")).to have_attributes(verb: :cast, target: "heal")
    end

    it "returns a structured unknown command result" do
      command = described_class.parse("dance wildly")

      expect(command).to have_attributes(
        verb: :dance,
        target: nil,
        raw: "dance wildly",
        known?: false,
        unknown?: true,
        message: "Unknown command: dance."
      )
    end

    it "returns a structured result when a target is missing" do
      command = described_class.parse("go")

      expect(command).to have_attributes(
        verb: :go,
        target: nil,
        known?: false,
        message: "Missing target for go."
      )
    end

    it "returns a structured result for blank input" do
      command = described_class.parse("   ")

      expect(command).to have_attributes(
        verb: nil,
        target: nil,
        known?: false,
        message: "No command entered."
      )
    end
  end
end
