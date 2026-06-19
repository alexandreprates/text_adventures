module TextAdventures
  module Scenes
    class Merchant
      Confirmation = Struct.new(:merchant, :action, :item, :price, keyword_init: true)

      attr_reader :name, :display_name, :stock, :accepted_types

      def initialize(name:, display_name:, stock:, accepted_types:)
        @name = name
        @display_name = display_name
        @stock = stock
        @accepted_types = accepted_types
      end

      def handle(game, command)
        return back_to_town(game) if command.verb == :go && Item.normalize_name(command.target) == "town"
        return route_to_town_destination(game, command.target) if command.verb == :go

        case command.verb
        when :show
          show_stock(game)
        when :buy
          request_buy(game, command.target)
        when :sell
          request_sell(game, command.target)
        when :agree
          confirm(game)
        when :no
          cancel(game)
        else
          describe
        end
      end

      def describe
        Response.new(
          "Welcome to #{display_name}.",
          "You can:",
          " show - view merchant goods",
          " buy <item> - buy something",
          " sell <item> - sell item",
          " go town - return to Nee'Peh"
        )
      end

      private

      def back_to_town(game)
        game.pending_confirmation = nil
        game.transition_to(Town.new)
        Response.new("You return to the town of Nee'Peh.")
      end

      def show_stock(game)
        available_stock = stock_available_to(game.player)
        return Response.new("There is nothing for sale.") if available_stock.empty?

        Response.new(["Here, take a look at these goods!"] + grouped_stock_lines(available_stock))
      end

      def request_buy(game, query)
        item = find_stock(game.player, query)
        return Response.new("I do not have #{query} for sale.") unless item
        return Response.new("Sorry, but you do not have enough money for this.") if game.player.gold < item.price

        game.pending_confirmation = Confirmation.new(
          merchant: self,
          action: :buy,
          item: item,
          price: item.price
        )
        Response.new(
          "Excellent choice. It is yours for #{item.price}g.",
          "Select your answer:",
          " agree - buy it",
          " no - forget it"
        )
      end

      def request_sell(game, query)
        item = game.player.inventory.find(query)
        return Response.new("You do not have #{query}.") unless item
        return Response.new("Sorry bud, but I have no interest in this item.") unless accepts?(item)

        price = sell_price(item)
        game.pending_confirmation = Confirmation.new(
          merchant: self,
          action: :sell,
          item: item,
          price: price
        )
        Response.new(
          "I can give you #{price}g for this #{item.display_name}.",
          "Select your answer:",
          " agree - sell item",
          " no - keep item"
        )
      end

      def confirm(game)
        confirmation = game.pending_confirmation
        return Response.new("There is nothing to confirm.") unless confirmation&.merchant.equal?(self)

        case confirmation.action
        when :buy
          confirm_buy(game, confirmation)
        when :sell
          confirm_sell(game, confirmation)
        end
      end

      def confirm_buy(game, confirmation)
        game.player.gold -= confirmation.price
        game.player.inventory.add(confirmation.item)
        game.pending_confirmation = nil
        Response.new(
          "You bought #{confirmation.item.display_name}.",
          "[1x #{confirmation.item.display_name} added to inventory]",
          "[your gold is now #{game.player.gold}]"
        )
      end

      def confirm_sell(game, confirmation)
        result = game.player.inventory.remove(confirmation.item.command_name)
        return Response.new(result.message) unless result.success?

        game.player.gold += confirmation.price
        game.pending_confirmation = nil
        Response.new(
          "You sold #{confirmation.item.display_name} at #{confirmation.price}g.",
          "[1x #{confirmation.item.display_name} removed from inventory]",
          "[your gold is now #{game.player.gold}]"
        )
      end

      def cancel(game)
        return Response.new("There is nothing to cancel.") unless game.pending_confirmation&.merchant.equal?(self)

        game.pending_confirmation = nil
        Response.new("Maybe another time.")
      end

      def find_stock(player, query)
        stock_available_to(player).find { |item| item.matches?(query) }
      end

      def stock_available_to(player)
        stock.select { |item| item.min_level <= player.overall_level }
      end

      def accepts?(item)
        accepted_types.include?(item.type)
      end

      def sell_price(item)
        (item.price * 2 / 3.0).round
      end

      def item_line(item)
        details = []
        details << armor_class_label(item) if item.armor? && item.armor_class
        details << "Atk: #{item.attack}" if item.attack.positive?
        details << "Def: #{item.defense}" if item.defense.positive?
        suffix = details.empty? ? "" : " (#{details.join(', ')})"

        "1x #{item.display_name}#{suffix} - #{item.price}g"
      end

      def grouped_stock_lines(items)
        items.each_with_object({}) do |item, groups|
          groups[group_label(item)] ||= []
          groups[group_label(item)] << item
        end.flat_map do |label, items|
          [" #{label}:"] + items.map { |item| "  #{item_line(item)}" }
        end
      end

      def group_label(item)
        return weapon_group_label(item.weapon_class) if item.weapon? && item.weapon_class
        return armor_group_label(item.armor_class) if item.armor? && item.armor_class

        "#{item.type.to_s.capitalize}s"
      end

      def weapon_group_label(weapon_class)
        {
          sword: "Swords",
          spear: "Spears and Polearms",
          dagger: "Daggers"
        }.fetch(weapon_class, "#{weapon_class.to_s.capitalize}s")
      end

      def armor_group_label(armor_class)
        "#{armor_class.to_s.capitalize} Armor"
      end

      def armor_class_label(item)
        item.armor_class.to_s.capitalize
      end

      def route_to_town_destination(game, target)
        game.pending_confirmation = nil
        Town.route(game, target)
      end
    end
  end
end
