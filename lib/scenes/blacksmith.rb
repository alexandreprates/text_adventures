require_relative "merchant"

module TextAdventures
  module Scenes
    class Blacksmith < Merchant
      def initialize
        super(**ContentCatalog.shop("blacksmith"))
      end
    end
  end
end
