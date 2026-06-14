require 'json'
require 'net/http'
require 'open3'
require 'socket'
require 'spec_helper'
require 'timeout'

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
      expect(created.dig("response", "lines")).to include "Welcome to Text Adventures"

      command_response = request_json(port, Net::HTTP::Post, "/games/#{game_id}/commands", command: "go ruins")
      expect(command_response.code).to eq "200"
      command_body = JSON.parse(command_response.body)
      expect(command_body.dig("response", "lines")).to include "You go to Ruins."
      expect(command_body.dig("state", "scene")).to eq "ruins"
      expect(command_body.dig("state", "dungeon", "map")).to be_an Array

      state_response = request_json(port, Net::HTTP::Get, "/games/#{game_id}")
      expect(state_response.code).to eq "200"
      expect(JSON.parse(state_response.body).dig("state", "prompt")).to eq "Ruins L1"

      delete_response = request_json(port, Net::HTTP::Delete, "/games/#{game_id}")
      expect(delete_response.code).to eq "204"
      expect(delete_response.body.to_s).to eq ""
    end
  end

  it "descends to the next dungeon level over HTTP commands" do
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
        "go right"
      ].each do |command|
        command_response = request_json(port, Net::HTTP::Post, "/games/#{game_id}/commands", command: command)
        expect(command_response.code).to eq "200"
        body = JSON.parse(command_response.body)
      end

      expect(body.dig("response", "lines")).to include "You descend deeper into the ruins."
      expect(body.dig("state", "prompt")).to eq "Ruins L2"
      expect(body.dig("state", "dungeon", "level")).to eq 2
      expect(body.dig("state", "dungeon", "entrance_portal")).to be_nil
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
      command_response = request_json(port, Net::HTTP::Post, "/api/games/#{game_id}/commands", command: "go ruins")
      expect(command_response.code).to eq "200"
      expect(JSON.parse(command_response.body).dig("state", "scene")).to eq "ruins"
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
    stdin, stdout, stderr, wait_thread = Open3.popen3(
      {
        "TEXT_ADVENTURES_HOST" => "127.0.0.1",
        "TEXT_ADVENTURES_PORT" => port.to_s
      }.merge(env),
      binary,
      "server"
    )
    stdin.close
    wait_for_server(port)

    { port: port, stdout: stdout, stderr: stderr, wait_thread: wait_thread }
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
        Net::HTTP.start("127.0.0.1", port, open_timeout: 0.2, read_timeout: 0.2) { true }
        break
      rescue Errno::ECONNREFUSED, Errno::EHOSTUNREACH
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
end
