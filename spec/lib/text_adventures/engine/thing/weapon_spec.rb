require 'spec_helper'

describe TextAdventures::Engine::Thing::Weapon do
  let!(:sword) { described_class.new(name: 'Sword', attack: 10, price: 5) }

  describe "#attack" do
    it "be mandatory" do
      expect { described_class.new(name: 'Sword', price: 5) }.to raise_error "attack is required"
    end
    it "be readable" do
      expect(sword.attack).to eq 10
    end
  end

  describe "#defense" do
    it "is optional" do
      expect(sword.defense).to be nil
    end
  end

  describe "#has_defense?" do
    it "true when defense is set" do
      expect(sword.has_defense?).to be false
      sword.defense = 1
      expect(sword.has_defense?).to be true
    end
  end

  describe "#info" do
    it "show name and attack" do
      expect(sword.info).to eq "Sword (atk: 10)"
    end
    it "show defense when have" do
      sword.defense = 4
      expect(sword.info).to eq "Sword (atk: 10, def: 4)"
    end
  end

  describe "#damage" do
    it "calculate based on hit_rate" do
      expect(sword.damage(100)).to eq sword.attack
      expect(sword.damage(50)).to eq(sword.attack / 2)
    end
  end

  describe '#is_weapon?' do
    it "return true" do
      expect(sword.is_weapon?).to be true
    end
  end

  describe '#is_equippable?' do
    it "return true" do
      expect(sword.is_equippable?).to be true
    end
  end

end