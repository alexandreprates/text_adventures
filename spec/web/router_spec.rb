require 'json'
require 'spec_helper'

RSpec.describe TextAdventures::Web::Router do
  subject(:router) { described_class.new(store: store) }

  let(:store) { TextAdventures::Web::GameStore.new(id_generator: id_generator) }
  let(:ids) { ["game-1", "game-2"] }
  let(:id_generator) { -> { ids.shift } }

  def parsed(response)
    JSON.parse(response.json)
  end

  it "creates a game and returns initial state" do
    response = router.call(method: "POST", path: "/games", body: '{"seed":0}')

    expect(response.status).to eq 201
    expect(parsed(response)).to include(
      "game_id" => "game-1",
      "response" => hash_including(
        "lines" => include("Welcome to Text Adventures")
      ),
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
      "response" => hash_including("lines" => include("You go to Ruins.")),
      "events" => include(hash_including("type" => "travel.changed_scene", "text" => "You go to Ruins.")),
      "state" => hash_including(
        "scene" => "ruins",
        "prompt" => "Ruins L1",
        "dungeon" => hash_including("level" => 1)
      )
    )

    state_response = router.call(method: "GET", path: "/games/#{game_id}", body: nil)
    expect(state_response.status).to eq 200
    expect(parsed(state_response).dig("state", "scene")).to eq "ruins"

    delete_response = router.call(method: "DELETE", path: "/games/#{game_id}", body: nil)
    expect(delete_response.status).to eq 204
    expect(delete_response.json).to eq ""

    missing_response = router.call(method: "GET", path: "/games/#{game_id}", body: nil)
    expect(missing_response.status).to eq 404
    expect(parsed(missing_response).dig("error", "code")).to eq "not_found"
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
      "response" => hash_including("lines" => include("You go to Ruins.")),
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
      "response" => hash_including("lines" => include("You go to Ruins.")),
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
end
