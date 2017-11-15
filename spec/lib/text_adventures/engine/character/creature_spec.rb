require 'spec_helper'

describe TextAdventures::Engine::Character::Creature do

  let!(:monster) { described_class.new name: 'Monster', level: 1 }

  describe '#loot' do
    it "must be dead" do
      expect(monster.loot).to be false
      monster.hp = 0
      expect(monster.loot).not_to be false
    end
  end

end
