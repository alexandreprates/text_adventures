require 'spec_helper'
require 'tmpdir'

RSpec.describe TextAdventures::Web::GameStore do
  around do |example|
    Dir.mktmpdir("text-adventures-store") do |dir|
      @save_dir = dir
      example.run
    end
  end

  def repository
    TextAdventures::Persistence::SQLiteGameRepository.new(save_dir: @save_dir)
  end

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

  it "persists created games when a repository is configured" do
    store = described_class.new(id_generator: -> { "game-1" }, repository: repository)

    id, = store.create(seed: 0)

    expect(File).to exist(repository.database_path(id))
  end

  it "restores a persisted game after the memory session expires" do
    now = Time.utc(2026, 1, 1, 12, 0, 0)
    store = described_class.new(
      id_generator: -> { "game-1" },
      session_ttl_seconds: 1,
      clock: -> { now },
      repository: repository
    )
    id, = store.create(seed: 0)
    store.with_game(id, save: true) { |game| game.handle("go ruins") }

    now += 2
    restored = store.fetch(id)

    expect(restored.current_scene_name).to eq :ruins
  end

  it "deletes memory and persisted save data together" do
    store = described_class.new(id_generator: -> { "game-1" }, repository: repository)
    id, = store.create(seed: 0)

    expect(store.delete(id)).to be true

    expect(store.fetch(id)).to be_nil
    expect(File).not_to exist(repository.database_path(id))
  end

  it "keeps separate games isolated in separate databases" do
    ids = ["game-1", "game-2"]
    store = described_class.new(id_generator: -> { ids.shift }, repository: repository)
    first_id, = store.create(seed: 1)
    second_id, = store.create(seed: 2)

    store.with_game(first_id, save: true) { |game| game.player.gold = 12 }
    store.with_game(second_id, save: true) { |game| game.player.gold = 34 }

    first = repository.load(first_id)
    second = repository.load(second_id)

    expect(first.player.gold).to eq 12
    expect(second.player.gold).to eq 34
  end
end
