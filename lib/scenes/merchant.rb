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
        case command.verb
        when :show
          show_stock
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
          " sell <item> - sell item"
        )
      end

      private

      def show_stock
        return Response.new("There is nothing for sale.") if stock.empty?

        Response.new(["Here, take a look at these goods!"] + stock.map { |item| " #{item_line(item)}" })
      end

      def request_buy(game, query)
        item = find_stock(query)
        return Response.new("I do not have #{query} for sale.") unless item
        return Response.new("Sorry but you dont have enough money for this.") if game.player.gold < item.price

        game.pending_confirmation = Confirmation.new(
          merchant: self,
          action: :buy,
          item: item,
          price: item.price
        )
        Response.new(
          "Excellent choice its yours for mere #{item.price}g.",
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
          "Well i can give you #{price}g for this #{item.display_name}.",
          "That you want:",
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
          "[1x #{confirmation.item.display_name} removed to inventory]",
          "[your gold is now #{game.player.gold}]"
        )
      end

      def cancel(game)
        return Response.new("There is nothing to cancel.") unless game.pending_confirmation&.merchant.equal?(self)

        game.pending_confirmation = nil
        Response.new("Maybe another time.")
      end

      def find_stock(query)
        stock.find { |item| item.matches?(query) }
      end

      def accepts?(item)
        accepted_types.include?(item.type)
      end

      def sell_price(item)
        (item.price * 2 / 3.0).round
      end

      def item_line(item)
        details = []
        details << "Atk: #{item.attack}" if item.attack.positive?
        details << "Def: #{item.defense}" if item.defense.positive?
        suffix = details.empty? ? "" : " (#{details.join(', ')})"

        "1x #{item.display_name}#{suffix} - #{item.price}g"
      end
    end
  end
end
