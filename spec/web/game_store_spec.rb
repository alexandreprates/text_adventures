require 'spec_helper'

RSpec.describe TextAdventures::Web::GameStore do
  it "creates, fetches, and deletes game sessions" do
    store = described_class.new(id_generator: -> { "game-1" })

    id, game = store.create

    expect(id).to eq "game-1"
    expect(game).to be_a TextAdventures::Game
    expect(store.fetch(id)).to equal game
    expect(store.delete(id)).to be true
    expect(store.fetch(id)).to be_nil
    expect(store.delete(id)).to be false
  end

  it "uses deterministic seeds when creating games" do
    store = described_class.new(id_generator: -> { "seeded" })
    _id, game = store.create(seed: 0)

    game.handle("go ruins")
    5.times { game.handle("go right") }
    game.handle("go up")

    expect(game.dungeon.viewport_state.fetch(:entities)).to include(hash_including(type: "enemy"))
  end

  it "uses a default seed when no create seed is provided" do
    store = described_class.new(id_generator: -> { "seeded" }, default_seed: 0)
    _id, game = store.create

    game.handle("go ruins")
    5.times { game.handle("go right") }
    game.handle("go up")

    expect(game.dungeon.viewport_state.fetch(:entities)).to include(hash_including(type: "enemy"))
  end
end
