require 'spec_helper'

RSpec.describe TextAdventures::LootDrop do
  let(:fang) { TextAdventures::Item.junk("Cracked Fang", price: 2) }

  it "coerces legacy item arrays" do
    loot = described_class.coerce([fang])

    expect(loot).to contain_exactly(fang)
    expect(loot.gold).to eq 0
    expect(loot).to_not be_empty
  end

  it "tracks gold-only loot" do
    loot = described_class.new(gold: 4)

    expect(loot.items).to eq []
    expect(loot.gold).to eq 4
    expect(loot).to_not be_empty
    expect(loot.first).to be_nil
  end

  it "can compare with legacy arrays when no gold is present" do
    expect(described_class.new(items: [fang])).to eq [fang]
    expect(described_class.new(items: [fang], gold: 1)).to_not eq [fang]
  end
end
