module TextAdventures
  class Game
    HistoryEntry = Struct.new(:command, :response, keyword_init: true)

    attr_reader :player, :current_scene, :history, :random
    attr_accessor :pending_confirmation, :dungeon, :battle

    def initialize(
      player: Character.new,
      current_scene: Scenes::Town.new,
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

    def transition_to(scene)
      @current_scene = scene
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
