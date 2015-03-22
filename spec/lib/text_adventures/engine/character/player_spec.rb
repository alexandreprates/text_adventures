require 'spec_helper'

describe TextAdventures::Engine::Character::Player do
  let(:sword)  { TextAdventures::Engine::Thing::Weapon.new name: "Sword", attack: 10, price: 10 }
  let(:armor)  { TextAdventures::Engine::Thing::Armor.new name: "Leater Armor", defense: 10, price: 10 }
  let!(:frodo) { described_class.new name: 'Frodo', inventory: [sword, armor] }

  describe "#xp" do
    it "when created without xp" do
      expect(frodo.xp).to eq 0
    end
    it "when create with xp" do
      expect(described_class.new(name: 'Sam', xp: 10).xp).to eq 10
    end
    it "when get max_xp level up" do
      frodo.xp += frodo.max_xp
      expect(frodo.level).to eq 2
      expect(frodo.xp).to eq 0
    end
    it "raise multiples levels" do
      frodo.xp = 35
      expect(frodo.level).to eq 5
      expect(frodo.xp).to eq 1
    end
    it "when inc level up" do
      frodo.xp += 6
      expect(frodo.level).to eq 2
    end
    it "can't pass max level" do
      frodo.level = 50
      frodo.xp += 1000000000
      expect(frodo.level).to eq 50
    end
  end

  describe "#max_xp" do
    it "when level change grow" do
      expect(frodo.max_xp).to eq 6
      frodo.level = 2
      expect(frodo.max_xp).to eq 8
      frodo.level = 10
      expect(frodo.max_xp).to eq 21
      frodo.level = 49
      expect(frodo.max_xp).to eq 84
    end
  end

  describe "#equip" do
    it "equip weapon" do
      expect(frodo.weapon).to be nil
      expect(frodo.equip(sword)).to be true
      expect(frodo.weapon).to eq sword
    end
    it "equip armor" do
      expect(frodo.armor).to be nil
      expect(frodo.equip(armor)).to be true
      expect(frodo.armor).to eq armor
    end
    it "be equippable" do
      rock = double('Rock')
      expect(frodo.equip(rock)).to be false
    end
  end

  describe '#invetory' do
    it "list inventory thins" do
      expect(frodo.inventory).to eq [sword, armor]
    end
    it "remove item when equipped" do
      expect(frodo.inventory).to include(sword)
      frodo.equip(sword)
      expect(frodo.inventory).not_to include(sword)
    end
    it "return item when unequipped" do
      other_sword = TextAdventures::Engine::Thing::Weapon.new name: "Other Sword", attack: 10, price: 10
      frodo.inventory << other_sword
      frodo.equip other_sword
      expect(frodo.inventory).to include(sword)
    end
  end

  describe '#pick_up' do
    it "can be picked" do
      expect(frodo.pick_up frodo).to be_falsey
      expect(frodo.pick_up sword).to be true
    end
    it "has space on invetory" do
      allow(frodo).to receive(:inventory_full?) { true }
      expect(frodo.pick_up sword).to be_falsey
    end
  end

end