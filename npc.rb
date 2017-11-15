module Talk
  class Response
    attr_reader :option, :message
    def initialize(option, message, &block)
      @option = option
      @message = message
      @block = block if block_given?
    end
    def call
      @block.call if @block
    end
  end

  module_function
  def talk(message, &block)
    p message
    if block_given?
      @responses = []
      responses = block.call
      p @responses.collect &:option
      option = gets.chomp.to_sym
      response = @responses.detect { |r| r.option == option }
      p response.message
      response.call
    end
  end

  def response(option, message, &block)
    @responses << Response.new(option, message, &block)
  end
end
include Talk

quest = {}

talk "Bom dia" do
  response :nao, 'so se for para voce' do
    talk 'Nossa acordou com a macaca hoje'
  end
  response :realmente, 'Sim esta um lindo dia hoje' do
    talk "Quer aproveitar para fazer uma quest?" do
      response :nao, "Nao estou afim disso"
      response :sim, "Claro que estou afim" do
        talk "Onde quer fazer a quest no castelo, na planice ou na caverna?" do
          response(:castelo, "no castelo") { quest[:castle] = :start }
          response(:planice, "no planice") { quest[:plains] = :start }
          response(:caverna, "no caverna") { quest[:cave] = :start }
        end
      end
    end
  end
end


# class John < NPC::Base

#   name 'John Smith'
#   grettings "Welcome, adventurer to buy or sell weapons here is the right place!"

#   has_store do
#     sell do
#       group :weapons
#       item :a, price: 10
#       item :b, price: 2, amount: 2
#       item :c, price: 100, if: 'quest_a_completed'
#       item :d, price: 1, unless: 'quest_b_completed'
#     end

#     buy do
#       group :weapons, :armors
#       item :a, price: 1
#     end
#   end

# end

#  _go blacksmith
# Welcome, adventurer to buy or sell weapons here is the right place!

# That you want:
#  show - view merchant goods
#  buy <item> - buy something
#  sell <item> - sell item

#  _sell sword
# Well i can give you 10g for this Sword (Atk: 10).

# That you want:
#  agree - sell item
#  no - keep item

#  _agree
# You sold Sword (Atk: 10) at 10g.
# [1x Sword (Atk: 10) removed to inventory]
# [your gold is now 120]

#  _sell leather armor
# Sorry bud, but I have no interest in this item.

#  _show
# Here bud, take a look at these incredible goods!
#  1x Sword (Atk: 10) - 15g
#  1x Bastard Sword (Atk: 25) - 30g
#  1x Spear (Atk: 22, Def: 5) - 50g
#  1x King's Nep Sword (Atk: 50) - 500g

#  _buy king nep's sword
# Sorry but you dont have enough money for this.

#  _buy spear
# Excellent choice its yours for mere 50g.

#  Select your answer:
#   agree - buy it
#   no - forget it

#  _agree
# You bought Spear (Atk: 22, Def: 5).
# [1x Spear (Atk: 22, Def: 5) added to inventory]
# [your gold is now 70]
