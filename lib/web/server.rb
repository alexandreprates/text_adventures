require "socket"
require "uri"

module TextAdventures
  module Web
    class Server
      DEFAULT_HOST = "127.0.0.1".freeze
      DEFAULT_PORT = 4567
      PUBLIC_ROOT = File.join(TextAdventures::ROOT, "public").freeze
      CACHEABLE_ASSET_PATH_PATTERN = %r{/(?:assets/[A-Za-z0-9._~!$&'()*+,;=:@%/-]+|styles\.css|app\.js|map_renderer\.js)}.freeze
      IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable".freeze
      REVALIDATE_CACHE_CONTROL = "no-cache".freeze
      MIME_TYPES = {
        ".css" => "text/css; charset=utf-8",
        ".html" => "text/html; charset=utf-8",
        ".js" => "text/javascript; charset=utf-8",
        ".json" => "application/json; charset=utf-8",
        ".md" => "text/markdown; charset=utf-8",
        ".png" => "image/png",
        ".svg" => "image/svg+xml; charset=utf-8"
      }.freeze
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
          asset_version: env.fetch("TEXT_ADVENTURES_ASSET_VERSION", "")
        )
      end

      def initialize(host: DEFAULT_HOST, port: DEFAULT_PORT, router: Router.new, output: $stdout, asset_version: "")
        @host = host
        @port = Integer(port)
        @router = router
        @output = output
        @asset_version = asset_version.to_s
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

      attr_reader :host, :port, :router, :output, :server, :asset_version

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
        request = nil
        response_status = nil
        response_body_bytes = 0

        request = read_request(socket)
        return unless request

        static_response = static_response_for(request)
        response = static_response || router_response_for(request)
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

      def static_response_for(request)
        return nil unless request.fetch(:method) == "GET"

        path = request.fetch(:path)
        static_path = static_file_path(path == "/" ? "/index.html" : path)
        return nil unless static_path

        body = static_body_for(static_path)
        {
          status: 200,
          headers: static_headers_for(static_path, request),
          body: body
        }
      end

      def static_file_path(path)
        relative_path = path.sub(%r{\A/+}, "")
        return nil if relative_path.empty? || relative_path.include?("..")

        full_path = File.expand_path(relative_path, PUBLIC_ROOT)
        return nil unless full_path.start_with?("#{PUBLIC_ROOT}/")
        return nil unless File.file?(full_path)

        full_path
      end

      def static_body_for(static_path)
        body = File.binread(static_path)
        return body unless versionable_static_asset?(static_path)

        version_asset_paths(body)
      end

      def static_headers_for(static_path, request)
        {
          "Content-Type" => MIME_TYPES.fetch(File.extname(static_path), "application/octet-stream"),
          "Cache-Control" => cache_control_for(static_path, request)
        }
      end

      def cache_control_for(static_path, request)
        return REVALIDATE_CACHE_CONTROL if File.extname(static_path) == ".html"
        return IMMUTABLE_CACHE_CONTROL if versioned_asset_request?(request)

        REVALIDATE_CACHE_CONTROL
      end

      def versionable_static_asset?(static_path)
        return false if asset_version.empty?

        [".html", ".js", ".json"].include?(File.extname(static_path))
      end

      def versioned_asset_request?(request)
        URI.decode_www_form(request.fetch(:query)).any? { |key, value| key == "v" && value == asset_version }
      rescue ArgumentError
        false
      end

      def version_asset_paths(body)
        body.gsub(CACHEABLE_ASSET_PATH_PATTERN) { |asset_path| versioned_asset_path(asset_path) }
      end

      def versioned_asset_path(asset_path)
        "#{asset_path}?v=#{URI.encode_www_form_component(asset_version)}"
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
      end
    end
  end
end
