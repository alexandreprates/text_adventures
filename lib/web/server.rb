require "socket"
require "uri"

module TextAdventures
  module Web
    class Server
      DEFAULT_HOST = "127.0.0.1".freeze
      DEFAULT_PORT = 4567
      REASON_PHRASES = {
        200 => "OK",
        201 => "Created",
        204 => "No Content",
        400 => "Bad Request",
        404 => "Not Found",
        405 => "Method Not Allowed",
        500 => "Internal Server Error"
      }.freeze

      def self.from_env(env = ENV)
        store = GameStore.new(default_seed: env["TEXT_ADVENTURES_RANDOM_SEED"])
        new(
          host: env.fetch("TEXT_ADVENTURES_HOST", DEFAULT_HOST),
          port: Integer(env.fetch("TEXT_ADVENTURES_PORT", DEFAULT_PORT)),
          router: Router.new(store: store)
        )
      end

      def initialize(host: DEFAULT_HOST, port: DEFAULT_PORT, router: Router.new, output: $stdout)
        @host = host
        @port = Integer(port)
        @router = router
        @output = output
        @running = true
        @server = nil
      end

      def start
        @server = TCPServer.new(host, port)
        trap_signals
        output.puts "Text Adventures JSON server listening on http://#{host}:#{port}"
        accept_loop
      ensure
        @server&.close unless @server&.closed?
      end

      private

      attr_reader :host, :port, :router, :output, :server

      def accept_loop
        while @running
          begin
            socket = server.accept
            handle_socket(socket)
          rescue IOError, Errno::EBADF
            break unless @running
          end
        end
      end

      def handle_socket(socket)
        request = read_request(socket)
        return unless request

        response = router.call(
          method: request.fetch(:method),
          path: request.fetch(:path),
          body: request.fetch(:body)
        )
        write_response(socket, response)
      rescue StandardError => error
        write_response(
          socket,
          JsonResponse.error("internal_server_error", error.message, status: 500)
        )
      ensure
        socket.close unless socket.closed?
      end

      def read_request(socket)
        request_line = socket.gets.to_s
        return nil if request_line.strip.empty?

        method, raw_path = request_line.split
        headers = read_headers(socket)
        body = socket.read(headers.fetch("content-length", "0").to_i).to_s

        {
          method: method,
          path: URI.parse(raw_path.to_s).path,
          body: body
        }
      end

      def read_headers(socket)
        headers = {}
        while (line = socket.gets)
          line = line.chomp
          break if line.empty?

          key, value = line.split(":", 2)
          headers[key.downcase] = value.to_s.strip if key
        end
        headers
      end

      def write_response(socket, response)
        body = response.json
        socket.write "HTTP/1.1 #{response.status} #{reason_phrase(response.status)}\r\n"
        response.headers.each { |key, value| socket.write "#{key}: #{value}\r\n" }
        socket.write "Content-Length: #{body.bytesize}\r\n"
        socket.write "Connection: close\r\n"
        socket.write "\r\n"
        socket.write body
      end

      def reason_phrase(status)
        REASON_PHRASES.fetch(status, "OK")
      end

      def trap_signals
        ["INT", "TERM"].each do |signal|
          Signal.trap(signal) { shutdown }
        rescue ArgumentError
          next
        end
      end

      def shutdown
        @running = false
        server&.close unless server&.closed?
      end
    end
  end
end
