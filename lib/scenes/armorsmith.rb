require_relative "merchant"

module TextAdventures
  module Scenes
    class Armorsmith < Merchant
      def initialize
        super(
          name: :armorsmith,
          display_name: "Armorsmith",
          stock: [
            Item.armor("Leather Armor", price: 20, defense: 20)
          ],
          accepted_types: [:armor]
        )
      end
    end
  end
end
