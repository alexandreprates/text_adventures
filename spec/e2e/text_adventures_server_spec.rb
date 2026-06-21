require 'json'
require 'fileutils'
require 'net/http'
require 'open3'
require 'socket'
require 'spec_helper'
require 'timeout'
require 'tmpdir'

RSpec.describe "text_adventures server binary" do
  let(:root) { File.expand_path("../..", __dir__) }
  let(:binary) { File.join(root, "bin", "text_adventures") }

  it "serves the JSON game API over HTTP" do
    with_server do |port|
      create_response = request_json(port, Net::HTTP::Post, "/games", seed: 0)
      expect(create_response.code).to eq "201"
      created = JSON.parse(create_response.body)
      game_id = created.fetch("game_id")
      expect(created.dig("state", "scene")).to eq "town"
      expect(created.fetch("events")).to include hash_including("type" => "message", "text" => "Welcome to Text Adventures")
      expect(created).not_to have_key("response")

      action_response = request_json(port, Net::HTTP::Post, "/games/#{game_id}/actions", action_for("go ruins"))
      expect(action_response.code).to eq "200"
      action_body = JSON.parse(action_response.body)
      expect(action_body.fetch("events")).to include hash_including("type" => "travel.changed_scene", "text" => "You go to Ruins.")
      expect(action_body.fetch("events").map { |event| event.fetch("text") }).not_to include(a_string_matching(/\A[?#.xE@P>]+\z/))
      expect(action_body.fetch("events").map { |event| event.fetch("text") }).not_to include("Here you can:")
      expect(action_body).not_to have_key("response")
      expect(action_body.dig("state", "scene")).to eq "ruins"
      expect(action_body.dig("state", "dungeon")).not_to have_key("map")
      expect(action_body.dig("state", "dungeon", "viewport")).to include(
        "width" => 18,
        "height" => 15,
        "terrain" => a_string_matching(/\A[?#.]+\z/),
        "entities" => include(hash_including("type" => "player"))
      )

      state_response = request_json(port, Net::HTTP::Get, "/games/#{game_id}")
      expect(state_response.code).to eq "200"
      expect(JSON.parse(state_response.body).dig("state", "prompt")).to eq "Town"

      delete_response = request_json(port, Net::HTTP::Delete, "/games/#{game_id}")
      expect(delete_response.code).to eq "204"
      expect(delete_response.body.to_s).to eq ""
    end
  end

  it "descends to the next dungeon level over HTTP actions" do
    with_server do |port|
      create_response = request_json(port, Net::HTTP::Post, "/games", seed: 5)
      game_id = JSON.parse(create_response.body).fetch("game_id")
      body = nil

      [
        "go ruins",
        "go right",
        "go right",
        "go right",
        "go right",
        "go right",
        "go up",
        "go up",
        "go up",
        "go right",
        "go up",
        "go up",
        "go right",
        "go right"
      ].each do |command|
        action_response = request_json(port, Net::HTTP::Post, "/games/#{game_id}/actions", action_for(command))
        expect(action_response.code).to eq "200"
        body = JSON.parse(action_response.body)
      end

      expect(body.fetch("events")).to include hash_including("type" => "movement", "text" => "You descend deeper into the ruins.")
      expect(body.fetch("events").map { |event| event.fetch("text") }).not_to include(a_string_matching(/\A[?#.xE@P>]+\z/))
      expect(body.dig("state", "prompt")).to eq "Ruins L2"
      expect(body.dig("state", "dungeon", "level")).to eq 2
      expect(body.dig("state", "dungeon", "entrance_portal")).to be_nil
      expect(body.dig("state", "dungeon", "ascent")).to eq("x" => 3, "y" => 2)
    end
  end

  it "leaves browser frontend assets to the web proxy" do
    with_server do |port|
      index_response = request_json(port, Net::HTTP::Get, "/")
      expect(index_response.code).to eq "404"
      expect(index_response["Content-Type"]).to include "application/json"
      expect(JSON.parse(index_response.body).dig("error", "code")).to eq "not_found"

      styles_response = request_json(port, Net::HTTP::Get, "/styles.css")
      expect(styles_response.code).to eq "404"
      expect(styles_response["Content-Type"]).to include "application/json"
    end
  end

  it "serves API-prefixed game routes for proxy deployments" do
    with_server do |port|
      create_response = request_json(port, Net::HTTP::Post, "/api/games", seed: 0)
      expect(create_response.code).to eq "201"

      game_id = JSON.parse(create_response.body).fetch("game_id")
      action_response = request_json(port, Net::HTTP::Post, "/api/games/#{game_id}/actions", action_for("go ruins"))
      expect(action_response.code).to eq "200"
      expect(JSON.parse(action_response.body).dig("state", "scene")).to eq "ruins"
    end
  end

  it "continues a persisted game after the API process restarts" do
    Dir.mktmpdir("text-adventures-e2e-saves") do |save_dir|
      game_id = nil
      with_server("TEXT_ADVENTURES_SAVE_DIR" => save_dir) do |port|
        create_response = request_json(port, Net::HTTP::Post, "/api/games", seed: 0)
        game_id = JSON.parse(create_response.body).fetch("game_id")
        action_response = request_json(port, Net::HTTP::Post, "/api/games/#{game_id}/actions", action_for("go ruins"))
        expect(action_response.code).to eq "200"
        expect(JSON.parse(action_response.body).dig("state", "scene")).to eq "ruins"
      end

      expect(File).to exist(File.join(save_dir, "#{game_id}.sqlite3"))

      with_server("TEXT_ADVENTURES_SAVE_DIR" => save_dir) do |port|
        state_response = request_json(port, Net::HTTP::Get, "/api/games/#{game_id}")
        restored = JSON.parse(state_response.body)

        expect(state_response.code).to eq "200"
        expect(restored.dig("state", "scene")).to eq "town"

        travel_response = request_json(port, Net::HTTP::Post, "/api/games/#{game_id}/actions", action_for("go ruins"))
        expect(travel_response.code).to eq "200"
        expect(JSON.parse(travel_response.body).dig("state", "scene")).to eq "ruins"
        move_response = request_json(port, Net::HTTP::Post, "/api/games/#{game_id}/actions", action_for("go right"))
        moved = JSON.parse(move_response.body)

        expect(move_response.code).to eq "200"
        expect(moved.fetch("events")).to include hash_including("type" => "movement", "text" => "You move right.")
        expect(moved.dig("state", "dungeon", "player_position")).to eq("x" => 4, "y" => 2)
      end

      with_server("TEXT_ADVENTURES_SAVE_DIR" => save_dir) do |port|
        state_response = request_json(port, Net::HTTP::Get, "/api/games/#{game_id}")

        expect(state_response.code).to eq "200"
        expect(JSON.parse(state_response.body).dig("state", "scene")).to eq "town"
      end
    end
  end

  it "serves health metadata for readiness checks" do
    with_server do |port|
      response = request_json(port, Net::HTTP::Get, "/api/health")

      expect(response.code).to eq "200"
      expect(JSON.parse(response.body)).to include(
        "status" => "ok",
        "sessions" => hash_including("active_sessions" => 0)
      )
    end
  end

  it "returns a controlled overload response when the connection limit is reached" do
    with_server("TEXT_ADVENTURES_MAX_CONNECTIONS" => "1") do |port|
      create_response = request_json(port, Net::HTTP::Post, "/api/games", seed: 0)
      game_id = JSON.parse(create_response.body).fetch("game_id")
      socket = open_websocket(port, game_id)

      response = request_json(port, Net::HTTP::Get, "/api/health")

      expect(response.code).to eq "503"
      expect(JSON.parse(response.body).dig("error", "code")).to eq "server_busy"
    ensure
      socket&.close
    end
  end

  it "executes structured actions over HTTP" do
    with_server do |port|
      create_response = request_json(port, Net::HTTP::Post, "/api/games", seed: 0)
      game_id = JSON.parse(create_response.body).fetch("game_id")

      action_response = request_json(
        port,
        Net::HTTP::Post,
        "/api/games/#{game_id}/actions",
        type: "travel",
        destination: "ruins"
      )

      expect(action_response.code).to eq "200"
      body = JSON.parse(action_response.body)
      expect(body.fetch("events")).to include hash_including("type" => "travel.changed_scene", "text" => "You go to Ruins.")
      expect(body.dig("state", "scene")).to eq "ruins"
    end
  end

  it "logs requests to stdout in nginx combined log style" do
    output = capture_server_output do |port|
      response = request_json(port, Net::HTTP::Post, "/api/games", seed: 0)
      expect(response.code).to eq "201"
    end

    expect(output).to match(%r{127\.0\.0\.1 - - \[[^\]]+\] "POST /api/games HTTP/1\.1" 201 \d+ "-" "[^"]*"})
  end

  def with_server(env = {})
    server = start_server(env)
    yield server.fetch(:port)
  ensure
    stop_server(server) if server
  end

  def capture_server_output(env = {})
    server = start_server(env)
    output = nil
    begin
      yield server.fetch(:port)
    ensure
      output = stop_server(server)
    end
    output
  end

  def start_server(env = {})
    port = available_port
    save_dir = env.fetch("TEXT_ADVENTURES_SAVE_DIR") { Dir.mktmpdir("text-adventures-server-saves") }
    cleanup_save_dir = !env.key?("TEXT_ADVENTURES_SAVE_DIR")
    stdin, stdout, stderr, wait_thread = Open3.popen3(
      {
        "TEXT_ADVENTURES_HOST" => "127.0.0.1",
        "TEXT_ADVENTURES_PORT" => port.to_s,
        "TEXT_ADVENTURES_SAVE_DIR" => save_dir
      }.merge(env),
      binary,
      "server"
    )
    stdin.close
    wait_for_server(port)

    { port: port, stdout: stdout, stderr: stderr, wait_thread: wait_thread, save_dir: save_dir, cleanup_save_dir: cleanup_save_dir }
  end

  def stop_server(server)
    wait_thread = server.fetch(:wait_thread)
    Process.kill("TERM", wait_thread.pid) if wait_thread&.alive?
    wait_thread&.value
    stdout = server.fetch(:stdout)
    stderr = server.fetch(:stderr)
    output = stdout.read.to_s
    stdout&.close
    stderr&.close
    FileUtils.remove_entry(server.fetch(:save_dir)) if server.fetch(:cleanup_save_dir)
    output
  end

  def available_port
    server = TCPServer.new("127.0.0.1", 0)
    server.addr[1]
  ensure
    server&.close
  end

  def wait_for_server(port)
    Timeout.timeout(5) do
      loop do
        response = Net::HTTP.start("127.0.0.1", port, open_timeout: 0.2, read_timeout: 0.2) do |http|
          http.get("/api/health")
        end
        break if response.code == "200"
      rescue Errno::ECONNREFUSED, Errno::EHOSTUNREACH, Net::OpenTimeout, Net::ReadTimeout
        sleep 0.05
      end
    end
  end

  def request_json(port, request_class, path, body = nil)
    uri = URI("http://127.0.0.1:#{port}#{path}")
    request = request_class.new(uri)
    if body
      request["Content-Type"] = "application/json"
      request.body = JSON.generate(body)
    end
    Net::HTTP.start(uri.hostname, uri.port) { |http| http.request(request) }
  end

  def open_websocket(port, game_id)
    socket = TCPSocket.new("127.0.0.1", port)
    key = ["test-websocket-key"].pack("m0")
    socket.write <<~REQUEST.gsub("\n", "\r\n")
      GET /ws?game_id=#{game_id} HTTP/1.1
      Host: 127.0.0.1:#{port}
      Upgrade: websocket
      Connection: Upgrade
      Sec-WebSocket-Key: #{key}
      Sec-WebSocket-Version: 13

    REQUEST
    read_http_headers(socket)
    socket
  end

  def read_http_headers(socket)
    lines = []
    while (line = socket.gets)
      line = line.chomp
      break if line.empty?

      lines << line
    end
    lines
  end

  def action_for(command)
    verb, target = command.split(" ", 2)
    return { type: "move", direction: target } if verb == "go" && %w[up right down left].include?(target)
    return { type: "travel", destination: target } if verb == "go"

    { type: verb }
  end
end
