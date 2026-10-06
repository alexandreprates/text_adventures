require 'spec_helper'
require 'tmpdir'
require 'timeout'

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

  def dungeon_state(game)
    TextAdventures::Web::GameSerializer.new(game).to_h.fetch(:dungeon)
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

  it "derives deterministic world seeds from game ids when no seed is provided" do
    store = described_class.new(repository: repository)

    first_id, first_game = store.create(id: "bookmark-world")
    first_game.handle("go ruins")
    3.times { first_game.handle("go right") }
    first_dungeon = dungeon_state(first_game)

    expect(store.delete(first_id)).to be true

    second_id, second_game = store.create(id: "bookmark-world")
    second_game.handle("go ruins")
    3.times { second_game.handle("go right") }

    expect(second_id).to eq first_id
    expect(second_game.world_seed).to eq first_game.world_seed
    expect(dungeon_state(second_game)).to eq first_dungeon
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

  it "allows another player to act while one game's action is blocked" do
    store = described_class.new
    first_id, = store.create
    second_id, = store.create
    entered = Queue.new
    release = Queue.new
    worker = Thread.new { store.with_game(first_id) { entered << true; release.pop } }
    Timeout.timeout(2) { entered.pop }

    expect(Timeout.timeout(2) { store.with_game(second_id) { :completed } }).to eq :completed
  ensure
    release << true if release
    worker&.join(2)
  end

  it "does not expire or restore a second copy of a game with an action in progress" do
    now = Time.utc(2026, 10, 6)
    store = described_class.new(repository: repository, clock: -> { now }, session_ttl_seconds: 1)
    id, game = store.create
    entered = Queue.new
    release = Queue.new
    worker = Thread.new do
      store.with_game(id, save: true) do |active|
        active.player.gold = 7
        entered << true
        release.pop
      end
    end
    Timeout.timeout(2) { entered.pop }
    now += 2

    expect(store.fetch(id)).to equal game
    expect(store.stats.fetch(:active_sessions)).to eq 1
    release << true
    worker.value
    expect(repository.load(id).player.gold).to eq 7
  ensure
    release << true if release
    worker&.join(2)
  end

  it "waits for an in-flight save before deleting the game permanently" do
    store = described_class.new(repository: repository)
    id, = store.create
    entered = Queue.new
    release = Queue.new
    worker = Thread.new do
      store.with_game(id, save: true) { |game| entered << true; release.pop; game.player.gold = 7 }
    end
    Timeout.timeout(2) { entered.pop }
    deleted = Queue.new
    deleter = Thread.new { deleted << store.delete(id) }
    Timeout.timeout(2) { Thread.pass until deleter.status == 'sleep' || !deleted.empty? }

    expect(deleted).to be_empty
    release << true
    worker.value
    expect(Timeout.timeout(2) { deleted.pop }).to be true
    expect(store.fetch(id)).to be_nil
    expect(File).not_to exist(repository.database_path(id))
  ensure
    release << true if release
    worker&.join(2)
    deleter&.join(2)
  end

  it "releases session reservations after an action raises" do
    now = Time.utc(2026, 10, 6)
    store = described_class.new(clock: -> { now }, session_ttl_seconds: 1)
    id, = store.create

    expect { store.with_game(id) { raise "failed action" } }.to raise_error("failed action")
    now += 2

    expect(store.stats.fetch(:active_sessions)).to eq 0
  end

  it "rejects an action queued behind deletion instead of resurrecting the save" do
    persistence = repository
    store = described_class.new(repository: persistence)
    id, = store.create
    deleting = Queue.new
    release = Queue.new
    allow(persistence).to receive(:delete).and_wrap_original do |original, game_id|
      deleting << true
      release.pop
      original.call(game_id)
    end
    deleter = Thread.new { store.delete(id) }
    Timeout.timeout(2) { deleting.pop }
    action = Thread.new { store.with_game(id, save: true) { |game| game.player.gold = 99 } }
    Timeout.timeout(2) { Thread.pass until action.status == 'sleep' }

    release << true
    expect(deleter.value).to be true
    expect(action.value).to be_nil
    expect(persistence.load(id)).to be_nil
  ensure
    release << true if release
    deleter&.join(2)
    action&.join(2)
  end

  it "can delete an uncached save even when the session cache is full" do
    saved_store = described_class.new(repository: repository)
    saved_id, = saved_store.create
    store = described_class.new(repository: repository, max_sessions: 1)
    active_id, = store.create

    expect(store.delete(saved_id)).to be true
    expect(repository.load(saved_id)).to be_nil
    expect(store.fetch(active_id)).not_to be_nil
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
