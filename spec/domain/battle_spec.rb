require 'spec_helper'

RSpec.describe TextAdventures::Battle do
  BattleFixedRandom = Struct.new(:value) do
    def rand(_max)
      value
    end
  end

  subject(:battle) { described_class.new(creature: creature, random: random) }

  let(:creature) { TextAdventures::Creature.giant_spider }
  let(:random) { BattleFixedRandom.new(99) }
  let(:player) { TextAdventures::Character.new(equipped_armor: nil) }

  describe "#attack" do
    it "damages the creature and lets a living enemy counterattack" do
      response = battle.attack(player)

      expect(response).to have_attributes(finished?: false)
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
      critical_battle = described_class.new(creature: creature, random: BattleFixedRandom.new(0))

      response = critical_battle.attack(player)

      expect(response.to_response.to_text).to include "You attack a Giant Spider causing 20 of damage (critical hit)."
      expect(creature.health.current).to eq 15
    end

    it "ends the battle when the creature dies without counterattacking" do
      strong_player = TextAdventures::Character.new(base_attack: 40, equipped_weapon: nil, equipped_armor: nil)

      response = battle.attack(strong_player)

      expect(response).to have_attributes(finished?: true)
      expect(response.to_response.to_text).to eq <<~TEXT.chomp
        You attack a Giant Spider causing 39 of damage.
        Giant Spider dies.
      TEXT
      expect(creature).to be_dead
      expect(strong_player.health.current).to eq 30
    end
  end
end
