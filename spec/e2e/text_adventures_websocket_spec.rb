require 'base64'
require 'json'
require 'net/http'
require 'open3'
require 'securerandom'
require 'socket'
require 'spec_helper'
require 'timeout'
require 'tmpdir'

RSpec.describe "text_adventures WebSocket server" do
  let(:root) { File.expand_path("../..", __dir__) }
  let(:binary) { File.join(root, "bin", "text_adventures") }

  it "streams action results as event messages" do
    with_server do |port|
      create_response = request_json(port, Net::HTTP::Post, "/api/games", seed: 0)
      game_id = JSON.parse(create_response.body).fetch("game_id")

      socket = open_websocket(port, game_id)
      initial = read_json_frame(socket)
      expect(initial).to include("type" => "state", "game_id" => game_id)
      expect(initial.dig("state", "scene")).to eq "town"

      write_json_frame(socket, type: "action", action: "travel", destination: "ruins")
      update = read_json_frame(socket)

      expect(update).to include("type" => "events", "game_id" => game_id)
      expect(update.fetch("events")).to include(
        hash_including("type" => "travel.changed_scene", "text" => "You go to Ruins.")
      )
      expect(update).not_to have_key("response")
      expect(update).not_to have_key("state")
      expect(update.dig("patch", "scene")).to eq "ruins"
      expect(update.dig("patch", "dungeon", "viewport", "entities")).to include(
        hash_including("type" => "player")
      )
    ensure
      socket&.close
    end
  end

  it "responds to application heartbeat pings without changing game state" do
    with_server do |port|
      create_response = request_json(port, Net::HTTP::Post, "/api/games", seed: 0)
      game_id = JSON.parse(create_response.body).fetch("game_id")

      socket = open_websocket(port, game_id)
      read_json_frame(socket)

      write_json_frame(socket, type: "ping")
      pong = read_json_frame(socket)

      expect(pong).to eq("type" => "pong", "game_id" => game_id)

      state_response = request_json(port, Net::HTTP::Get, "/api/games/#{game_id}")
      expect(JSON.parse(state_response.body).dig("state", "scene")).to eq "town"
    ensure
      socket&.close
    end
  end

  it "continues serving HTTP requests while a WebSocket remains open" do
    with_server do |port|
      create_response = request_json(port, Net::HTTP::Post, "/api/games", seed: 0)
      game_id = JSON.parse(create_response.body).fetch("game_id")

      socket = open_websocket(port, game_id)
      read_json_frame(socket)

      response = nil
      Timeout.timeout(1) do
        response = request_json(port, Net::HTTP::Get, "/api/games/#{game_id}")
      end

      expect(response.code).to eq "200"
      expect(JSON.parse(response.body).dig("state", "scene")).to eq "town"
    ensure
      socket&.close
    end
  end

  it "isolates forty simultaneous players across WebSocket actions and HTTP reads" do
    with_server do |port|
      ids = 40.times.map do |index|
        response = request_json(port, Net::HTTP::Post, "/api/games", seed: index)
        expect(response.code).to eq "201"
        JSON.parse(response.body).fetch("game_id")
      end
      sockets = ids.map { |id| open_websocket(port, id) }
      sockets.each_with_index do |socket, index|
        expect(read_json_frame(socket).fetch("game_id")).to eq ids[index]
      end

      ready = Queue.new
      start = Queue.new
      workers = sockets.each_with_index.map do |socket, index|
        Thread.new do
          ready << true
          start.pop
          actions = [{ type: "travel", destination: "tavern" }]
          (index % 5).times { actions << { type: "trade", sell: ["potion of heal"] } }
          actions.concat(Array.new(10) { { type: "look" } })
          actions.each do |action|
            write_json_frame(socket, action)
            response = read_json_frame(socket)
            expect(response).to include("type" => "events", "game_id" => ids[index])
          end
        end
      end
      Timeout.timeout(10) { sockets.length.times { ready.pop } }
      sockets.length.times { start << true }
      5.times { expect(request_json(port, Net::HTTP::Get, "/api/health").code).to eq "200" }
      Timeout.timeout(30) { workers.each(&:value) }

      ids.each_with_index do |id, index|
        response = request_json(port, Net::HTTP::Get, "/api/games/#{id}")
        expect(response.code).to eq "200"
        player = JSON.parse(response.body).dig("state", "player")
        expect(player.fetch("gold")).to eq index % 5
        expect(player.fetch("inventory").first.fetch("quantity")).to eq 5 - index % 5
      end
    ensure
      sockets&.each(&:close)
      workers&.each { |worker| worker.join(2) }
    end
  end

  it "serializes HTTP and WebSocket trades against the same game without lost updates" do
    with_server do |port|
      id = JSON.parse(request_json(port, Net::HTTP::Post, "/api/games", seed: 0).body).fetch("game_id")
      request_json(port, Net::HTTP::Post, "/api/games/#{id}/actions", type: "travel", destination: "tavern")
      sockets = 3.times.map { open_websocket(port, id) }
      sockets.each { |socket| read_json_frame(socket) }
      start = Queue.new
      action = { type: "trade", sell: ["potion of heal"] }
      workers = sockets.map do |socket|
        Thread.new do
          start.pop
          write_json_frame(socket, action)
          read_json_frame(socket)
        end
      end
      3.times do
        workers << Thread.new do
          start.pop
          JSON.parse(request_json(port, Net::HTTP::Post, "/api/games/#{id}/actions", action).body)
        end
      end
      workers.length.times { start << true }
      responses = Timeout.timeout(10) { workers.map(&:value) }
      successful = responses.count { |response| response.fetch("events").any? { |event| event["text"] == "Trade completed." } }
      expect(successful).to eq 5
      final = JSON.parse(request_json(port, Net::HTTP::Get, "/api/games/#{id}").body)
      expect(final.dig("state", "player", "gold")).to eq 5
      expect(final.dig("state", "player", "inventory")).to be_empty
    ensure
      sockets&.each(&:close)
      workers&.each { |worker| worker.join(2) }
    end
  end

  def with_server
    server = start_server
    yield server.fetch(:port)
  ensure
    stop_server(server) if server
  end

  def start_server
    port = available_port
    save_dir = Dir.mktmpdir("text-adventures-websocket")
    stdin, stdout, stderr, wait_thread = Open3.popen3(
      {
        "TEXT_ADVENTURES_HOST" => "127.0.0.1",
        "TEXT_ADVENTURES_PORT" => port.to_s,
        "TEXT_ADVENTURES_SAVE_DIR" => save_dir
      },
      binary
    )
    stdin.close
    # Drain logs while the load test runs so a full pipe cannot block the server.
    readers = [stdout, stderr].map { |stream| Thread.new { stream.read } }
    wait_for_server(port)

    { port: port, stdout: stdout, stderr: stderr, wait_thread: wait_thread, readers: readers, save_dir: save_dir }
  end

  def stop_server(server)
    wait_thread = server.fetch(:wait_thread)
    Process.kill("TERM", wait_thread.pid) if wait_thread&.alive?
    wait_thread&.value
    server.fetch(:readers).each(&:value)
    server.fetch(:stdout)&.close
    server.fetch(:stderr)&.close
    FileUtils.remove_entry(server.fetch(:save_dir))
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
    Net::HTTP.start(uri.hostname, uri.port, open_timeout: 5, read_timeout: 10) { |http| http.request(request) }
  end

  def open_websocket(port, game_id)
    socket = TCPSocket.new("127.0.0.1", port)
    key = Base64.strict_encode64(SecureRandom.random_bytes(16))
    socket.write <<~REQUEST.gsub("\n", "\r\n")
      GET /ws?game_id=#{game_id} HTTP/1.1
      Host: 127.0.0.1:#{port}
      Upgrade: websocket
      Connection: Upgrade
      Sec-WebSocket-Key: #{key}
      Sec-WebSocket-Version: 13

    REQUEST
    response = read_http_headers(socket)
    expect(response.first).to include "101 Switching Protocols"
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

  def write_json_frame(socket, payload)
    bytes = JSON.generate(payload).b
    mask = SecureRandom.random_bytes(4).bytes
    header = [0x81]
    if bytes.bytesize < 126
      header << (0x80 | bytes.bytesize)
    else
      header << (0x80 | 126)
      header.concat([bytes.bytesize].pack("n").bytes)
    end
    masked = bytes.bytes.each_with_index.map { |byte, index| byte ^ mask[index % 4] }
    socket.write(header.pack("C*"))
    socket.write(mask.pack("C*"))
    socket.write(masked.pack("C*"))
  end

  def read_json_frame(socket)
    Timeout.timeout(10) { read_frame_payload(socket) }
  end

  def read_frame_payload(socket)
    first, second = socket.read(2).bytes
    length = second & 0x7f
    length = socket.read(2).unpack1("n") if length == 126
    length = socket.read(8).unpack1("Q>") if length == 127
    payload = socket.read(length)
    JSON.parse(payload)
  end
end
