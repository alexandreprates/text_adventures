require "json"

module TextAdventures
  module Web
    class Router
      def initialize(store: GameStore.new, serializer: GameSerializer)
        @store = store
        @serializer = serializer
      end

      def call(method:, path:, body: nil)
        route(method.to_s.upcase, path.to_s, body.to_s)
      rescue JSON::ParserError
        JsonResponse.error("invalid_json", "Request body must be valid JSON.", status: 400)
      rescue ArgumentError => error
        JsonResponse.error("invalid_request", error.message, status: 400)
      end

      private

      attr_reader :store, :serializer

      def route(method, path, body)
        path = api_path(path)
        return create_game(body) if method == "POST" && path == "/games"
        return method_not_allowed if path == "/games"

        if path.match?(%r{\A/games/[^/]+\z})
          game_id = path.split("/").last
          return game_state(game_id) if method == "GET"
          return delete_game(game_id) if method == "DELETE"

          return method_not_allowed
        end

        if path.match?(%r{\A/games/[^/]+/commands\z})
          game_id = path.split("/")[2]
          return execute_command(game_id, body) if method == "POST"

          return method_not_allowed
        end

        if path.match?(%r{\A/games/[^/]+/actions\z})
          game_id = path.split("/")[2]
          return execute_action(game_id, body) if method == "POST"

          return method_not_allowed
        end

        JsonResponse.error("not_found", "Route not found.", status: 404)
      end

      def api_path(path)
        return "" if path == "/api"
        return path.delete_prefix("/api") if path.start_with?("/api/")

        path
      end

      def create_game(body)
        payload = parse_optional_json(body)
        id, game = store.create(seed: payload["seed"])
        response = game.handle("look")

        JsonResponse.success(game_payload(id, game, response: response), status: 201)
      end

      def game_state(id)
        game = find_game(id)
        return game_not_found unless game

        JsonResponse.success(game_payload(id, game))
      end

      def execute_command(id, body)
        game = find_game(id)
        return game_not_found unless game

        payload = parse_required_json(body)
        command = payload["command"].to_s
        return JsonResponse.error("missing_command", "Request body must include command.", status: 400) if command.strip.empty?

        response = game.handle(command)
        JsonResponse.success(game_payload(id, game, response: response))
      end

      def execute_action(id, body)
        game = find_game(id)
        return game_not_found unless game

        payload = parse_required_json(body)
        command = ActionCommand.call(payload)
        response = game.handle(command)
        JsonResponse.success(game_payload(id, game, response: response))
      end

      def delete_game(id)
        return JsonResponse.no_content if store.delete(id)

        game_not_found
      end

      def game_payload(id, game, response: nil)
        payload = {
          game_id: id,
          state: serializer.new(game).to_h
        }
        payload[:response] = response_payload(response) if response
        payload
      end

      def response_payload(response)
        text = response.to_s
        {
          text: text,
          lines: text.lines.map(&:chomp)
        }
      end

      def find_game(id)
        store.fetch(id)
      end

      def parse_optional_json(body)
        return {} if body.to_s.strip.empty?

        parse_required_json(body)
      end

      def parse_required_json(body)
        payload = JSON.parse(body)
        raise ArgumentError, "Request body must be a JSON object." unless payload.is_a?(Hash)

        payload
      end

      def game_not_found
        JsonResponse.error("not_found", "Game not found.", status: 404)
      end

      def method_not_allowed
        JsonResponse.error("method_not_allowed", "Method not allowed.", status: 405)
      end
    end
  end
end
