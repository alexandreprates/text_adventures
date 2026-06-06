require 'spec_helper'

RSpec.describe TextAdventures::Battle do
  BattleSequenceRandom = Struct.new(:values) do
    def rand(_max)
      values.shift
    end
  end

  subject(:battle) { described_class.new(creature: creature, random: random) }

  let(:creature) { TextAdventures::Creature.giant_spider }
  let(:random) { BattleSequenceRandom.new([99, 0]) }
  let(:player) { TextAdventures::Character.new(equipped_armor: nil) }

  describe "#attack" do
    it "damages the creature and lets a living enemy counterattack" do
      response = battle.attack(player)

      expect(response).to have_attributes(finished?: false)
      expect(response.loot).to eq []
      expect(response.to_response.to_text).to eq <<~TEXT.chomp
        You attack a Giant Spider causing 10 of damage.
        Giant Spider attacks you with Bite causing 2 of damage.
      TEXT
      expect(creature.health.current).to eq 25
      expect(player.health.current).to eq 28
    end

    it "uses player defense to reduce enemy counterattack damage" do
      defended_player = TextAdventures::Character.new

      battle.attack(defended_player)

      expect(defended_player.health.current).to eq 30
    end

    it "supports critical hits" do
      critical_battle = described_class.new(creature: creature, random: BattleSequenceRandom.new([0, 0]))

      response = critical_battle.attack(player)

      expect(response.to_response.to_text).to include "You attack a Giant Spider causing 20 of damage (critical hit)."
      expect(creature.health.current).to eq 15
    end

    it "ends the battle when the creature dies without counterattacking" do
      strong_player = TextAdventures::Character.new(base_attack: 40, equipped_weapon: nil, equipped_armor: nil)

      response = battle.attack(strong_player)

      expect(response).to have_attributes(finished?: true)
      expect(response.loot).to eq creature.loot_table
      expect(response.to_response.to_text).to eq <<~TEXT.chomp
        You attack a Giant Spider causing 39 of damage.
        Giant Spider dies.
      TEXT
      expect(creature).to be_dead
      expect(strong_player.health.current).to eq 30
    end

    it "applies poison from poison bite when the status roll succeeds" do
      poison_battle = described_class.new(
        creature: creature,
        random: BattleSequenceRandom.new([99, 1, 0])
      )

      response = poison_battle.attack(player)

      expect(response.to_response.to_text).to eq <<~TEXT.chomp
        You attack a Giant Spider causing 10 of damage.
        Giant Spider attacks you with Poison Bite causing 1 of damage.
        You are poisoned.
      TEXT
      expect(player).to be_status(:poison)
    end

    it "ticks poison damage over time before the player attacks" do
      player.apply_status(:poison)

      response = battle.attack(player)

      expect(response.to_response.to_text).to start_with "Poison deals 2 damage."
      expect(player.health.current).to eq 26
    end
  end

  describe "#cast_spell" do
    it "can force Ice Bolt to freeze the creature and skip its turn" do
      freeze_battle = described_class.new(
        creature: creature,
        random: BattleSequenceRandom.new([0])
      )

      response = freeze_battle.cast_spell(player, TextAdventures::Spell.ice_bolt)

      expect(response.to_response.to_text).to eq <<~TEXT.chomp
        You cast Ice Bolt causing 4 of damage.
        Giant Spider is frozen.
        Giant Spider is frozen and loses its turn.
      TEXT
      expect(creature.health.current).to eq 31
      expect(creature).to_not be_status(:freeze)
      expect(player.health.current).to eq 30
    end

    it "counterattacks when Ice Bolt does not freeze" do
      no_freeze_battle = described_class.new(
        creature: creature,
        random: BattleSequenceRandom.new([99, 0])
      )

      response = no_freeze_battle.cast_spell(player, TextAdventures::Spell.ice_bolt)

      expect(response.to_response.to_text).to eq <<~TEXT.chomp
        You cast Ice Bolt causing 4 of damage.
        Giant Spider attacks you with Bite causing 2 of damage.
      TEXT
      expect(player.health.current).to eq 28
    end
  end
end
