require "base64"
require "digest/sha1"
require "json"
require "uri"

module TextAdventures
  module Web
    class WebSocketConnection
      GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11".freeze
      OPCODE_TEXT = 0x1
      OPCODE_CLOSE = 0x8
      OPCODE_PING = 0x9
      OPCODE_PONG = 0xA

      def initialize(store:, serializer: GameSerializer)
        @store = store
        @serializer = serializer
      end

      def handle(socket, request)
        write_handshake(socket, request)
        game = game_for(request)
        unless game
          write_json(socket, type: "error", error: { code: "not_found", message: "Game not found." })
          return
        end

        game_id = game_id_for(request)
        write_json(socket, type: "state", game_id: game_id, state: serializer.new(game).to_h)

        while (frame = read_frame(socket))
          case frame.fetch(:opcode)
          when OPCODE_TEXT
            handle_message(socket, game_id, game, frame.fetch(:payload))
          when OPCODE_PING
            write_frame(socket, frame.fetch(:payload), opcode: OPCODE_PONG)
          when OPCODE_CLOSE
            write_frame(socket, "", opcode: OPCODE_CLOSE)
            break
          end
        end
      end

      private

      attr_reader :store, :serializer

      def write_handshake(socket, request)
        key = request.fetch(:headers).fetch("sec-websocket-key")
        accept = Base64.strict_encode64(Digest::SHA1.digest("#{key}#{GUID}"))
        socket.write "HTTP/1.1 101 Switching Protocols\r\n"
        socket.write "Upgrade: websocket\r\n"
        socket.write "Connection: Upgrade\r\n"
        socket.write "Sec-WebSocket-Accept: #{accept}\r\n"
        socket.write "\r\n"
      end

      def game_for(request)
        game_id = game_id_for(request)
        return nil if game_id.empty?

        store.fetch(game_id)
      end

      def game_id_for(request)
        query = URI.decode_www_form(request.fetch(:query)).to_h
        query.fetch("game_id", "").to_s
      rescue ArgumentError
        ""
      end

      def handle_message(socket, game_id, game, payload)
        message = JSON.parse(payload)
        command = command_for(message)
        response = game.handle(command)
        write_json(
          socket,
          type: "events",
          game_id: game_id,
          events: ResponseEvents.call(response),
          state: serializer.new(game).to_h
        )
      rescue JSON::ParserError
        write_json(socket, type: "error", error: { code: "invalid_json", message: "Message must be valid JSON." })
      rescue ArgumentError => error
        write_json(socket, type: "error", error: { code: "invalid_action", message: error.message })
      end

      def command_for(message)
        type = message.fetch("type", "").to_s
        if type == "action"
          action = message.fetch("action", "").to_s
          return ActionCommand.call(message.merge("type" => action))
        end

        ActionCommand.call(message)
      end

      def write_json(socket, payload)
        write_frame(socket, JSON.generate(payload), opcode: OPCODE_TEXT)
      end

      def read_frame(socket)
        header = socket.read(2)
        return nil unless header&.bytesize == 2

        first, second = header.bytes
        opcode = first & 0x0f
        masked = (second & 0x80) != 0
        length = second & 0x7f
        length = socket.read(2).unpack1("n") if length == 126
        length = socket.read(8).unpack1("Q>") if length == 127
        mask = masked ? socket.read(4).bytes : []
        payload = socket.read(length).to_s.bytes
        payload = payload.each_with_index.map { |byte, index| byte ^ mask[index % 4] } if masked

        {
          opcode: opcode,
          payload: payload.pack("C*")
        }
      end

      def write_frame(socket, payload, opcode:)
        bytes = payload.to_s.b
        socket.write [0x80 | opcode].pack("C")
        if bytes.bytesize < 126
          socket.write [bytes.bytesize].pack("C")
        elsif bytes.bytesize < 65_536
          socket.write [126, bytes.bytesize].pack("Cn")
        else
          socket.write [127, bytes.bytesize].pack("CQ>")
        end
        socket.write bytes
      end
    end
  end
end
