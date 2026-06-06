require 'spec_helper'

RSpec.describe TextAdventures::Creature do
  describe ".giant_spider" do
    subject(:creature) { described_class.giant_spider }

    it "builds the initial README creature" do
      expect(creature).to have_attributes(
        name: "giant spider",
        display_name: "Giant Spider",
        defense: 1,
        xp_reward: 67
      )
      expect(creature.health).to have_attributes(current: 35, max: 35, min: 0)
    end

    it "supports bite and poison bite attacks" do
      bite = creature.attack_named("bite")
      poison_bite = creature.attack_named(" poison   bite ")

      expect(bite).to have_attributes(
        name: "Bite",
        command_name: "bite",
        damage_range: 2..4,
        status: nil,
        status_chance: nil
      )
      expect(poison_bite).to have_attributes(
        name: "Poison Bite",
        command_name: "poison bite",
        damage_range: 1..3,
        status: :poison,
        status_chance: 35
      )
    end

    it "declares poison as an applicable status effect" do
      expect(creature).to be_can_apply_status(:poison)
      expect(creature).to_not be_can_apply_status(:freeze)
    end

    it "has a basic loot table" do
      expect(creature.loot_table).to contain_exactly(
        have_attributes(
          display_name: "Tome of Freezing",
          type: :tome,
          spell: "ice bolt"
        )
      )
    end
  end

  describe ".new" do
    subject(:creature) do
      described_class.new(
        name: "Cave Bat",
        health: 12,
        defense: 0,
        xp_reward: 0,
        attacks: [attack],
        loot_table: [loot],
        status_effects: [:blind]
      )
    end

    let(:attack) { described_class::Attack.new(name: "Scratch", damage_range: 1..2) }
    let(:loot) { TextAdventures::Item.potion("Potion of Heal", price: 10, recovery: 20) }

    it "stores health, attacks, defense, loot, and status effects" do
      expect(creature).to have_attributes(
        name: "cave bat",
        display_name: "Cave Bat",
        defense: 0,
        attacks: [attack],
        loot_table: [loot],
        status_effects: [:blind],
        active_statuses: []
      )
      expect(creature.health).to be_a Extent
    end
  end

  describe "#take_damage" do
    subject(:creature) { described_class.new(name: "Rat", health: 10) }

    it "reduces health" do
      expect { creature.take_damage(4) }
        .to change { creature.health.current }
        .from(10).to(6)
    end

    it "does not reduce health below minimum" do
      creature.take_damage(20)

      expect(creature.health).to have_attributes(current: 0, overload: 10)
    end

    it "returns the creature for command chaining" do
      expect(creature.take_damage(1)).to be creature
    end
  end

  describe "life predicates" do
    subject(:creature) { described_class.new(name: "Rat", health: 2) }

    it "is alive while health is above minimum" do
      expect(creature).to be_alive
      expect(creature).to_not be_dead
    end

    it "is dead when health reaches minimum" do
      creature.take_damage(2)

      expect(creature).to be_dead
      expect(creature).to_not be_alive
    end
  end

  describe "#attack_named" do
    subject(:creature) do
      described_class.new(
        name: "Rat",
        health: 3,
        attacks: [described_class::Attack.new(name: "Tiny Bite", damage_range: 1..1)]
      )
    end

    it "finds attacks by normalized command name" do
      expect(creature.attack_named(" tiny   bite ")).to have_attributes(name: "Tiny Bite")
    end

    it "returns nil when no attack matches" do
      expect(creature.attack_named("claw")).to be_nil
    end
  end

  describe "active statuses" do
    subject(:creature) { described_class.new(name: "Rat", health: 3) }

    it "applies and clears active statuses" do
      creature.apply_status(:freeze)
      creature.apply_status("freeze")

      expect(creature.active_statuses).to eq [:freeze]
      expect(creature).to be_status(:freeze)

      creature.clear_status(:freeze)

      expect(creature).to_not be_status(:freeze)
    end
  end
end
