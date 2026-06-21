require 'spec_helper'
require 'tmpdir'

RSpec.describe TextAdventures::Persistence::SQLiteGameRepository do
  around do |example|
    Dir.mktmpdir("text-adventures-saves") do |dir|
      @save_dir = dir
      example.run
    end
  end

  let(:repository) { described_class.new(save_dir: @save_dir, clock: -> { Time.utc(2026, 6, 21, 12, 0, 0) }) }

  it "saves and loads the latest snapshot for one game" do
    game = TextAdventures::Game.new(random: TextAdventures::RandomSource.new(seed: 0))
    repository.save("game-1", game)
    game.handle("go ruins")
    repository.save("game-1", game)

    loaded = repository.load("game-1")

    expect(loaded.current_scene_name).to eq :ruins
    expect(repository.database_path("game-1")).to end_with("game-1.sqlite3")
  end

  it "keeps separate SQLite files for separate games" do
    repository.save("game-1", TextAdventures::Game.new(random: TextAdventures::RandomSource.new(seed: 1)))
    repository.save("game-2", TextAdventures::Game.new(random: TextAdventures::RandomSource.new(seed: 2)))

    expect(File).to exist(repository.database_path("game-1"))
    expect(File).to exist(repository.database_path("game-2"))
    expect(repository.database_path("game-1")).not_to eq repository.database_path("game-2")
  end

  it "prunes snapshot history to the configured limit" do
    limited_repository = described_class.new(save_dir: @save_dir, history_limit: 2)
    game = TextAdventures::Game.new(random: TextAdventures::RandomSource.new(seed: 0))

    3.times { limited_repository.save("game-1", game) }

    db = SQLite3::Database.new(limited_repository.database_path("game-1"))
    expect(db.get_first_value("SELECT COUNT(*) FROM snapshots")).to eq 2
  ensure
    db&.close
  end

  it "deletes database sidecar files" do
    repository.save("game-1", TextAdventures::Game.new(random: TextAdventures::RandomSource.new(seed: 0)))
    path = repository.database_path("game-1")
    File.write("#{path}-wal", "")
    File.write("#{path}-shm", "")

    expect(repository.delete("game-1")).to be true

    expect(File).not_to exist(path)
    expect(File).not_to exist("#{path}-wal")
    expect(File).not_to exist("#{path}-shm")
  end

  it "returns nil for a missing save" do
    expect(repository.load("missing")).to be_nil
  end

  it "rejects unsafe game ids" do
    expect { repository.database_path("../outside") }.to raise_error(TextAdventures::Persistence::InvalidGameId)
  end

  it "wraps corrupt snapshot data in a persistence error" do
    repository.save("game-1", TextAdventures::Game.new(random: TextAdventures::RandomSource.new(seed: 0)))
    db = SQLite3::Database.new(repository.database_path("game-1"))
    db.execute("UPDATE snapshots SET payload_json = ?", ["{"])
    db.close

    expect { repository.load("game-1") }.to raise_error(TextAdventures::Persistence::Error, "Could not load game.")
  end
end
