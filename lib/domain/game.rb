module TextAdventures
  class Game
    HistoryEntry = Struct.new(:command, :response, keyword_init: true)

    class TownScene
      def name
        :town
      end

      def handle(_game, command)
        if command.verb == :look
          return Response.new(
            "Welcome to Text Adventures",
            "",
            "You are now on the town of Nee'Peh."
          )
        end

        Response.new("You are in town.")
      end
    end

    attr_reader :player, :current_scene, :history, :random
    attr_accessor :pending_confirmation, :dungeon, :battle

    def initialize(
      player: Character.new,
      current_scene: TownScene.new,
      pending_confirmation: nil,
      dungeon: nil,
      battle: nil,
      history: [],
      random: Random.new
    )
      @player = player
      @current_scene = current_scene
      @pending_confirmation = pending_confirmation
      @dungeon = dungeon
      @battle = battle
      @history = history
      @random = random
    end

    def current_scene_name
      current_scene.name
    end

    def handle(command_text)
      command = CommandParser.parse(command_text)
      response = Response.render(command.unknown? ? command.message : current_scene.handle(self, command))
      record_history(command_text, response)
      response
    end

    private

    def record_history(command_text, response)
      history << HistoryEntry.new(command: command_text, response: response)
    end
  end
end
