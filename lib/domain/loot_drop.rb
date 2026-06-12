module TextAdventures
  class LootDrop
    include Enumerable

    attr_reader :items, :gold

    def self.empty
      new
    end

    def self.coerce(value)
      return value if value.is_a?(self)
      return empty if value.nil?

      new(items: Array(value))
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
      if other.is_a?(Array)
        gold.zero? && items == other
      elsif other.is_a?(self.class)
        gold == other.gold && items == other.items
      else
        false
      end
    end
  end
end
