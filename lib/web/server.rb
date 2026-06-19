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
          router: Router.new(store: store),
          web_socket: WebSocketConnection.new(store: store)
        )
      end

      def initialize(host: DEFAULT_HOST, port: DEFAULT_PORT, router: Router.new, web_socket: nil, output: $stdout)
        @host = host
        @port = Integer(port)
        @router = router
        @web_socket = web_socket
        @output = output
        @running = true
        @server = nil
        @connection_mutex = Mutex.new
        @connections = []
        @workers = []
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

      attr_reader :host, :port, :router, :web_socket, :output, :server

      def accept_loop
        while @running
          begin
            socket = server.accept
            spawn_worker(socket)
          rescue IOError, Errno::EBADF
            break unless @running
          end
        end
      ensure
        join_workers
      end

      def spawn_worker(socket)
        track_socket(socket)
        worker = Thread.new do
          Thread.current.report_on_exception = false
          handle_socket(socket)
        ensure
          untrack_socket(socket)
        end
        track_worker(worker)
      end

      def handle_socket(socket)
        request = nil
        response_status = nil
        response_body_bytes = 0

        request = read_request(socket)
        return unless request

        if web_socket_request?(request)
          response_status = 101
          web_socket.handle(socket, request)
          return
        end

        response = router_response_for(request)
        response_status = response.fetch(:status)
        response_body_bytes = response.fetch(:body).bytesize

        write_raw_response(socket, **response)
      rescue StandardError => error
        response = raw_response_for(JsonResponse.error("internal_server_error", error.message, status: 500))
        response_status = response.fetch(:status)
        response_body_bytes = response.fetch(:body).bytesize
        write_raw_response(socket, **response)
      ensure
        log_access(socket, request, response_status, response_body_bytes) if request && response_status
        socket.close unless socket.closed?
      end

      def track_socket(socket)
        connection_mutex.synchronize { connections << socket }
      end

      def untrack_socket(socket)
        connection_mutex.synchronize { connections.delete(socket) }
      end

      def track_worker(worker)
        connection_mutex.synchronize do
          workers.reject! { |thread| !thread.alive? }
          workers << worker
        end
      end

      def join_workers
        active_workers = connection_mutex.synchronize { workers.dup }
        active_workers.each(&:join)
      end

      def read_request(socket)
        request_line = socket.gets.to_s
        return nil if request_line.strip.empty?

        method, raw_path = request_line.split
        uri = URI.parse(raw_path.to_s)
        headers = read_headers(socket)
        body = socket.read(headers.fetch("content-length", "0").to_i).to_s

        {
          method: method,
          path: uri.path,
          query: uri.query.to_s,
          headers: headers,
          body: body,
          request_line: request_line.strip
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

      def write_raw_response(socket, status:, headers:, body:)
        socket.write "HTTP/1.1 #{status} #{reason_phrase(status)}\r\n"
        headers.each { |key, value| socket.write "#{key}: #{value}\r\n" }
        socket.write "Content-Length: #{body.bytesize}\r\n"
        socket.write "Connection: close\r\n"
        socket.write "\r\n"
        socket.write body
      end

      def router_response_for(request)
        raw_response_for(
          router.call(
            method: request.fetch(:method),
            path: request.fetch(:path),
            body: request.fetch(:body)
          )
        )
      end

      def web_socket_request?(request)
        return false unless web_socket
        return false unless request.fetch(:method) == "GET"
        return false unless request.fetch(:path) == "/ws"

        headers = request.fetch(:headers)
        headers.fetch("upgrade", "").downcase == "websocket" &&
          headers.fetch("connection", "").downcase.include?("upgrade") &&
          headers.key?("sec-websocket-key")
      end

      def raw_response_for(response)
        {
          status: response.status,
          headers: response.headers,
          body: response.json
        }
      end

      def log_access(socket, request, status, body_bytes)
        output.puts [
          remote_address(socket),
          "-",
          "-",
          "[#{Time.now.strftime('%d/%b/%Y:%H:%M:%S %z')}]",
          %("#{access_log_value(request.fetch(:request_line))}"),
          status,
          body_bytes,
          %("#{access_log_value(request.fetch(:headers).fetch('referer', '-'))}"),
          %("#{access_log_value(request.fetch(:headers).fetch('user-agent', '-'))}")
        ].join(" ")
        output.flush if output.respond_to?(:flush)
      end

      def remote_address(socket)
        socket.peeraddr.fetch(3)
      rescue StandardError
        "-"
      end

      def access_log_value(value)
        value.to_s.empty? ? "-" : value.to_s.gsub(/["\\]/) { |character| "\\#{character}" }
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
        active_connections = connection_mutex.synchronize { connections.dup }
        active_connections.each do |connection|
          connection.close unless connection.closed?
        rescue IOError
          next
        end
      end

      attr_reader :connection_mutex, :connections, :workers
    end
  end
end
