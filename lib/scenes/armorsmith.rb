require_relative "merchant"

module TextAdventures
  module Scenes
    class Armorsmith < Merchant
      def initialize
        super(**ContentCatalog.shop("armorsmith"))
      end
    end
  end
end
