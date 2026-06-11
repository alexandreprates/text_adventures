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

  it "serves the browser frontend assets" do
    with_server do |port|
      index_response = request_json(port, Net::HTTP::Get, "/")
      expect(index_response.code).to eq "200"
      expect(index_response["Content-Type"]).to include "text/html"
      expect(index_response.body).to include '<main class="game-layout">'
      expect(index_response.body).to include '<script src="/app.js"></script>'

      styles_response = request_json(port, Net::HTTP::Get, "/styles.css")
      expect(styles_response.code).to eq "200"
      expect(styles_response["Content-Type"]).to include "text/css"
      expect(styles_response.body).to include ".game-layout"

      app_response = request_json(port, Net::HTTP::Get, "/app.js")
      expect(app_response.code).to eq "200"
      expect(app_response["Content-Type"]).to include "text/javascript"
      expect(app_response.body).to include 'fetch("/games"'

      enemies_response = request_json(port, Net::HTTP::Get, "/assets/enemies/enemies.json")
      expect(enemies_response.code).to eq "200"
      expect(enemies_response["Content-Type"]).to include "application/json"
      expect(JSON.parse(enemies_response.body)).to include "giant_spider"

      location_image_response = request_json(port, Net::HTTP::Get, "/assets/locations/village-hub.png")
      expect(location_image_response.code).to eq "200"
      expect(location_image_response["Content-Type"]).to include "image/png"

      source_image_response = request_json(port, Net::HTTP::Get, "/assets/enemies/sources/crystal_golem.svg")
      expect(source_image_response.code).to eq "200"
      expect(source_image_response["Content-Type"]).to include "image/svg+xml"

      readme_response = request_json(port, Net::HTTP::Get, "/assets/enemies/README.md")
      expect(readme_response.code).to eq "200"
      expect(readme_response["Content-Type"]).to include "text/markdown"
    end
  end

  def with_server
    port = available_port
    stdin, stdout, stderr, wait_thread = Open3.popen3(
      {
        "TEXT_ADVENTURES_HOST" => "127.0.0.1",
        "TEXT_ADVENTURES_PORT" => port.to_s
      },
      binary,
      "server"
    )
    stdin.close
    wait_for_server(port)
    yield port
  ensure
    Process.kill("TERM", wait_thread.pid) if wait_thread&.alive?
    wait_thread&.value
    stdout&.close
    stderr&.close
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
