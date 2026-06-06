require_relative "merchant"

module TextAdventures
  module Scenes
    class Blacksmith < Merchant
      def initialize
        super(
          name: :blacksmith,
          display_name: "Blacksmith",
          stock: [
            Item.weapon("Sword", price: 15, attack: 10),
            Item.weapon("Bastard Sword", price: 30, attack: 25),
            Item.weapon("Spear", price: 50, attack: 22, defense: 5),
            Item.weapon("King's Nep Sword", price: 500, attack: 50)
          ],
          accepted_types: [:weapon]
        )
      end
    end
  end
end
