require 'spec_helper'

describe TextAdventures::Engine::Thing::Armor do
  let(:leater_armor) { described_class.new name: 'Leater Armor', defense: 10, price: 2 }

  describe "#defense" do
    it "need set on create" do
      expect { described_class.new name: 'Raise Armor' }.to raise_error "defense is required"
    end
  end

  describe "#resistance" do
    it "is the inverse of the hit rate" do
      expect(leater_armor.resistance(50)).to eq 5
      expect(leater_armor.resistance(80)).to eq 2
    end
  end

  describe "#adsorb" do
    it "decrease damage" do
      expect(leater_armor.absorb(10, 50)).to eq 5
    end
    it "can absorb all damage" do
      expect(leater_armor.absorb(10, 0)).to eq 0
    end
    it "can't return minus than 0" do
      expect(leater_armor.absorb(1, 0)).to eq 0
    end
  end

end
