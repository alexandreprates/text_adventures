require 'spec_helper'

RSpec.describe TextAdventures::Inventory do
  subject(:inventory) { described_class.new }

  let(:sword) { TextAdventures::Item.weapon("Sword", price: 15, attack: 10) }
  let(:spear) { TextAdventures::Item.weapon("Spear", price: 50, attack: 22, defense: 5) }
  let(:potion) { TextAdventures::Item.potion("Potion of Heal", price: 10, recovery: 20) }
  let(:armor) { TextAdventures::Item.armor("Leather Armor", price: 20, defense: 20) }
  let(:tome) { TextAdventures::Item.tome("Tome of Ice Bolt", price: 25, spell: "Ice Bolt") }

  describe ".new" do
    it "can start empty" do
      expect(inventory).to be_empty
      expect(inventory.entries_list).to eq []
    end

    it "can start with items" do
      inventory = described_class.new([sword, sword, potion])

      expect(inventory.quantity("sword")).to eq 2
      expect(inventory.quantity("potion of heal")).to eq 1
    end
  end

  describe "#add" do
    it "adds an item" do
      inventory.add(sword)

      expect(inventory.find("sword")).to eq sword
      expect(inventory.quantity("sword")).to eq 1
    end

    it "stacks duplicate items by command name" do
      same_sword = TextAdventures::Item.weapon("  sword  ", price: 99, attack: 50)

      inventory.add(sword)
      inventory.add(same_sword, quantity: 2)

      expect(inventory.quantity("SWORD")).to eq 3
      expect(inventory.find("sword")).to eq sword
    end
  end

  describe "#find" do
    before { inventory.add(tome) }

    it "searches by command-friendly name" do
      expect(inventory.find(" tome   of ice bolt ")).to eq tome
    end

    it "returns nil for missing items" do
      expect(inventory.find("fireball")).to be_nil
    end
  end

  describe "#remove" do
    before do
      inventory.add(potion, quantity: 3)
      inventory.add(armor)
    end

    it "removes one item by default" do
      result = inventory.remove("potion of heal")

      expect(result).to have_attributes(
        success?: true,
        item: potion,
        quantity: 1,
        message: "Removed 1x Potion of Heal."
      )
      expect(inventory.quantity("potion of heal")).to eq 2
    end

    it "removes a requested quantity" do
      result = inventory.remove("potion of heal", quantity: 2)

      expect(result).to have_attributes(success?: true, quantity: 2)
      expect(inventory.quantity("potion of heal")).to eq 1
    end

    it "removes the remaining quantity when request exceeds the stack" do
      result = inventory.remove("leather armor", quantity: 4)

      expect(result).to have_attributes(success?: true, quantity: 1)
      expect(inventory.find("leather armor")).to be_nil
      expect(inventory.quantity("leather armor")).to eq 0
    end

    it "returns a clear result for missing items" do
      result = inventory.remove("missing sword")

      expect(result).to have_attributes(
        success?: false,
        item: nil,
        quantity: 0,
        message: "Item not found: missing sword."
      )
    end
  end

  describe "#render" do
    it "renders an empty inventory" do
      expect(inventory.render).to eq "Currently you have nothing."
    end

    it "renders quantities and useful item details" do
      inventory.add(sword)
      inventory.add(tome, quantity: 2)
      inventory.add(potion, quantity: 3)
      inventory.add(armor)
      inventory.add(spear)

      expect(inventory.render).to eq <<~TEXT.chomp
        Currently you have:
         1x Leather Armor (Def: 20)
         3x Potion of Heal (Recovery 20 Health)
         1x Spear (Atk: 22, Def: 5)
         1x Sword (Atk: 10)
         2x Tome of Ice Bolt
      TEXT
    end
  end
end
