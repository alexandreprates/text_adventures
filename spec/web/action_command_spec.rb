require 'spec_helper'

RSpec.describe TextAdventures::Web::ActionCommand do
  it "maps standalone actions to commands" do
    expect(described_class.call("type" => "attack")).to eq "attack"
    expect(described_class.call("type" => "inventory")).to eq "inventory"
    expect(described_class.call("type" => "loot")).to eq "loot"
    expect(described_class.call("type" => "no")).to eq "no"
    expect(described_class.call("type" => "show")).to eq "show"
    expect(described_class.call("type" => "spellbook")).to eq "spellbook"
  end

  it "maps targeted actions to semantic commands" do
    expect(described_class.call("type" => "move", "direction" => "right")).to eq "go right"
    expect(described_class.call("type" => "travel", "destination" => "blacksmith")).to eq "go blacksmith"
    expect(described_class.call("type" => "buy", "item" => "padded armor")).to eq "buy padded armor"
    expect(described_class.call("type" => "trade", "buy" => ["iron dagger"], "sell" => ["sword"])).to eq "trade buy=iron dagger;sell=sword"
    expect(described_class.call("type" => "cast", "spell" => "fireball")).to eq "cast fireball"
  end

  it "rejects missing and unsupported actions" do
    expect { described_class.call({}) }.to raise_error ArgumentError, "Action type is required."
    expect { described_class.call("type" => "dance") }.to raise_error ArgumentError, "Unsupported action type: dance."
    expect { described_class.call("type" => "move") }.to raise_error ArgumentError, "Action field direction is required for move."
    expect { described_class.call("type" => "trade") }.to raise_error ArgumentError, "At least one trade item is required."
  end
end
