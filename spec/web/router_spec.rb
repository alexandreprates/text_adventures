require 'json'
require 'spec_helper'
require 'tmpdir'

RSpec.describe TextAdventures::Web::Router do
  subject(:router) { described_class.new(store: store) }

  let(:store) { TextAdventures::Web::GameStore.new(id_generator: id_generator) }
  let(:ids) { ["game-1", "game-2"] }
  let(:id_generator) { -> { ids.shift } }

  around do |example|
    Dir.mktmpdir("text-adventures-router") do |dir|
      @save_dir = dir
      example.run
    end
  end

  def parsed(response)
    JSON.parse(response.json)
  end

  def persistent_store(id_generator: -> { "game-1" })
    TextAdventures::Web::GameStore.new(
      id_generator: id_generator,
      repository: TextAdventures::Persistence::SQLiteGameRepository.new(save_dir: @save_dir)
    )
  end

  it "creates a game and returns initial state" do
    response = router.call(method: "POST", path: "/games", body: '{"seed":0}')

    expect(response.status).to eq 201
    expect(parsed(response)).to include(
      "game_id" => "game-1",
      "events" => include(
        hash_including("type" => "message", "text" => "Welcome to Text Adventures")
      ),
      "state" => hash_including(
        "scene" => "town",
        "player" => hash_including("name" => "Adventurer")
      )
    )
    expect(parsed(response).fetch("state")).not_to have_key("history")
  end

  it "returns health metadata" do
    response = router.call(method: "GET", path: "/api/health", body: nil)

    expect(response.status).to eq 200
    expect(parsed(response)).to include(
      "status" => "ok",
      "sessions" => hash_including(
        "active_sessions" => 0,
        "max_sessions" => TextAdventures::Web::GameStore::DEFAULT_MAX_SESSIONS
      )
    )
  end

  it "fetches game state, executes actions, and deletes sessions" do
    create_response = router.call(method: "POST", path: "/games", body: "")
    game_id = parsed(create_response).fetch("game_id")

    action_response = router.call(
      method: "POST",
      path: "/games/#{game_id}/actions",
      body: '{"type":"travel","destination":"ruins"}'
    )
    expect(action_response.status).to eq 200
    expect(parsed(action_response)).to include(
      "events" => include(hash_including("type" => "travel.changed_scene", "text" => "You go to Ruins.")),
      "state" => hash_including(
        "scene" => "ruins",
        "prompt" => "Ruins L1",
        "dungeon" => hash_including("level" => 1)
      )
    )

    state_response = router.call(method: "GET", path: "/games/#{game_id}", body: nil)
    expect(state_response.status).to eq 200
    expect(parsed(state_response).dig("state", "scene")).to eq "town"

    delete_response = router.call(method: "DELETE", path: "/games/#{game_id}", body: nil)
    expect(delete_response.status).to eq 204
    expect(delete_response.json).to eq ""

    recreated_response = router.call(method: "GET", path: "/games/#{game_id}", body: nil)
    expect(recreated_response.status).to eq 200
    expect(parsed(recreated_response)).to include(
      "game_id" => game_id,
      "state" => hash_including("scene" => "town")
    )
  end

  it "accepts API-prefixed game routes for reverse proxy deployments" do
    create_response = router.call(method: "POST", path: "/api/games", body: '{"seed":0}')
    game_id = parsed(create_response).fetch("game_id")

    action_response = router.call(
      method: "POST",
      path: "/api/games/#{game_id}/actions",
      body: '{"type":"travel","destination":"ruins"}'
    )

    expect(action_response.status).to eq 200
    expect(parsed(action_response)).to include(
      "events" => include(hash_including("type" => "travel.changed_scene", "text" => "You go to Ruins.")),
      "state" => hash_including("scene" => "ruins")
    )
  end

  it "executes structured actions" do
    create_response = router.call(method: "POST", path: "/api/games", body: '{"seed":0}')
    game_id = parsed(create_response).fetch("game_id")

    action_response = router.call(
      method: "POST",
      path: "/api/games/#{game_id}/actions",
      body: '{"type":"travel","destination":"ruins"}'
    )

    expect(action_response.status).to eq 200
    expect(parsed(action_response)).to include(
      "events" => include(hash_including("type" => "travel.changed_scene", "text" => "You go to Ruins.")),
      "state" => hash_including("scene" => "ruins")
    )

    removed_command_response = router.call(
      method: "POST",
      path: "/api/games/#{game_id}/commands",
      body: '{"command":"look"}'
    )
    expect(removed_command_response.status).to eq 404
    expect(parsed(removed_command_response).dig("error", "code")).to eq "not_found"
  end

  it "returns JSON errors for invalid requests" do
    create_response = router.call(method: "POST", path: "/games", body: "{}")
    game_id = parsed(create_response).fetch("game_id")

    invalid_json = router.call(method: "POST", path: "/games/#{game_id}/actions", body: "{")
    expect(invalid_json.status).to eq 400
    expect(parsed(invalid_json).dig("error", "code")).to eq "invalid_json"

    missing_action = router.call(method: "POST", path: "/api/games/#{game_id}/actions", body: "{}")
    expect(missing_action.status).to eq 400
    expect(parsed(missing_action).dig("error", "message")).to eq "Action type is required."

    missing_route = router.call(method: "GET", path: "/missing", body: nil)
    expect(missing_route.status).to eq 404
    expect(parsed(missing_route).dig("error", "message")).to eq "Route not found."

    wrong_method = router.call(method: "GET", path: "/games", body: nil)
    expect(wrong_method.status).to eq 405
    expect(parsed(wrong_method).dig("error", "code")).to eq "method_not_allowed"
  end

  it "returns a service unavailable error when the session store is full" do
    full_store = TextAdventures::Web::GameStore.new(id_generator: -> { "game-1" }, max_sessions: 0)
    router = described_class.new(store: full_store)

    response = router.call(method: "POST", path: "/api/games", body: "{}")

    expect(response.status).to eq 503
    expect(parsed(response).dig("error", "code")).to eq "server_busy"
  end

  it "returns persisted games to town when fetched by a new page load" do
    first_router = described_class.new(store: persistent_store)
    create_response = first_router.call(method: "POST", path: "/api/games", body: '{"seed":0}')
    game_id = parsed(create_response).fetch("game_id")
    first_router.call(
      method: "POST",
      path: "/api/games/#{game_id}/actions",
      body: '{"type":"travel","destination":"ruins"}'
    )

    second_router = described_class.new(store: persistent_store(id_generator: -> { "unused" }))
    state_response = second_router.call(method: "GET", path: "/api/games/#{game_id}", body: nil)
    restored_game = TextAdventures::Persistence::SQLiteGameRepository.new(save_dir: @save_dir).load(game_id)

    expect(state_response.status).to eq 200
    expect(parsed(state_response).dig("state", "scene")).to eq "town"
    expect(restored_game.current_scene_name).to eq :town
  end

  it "deletes persisted game data through the API" do
    persistent_router = described_class.new(store: persistent_store)
    create_response = persistent_router.call(method: "POST", path: "/api/games", body: '{"seed":0}')
    game_id = parsed(create_response).fetch("game_id")

    expect(persistent_router.call(method: "DELETE", path: "/api/games/#{game_id}", body: nil).status).to eq 204

    restored_router = described_class.new(store: persistent_store(id_generator: -> { "unused" }))
    recreated_response = restored_router.call(method: "GET", path: "/api/games/#{game_id}", body: nil)
    recreated_game = TextAdventures::Persistence::SQLiteGameRepository.new(save_dir: @save_dir).load(game_id)

    expect(recreated_response.status).to eq 200
    expect(parsed(recreated_response)).to include(
      "game_id" => game_id,
      "state" => hash_including("scene" => "town")
    )
    expect(recreated_game.world_seed).to eq TextAdventures::Web::GameStore.world_seed_for(game_id)
  end

  it "rejects unsafe persisted game ids" do
    persistent_router = described_class.new(store: persistent_store)

    response = persistent_router.call(method: "GET", path: "/api/games/..", body: nil)

    expect(response.status).to eq 400
    expect(parsed(response).dig("error", "code")).to eq "invalid_request"
  end
end
