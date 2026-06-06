module TextAdventures
  class Inventory
    Entry = Struct.new(:item, :quantity, keyword_init: true)
    Result = Struct.new(:success?, :item, :quantity, :message, keyword_init: true)

    def initialize(items = [])
      @entries = {}
      items.each { |item| add(item) }
    end

    def add(item, quantity: 1)
      key = item.command_name
      entry = entries[key] || Entry.new(item: item, quantity: 0)
      entry.quantity += quantity
      entries[key] = entry
      entry
    end

    def remove(query, quantity: 1)
      entry = find_entry(query)
      return missing_result(query) unless entry

      removed_quantity = [quantity, entry.quantity].min
      entry.quantity -= removed_quantity
      entries.delete(entry.item.command_name) if entry.quantity.zero?

      Result.new(
        success?: true,
        item: entry.item,
        quantity: removed_quantity,
        message: "Removed #{removed_quantity}x #{entry.item.display_name}."
      )
    end

    def find(query)
      find_entry(query)&.item
    end

    def quantity(query)
      find_entry(query)&.quantity || 0
    end

    def empty?
      entries.empty?
    end

    def entries_list
      entries.values.sort_by { |entry| entry.item.display_name }
    end

    def render
      return "Currently you have nothing." if empty?

      lines = ["Currently you have:"]
      entries_list.each do |entry|
        lines << " #{entry.quantity}x #{entry.item.display_name}#{details_for(entry.item)}"
      end
      lines.join("\n")
    end

    private

    attr_reader :entries

    def find_entry(query)
      entries[Item.normalize_name(query)]
    end

    def missing_result(query)
      Result.new(
        success?: false,
        item: nil,
        quantity: 0,
        message: "Item not found: #{query}."
      )
    end

    def details_for(item)
      details = []
      details << "Atk: #{item.attack}" if item.attack.positive?
      details << "Def: #{item.defense}" if item.defense.positive?
      details << "Recovery #{item.recovery} Health" if item.recovery.positive?
      return "" if details.empty?

      " (#{details.join(', ')})"
    end
  end
end
