module TextAdventures
  module Scenes
    class StaticLocation
      attr_reader :name, :display_name

      def initialize(name:, display_name:)
        @name = name
        @display_name = display_name
      end

      def handle(_game, _command)
        Response.new("You are now at #{display_name}.")
      end
    end
  end
end
