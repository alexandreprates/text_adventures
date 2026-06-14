module TextAdventures
  class LootDrop
    include Enumerable

    attr_reader :items, :gold

    def self.empty
      new
    end

    def initialize(items: [], gold: 0)
      @items = Array(items).freeze
      @gold = Integer(gold)
    end

    def each(&block)
      items.each(&block)
    end

    def first
      items.first
    end

    def empty?
      items.empty? && gold.zero?
    end

    def ==(other)
      other.is_a?(self.class) && gold == other.gold && items == other.items
    end
  end
end
