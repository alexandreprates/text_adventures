require "yaml"

module TextAdventures
  class ContentCatalog
    DATA_DIRECTORY = File.join(ROOT, "data")

    def self.item(id)
      new.item(id)
    end

    def self.items(ids)
      new.items(ids)
    end

    def self.creature(id)
      new.creature(id)
    end

    def self.creature_ids
      new.creature_ids
    end

    def self.shop(id)
      new.shop(id)
    end

    def item(id)
      definition = fetch_definition(items_data.fetch("items"), id, "item")
      build_item(definition)
    end

    def items(ids)
      ids.map { |id| item(id) }
    end

    def creature(id)
      definition = fetch_definition(creatures_data.fetch("creatures"), id, "creature")
      Creature.new(
        name: definition.fetch("name"),
        health: definition.fetch("health"),
        defense: definition.fetch("defense", 0),
        xp_reward: definition.fetch("xp_reward", 0),
        attacks: build_attacks(definition.fetch("attacks", [])),
        loot_table: items(definition.fetch("loot", [])),
        status_effects: symbol_list(definition.fetch("status_effects", []))
      )
    end

    def creature_ids
      creatures_data.fetch("creatures").keys
    end

    def shop(id)
      definition = fetch_definition(shops_data.fetch("shops"), id, "shop")
      {
        name: definition.fetch("name").to_sym,
        display_name: definition.fetch("display_name"),
        stock: items(definition.fetch("stock", [])),
        accepted_types: symbol_list(definition.fetch("accepted_types", []))
      }
    end

    private

    def build_item(definition)
      name = definition.fetch("name")
      price = definition.fetch("price")

      case definition.fetch("type")
      when "weapon"
        Item.weapon(
          name,
          price: price,
          attack: definition.fetch("attack"),
          defense: definition.fetch("defense", 0),
          weapon_class: definition["weapon_class"]
        )
      when "armor"
        Item.armor(
          name,
          price: price,
          defense: definition.fetch("defense"),
          armor_class: definition["armor_class"]
        )
      when "potion"
        Item.potion(name, price: price, recovery: definition.fetch("recovery"))
      when "tome"
        Item.tome(name, price: price, spell: definition.fetch("spell"))
      else
        raise ArgumentError, "unknown item type: #{definition.fetch('type')}"
      end
    end

    def build_attacks(definitions)
      definitions.map do |definition|
        damage = definition.fetch("damage")
        Creature::Attack.new(
          name: definition.fetch("name"),
          damage_range: damage.fetch("min")..damage.fetch("max"),
          status: optional_symbol(definition["status"]),
          status_chance: definition["status_chance"]
        )
      end
    end

    def fetch_definition(collection, id, type)
      normalized_id = id.to_s
      collection.fetch(normalized_id) do
        raise ArgumentError, "unknown #{type}: #{normalized_id}"
      end
    end

    def symbol_list(values)
      values.map { |value| value.to_s.to_sym }
    end

    def optional_symbol(value)
      value && value.to_s.to_sym
    end

    def items_data
      @items_data ||= load_yaml("items.yml")
    end

    def shops_data
      @shops_data ||= load_yaml("shops.yml")
    end

    def creatures_data
      @creatures_data ||= load_yaml("creatures.yml")
    end

    def load_yaml(file_name)
      path = File.join(DATA_DIRECTORY, file_name)
      YAML.safe_load(File.read(path), aliases: false)
    end
  end
end
