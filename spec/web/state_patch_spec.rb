require 'spec_helper'

RSpec.describe TextAdventures::Web::StatePatch do
  it "builds a compact patch for action responses" do
    game = TextAdventures::Game.new(random: Random.new(0))
    game.handle("go ruins")

    patch = described_class.new(game).to_h

    expect(patch).to include(
      scene: "ruins",
      scene_display_name: "Ruins",
      prompt: "Ruins L1",
      battle: { active: false, enemy: nil },
      pending: { confirmation: false }
    )
    expect(patch.fetch(:player)).to include(
      health: { current: 30, max: 30 },
      mana: { current: 12, max: 12 },
      gold: 0,
      statuses: []
    )
    expect(patch.fetch(:player)).not_to have_key(:name)
    expect(patch.dig(:dungeon, :viewport, :terrain)).to be_a String
    expect(patch.dig(:dungeon, :viewport, :entities)).to include(
      hash_including(type: "player")
    )
  end
end
