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

  it "expires idle sessions after the configured TTL" do
    now = Time.utc(2026, 1, 1, 12, 0, 0)
    store = described_class.new(
      id_generator: -> { "game-1" },
      session_ttl_seconds: 10,
      clock: -> { now }
    )
    id, = store.create

    now += 11

    expect(store.fetch(id)).to be_nil
    expect(store.stats.fetch(:active_sessions)).to eq 0
  end

  it "touches sessions when they are accessed" do
    now = Time.utc(2026, 1, 1, 12, 0, 0)
    store = described_class.new(
      id_generator: -> { "game-1" },
      session_ttl_seconds: 10,
      clock: -> { now }
    )
    id, = store.create

    now += 9
    expect(store.fetch(id)).to be_a TextAdventures::Game
    now += 9

    expect(store.fetch(id)).to be_a TextAdventures::Game
  end

  it "rejects new sessions when the active session limit is reached" do
    store = described_class.new(id_generator: -> { "game-1" }, max_sessions: 1)
    store.create

    expect { store.create }.to raise_error(described_class::CapacityExceeded, "Maximum active game sessions reached.")
  end

  it "serializes access through with_game" do
    store = described_class.new(id_generator: -> { "game-1" })
    id, = store.create

    first_thread_entered = Queue.new
    release_first_thread = Queue.new
    events = Queue.new

    first = Thread.new do
      store.with_game(id) do
        events << :first_started
        first_thread_entered << true
        release_first_thread.pop
        events << :first_finished
      end
    end
    first_thread_entered.pop

    second = Thread.new do
      store.with_game(id) { events << :second_started }
    end
    sleep 0.05
    release_first_thread << true
    [first, second].each(&:join)

    expect(3.times.map { events.pop }).to eq %i[first_started first_finished second_started]
  end
end
