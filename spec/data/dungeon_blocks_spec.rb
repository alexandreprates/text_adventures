require 'spec_helper'
require 'yaml'

RSpec.describe "dungeon block catalog" do
  let(:catalog_path) { File.expand_path("../../data/dungeon_blocks.yml", __dir__) }
  let(:blocks) { YAML.safe_load(File.read(catalog_path)).fetch("dungeon_blocks") }

  it "extracts the nine planned corridor blocks" do
    expect(blocks.keys).to contain_exactly(
      "right_exit",
      "left_exit",
      "down_exit",
      "up_exit",
      "four_exits",
      "corner_down_left",
      "corner_down_right",
      "corner_up_left",
      "corner_up_right"
    )
  end

  it "keeps every block in the expected 6x5 tile format" do
    blocks.each_value do |block|
      tiles = block.fetch("tiles")

      expect(tiles.length).to eq 5
      expect(tiles).to all(have_attributes(length: 6))
      expect(tiles).to all(match(/\A[# ]+\z/))
    end
  end

  it "declares only valid exits" do
    valid_exits = %w[up right down left]

    blocks.each_value do |block|
      exits = block.fetch("exits")

      expect(exits).to_not be_empty
      expect(exits).to all(satisfy { |exit| valid_exits.include?(exit) })
    end
  end
end
