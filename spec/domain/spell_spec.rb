require 'spec_helper'

RSpec.describe TextAdventures::Spell do
  describe ".for" do
    it "builds initial spell definitions by command name" do
      expect(described_class.for("heal")).to have_attributes(display_name: "Heal", kind: :healing)
      expect(described_class.for("fireball")).to have_attributes(display_name: "Fireball", kind: :damage)
      expect(described_class.for("ice bolt")).to have_attributes(display_name: "Ice Bolt", kind: :damage)
      expect(described_class.for("cure")).to have_attributes(display_name: "Cure", kind: :cure)
    end

    it "rejects unknown spell names" do
      expect { described_class.for("meteor") }.to raise_error(ArgumentError, "unknown spell: meteor")
    end
  end

  describe ".heal" do
    subject(:spell) { described_class.heal }

    it "has healing attributes" do
      expect(spell).to have_attributes(
        name: "heal",
        display_name: "Heal",
        level: 1,
        kind: :healing,
        mp_cost: 4,
        healing_range: 10..30
      )
      expect(spell).to be_healing
    end
  end

  describe ".fireball" do
    subject(:spell) { described_class.fireball }

    it "has damage attributes" do
      expect(spell).to have_attributes(
        name: "fireball",
        display_name: "Fireball",
        level: 1,
        kind: :damage,
        mp_cost: 5,
        damage_range: 12..22
      )
      expect(spell).to be_damage
    end
  end

  describe ".ice_bolt" do
    subject(:spell) { described_class.ice_bolt }

    it "has damage and freeze status attributes" do
      expect(spell).to have_attributes(
        name: "ice bolt",
        display_name: "Ice Bolt",
        level: 1,
        kind: :damage,
        mp_cost: 6,
        damage_range: 5..10,
        status: :freeze,
        status_chance: 2
      )
    end

    it "scales with level like the README example" do
      leveled_spell = described_class.ice_bolt(level: 2)

      expect(leveled_spell).to have_attributes(
        level: 2,
        mp_cost: 9,
        damage_range: 8..18,
        status_chance: 3
      )
    end
  end

  describe ".cure" do
    subject(:spell) { described_class.cure }

    it "has cure attributes" do
      expect(spell).to have_attributes(
        name: "cure",
        display_name: "Cure",
        level: 1,
        kind: :cure,
        mp_cost: 3
      )
      expect(spell).to be_cure
    end
  end

  describe "#matches?" do
    it "matches by normalized command name" do
      expect(described_class.ice_bolt).to match_spell(" ice   bolt ")
    end

    def match_spell(query)
      satisfy { |spell| spell.matches?(query) }
    end
  end

  describe "#level_up" do
    it "returns the next level of the same spell definition" do
      spell = described_class.ice_bolt.level_up

      expect(spell).to have_attributes(command_name: "ice bolt", level: 2)
    end
  end

  describe "#description" do
    it "renders command-friendly effect text" do
      expect(described_class.heal.description).to eq "Recovery 10~30 of health"
      expect(described_class.fireball.description).to eq "Causes 12~22 of damage"
      expect(described_class.ice_bolt.description)
        .to eq "Causes 5~10 of damage, with 2% chance to freeze your enemy"
      expect(described_class.cure.description).to eq "Remove harmful status effects"
    end
  end

  describe ".new" do
    it "rejects unknown spell kinds" do
      expect do
        described_class.new(name: "Blink", kind: :movement)
      end.to raise_error(ArgumentError, "unknown spell kind: movement")
    end
  end
end
