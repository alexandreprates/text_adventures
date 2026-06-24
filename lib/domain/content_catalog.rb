require "yaml"

module TextAdventures
  class ContentCatalog
    DATA_DIRECTORY = File.join(ROOT, "data")
    LEVEL_CREATURE_POOLS = [
      {
        range: 1..2,
        ids: %w[
          giant_spider goblin_skirmisher goblin_hexer kobold_trapper
          kobold_sparkmage skeleton_guard skeleton_archer forest_sprite
          pixie_trickster
        ]
      },
      {
        range: 3..5,
        ids: %w[
          hobgoblin_soldier orc_raider gnoll_hunter gnoll_bonecaller
          ghoul_stalker shadow_imp brimstone_imp lizardfolk_scout
          harpy_screecher elemental_spark
        ]
      },
      {
        range: 6..8,
        ids: %w[
          orc_berserker wight_knight zombie_brute satyr_duelist
          dryad_thornweaver fae_blade_dancer dire_wolf naga_apprentice
          yuan_ti_cutthroat fire_elemental_ling ice_elemental_ling
          air_elemental_ling
        ]
      },
      {
        range: 9..999,
        ids: %w[
          lesser_demon owlbear_cub cave_troll hill_giant_youth
          minotaur_guardian ogre_marauder basilisk_hatchling
          griffin_fledgling manticore_whelp wyvern_juvenile
          dragon_wyrmling earth_elemental_ling dark_elf_assassin
          dark_elf_arcanist dwarven_ghost cursed_paladin enchanted_armor
          crystal_golem lich_acolyte
        ]
      }
    ].freeze

    def self.item(id)
      new.item(id)
    end

    def self.items(ids)
      new.items(ids)
    end

    def self.item_id_for(item)
      new.item_id_for(item)
    end

    def self.creature(id)
      new.creature(id)
    end

    def self.creature_ids
      new.creature_ids
    end

    def self.creature_id_for(creature)
      new.creature_id_for(creature)
    end

    def self.creature_ids_for_level(level)
      new.creature_ids_for_level(level)
    end

    def self.shop(id)
      new.shop(id)
    end

    def self.dungeon_block(id)
      new.dungeon_block(id)
    end

    def self.dungeon_blocks
      new.dungeon_blocks
    end

    def item(id)
      definition = fetch_definition(items_data.fetch("items"), id, "item")
      build_item(definition)
    end

    def items(ids)
      ids.map { |id| item(id) }
    end

    def item_id_for(item)
      item_id_by_command_name.fetch(item.command_name) do
        raise ArgumentError, "unknown item reference: #{item.display_name}"
      end
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
        loot_profile: build_loot_profile(definition),
        status_effects: symbol_list(definition.fetch("status_effects", []))
      )
    end

    def creature_ids
      creatures_data.fetch("creatures").keys
    end

    def creature_id_for(creature)
      creature_id_by_name.fetch(creature.name) do
        raise ArgumentError, "unknown creature reference: #{creature.display_name}"
      end
    end

    def creature_ids_for_level(level)
      normalized_level = [Integer(level), 1].max
      pool = LEVEL_CREATURE_POOLS.find { |entry| entry.fetch(:range).cover?(normalized_level) } ||
             LEVEL_CREATURE_POOLS.last

      pool.fetch(:ids)
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

    def dungeon_block(id)
      definition = fetch_definition(dungeon_blocks_data.fetch("dungeon_blocks"), id, "dungeon block")
      build_dungeon_block(id, definition)
    end

    def dungeon_blocks
      dungeon_blocks_data.fetch("dungeon_blocks").map do |id, definition|
        build_dungeon_block(id, definition)
      end
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
          weapon_class: definition["weapon_class"],
          min_level: definition.fetch("min_level", 1)
        )
      when "armor"
        Item.armor(
          name,
          price: price,
          defense: definition.fetch("defense"),
          armor_class: definition["armor_class"],
          min_level: definition.fetch("min_level", 1)
        )
      when "potion"
        Item.potion(
          name,
          price: price,
          recovery: definition.fetch("recovery"),
          cures: definition.fetch("cures", [])
        )
      when "tome"
        Item.tome(name, price: price, spell: definition.fetch("spell"))
      when "junk"
        Item.junk(name, price: price)
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

    def build_loot_profile(definition)
      common = definition["common_loot"]
      rare = definition["rare_loot"]
      gold = definition["gold"]
      return nil unless common || rare || gold

      rare_item_ids = rare&.fetch("items", nil) || definition.fetch("loot", [])
      Creature::LootProfile.new(
        common_chance: common&.fetch("chance", 0).to_f,
        common_items: items(common&.fetch("items", []) || []),
        rare_chance: rare&.fetch("chance", 0).to_f,
        rare_items: items(rare_item_ids),
        gold_range: build_gold_range(gold),
        gold_chance: gold&.fetch("chance", 0).to_f
      )
    end

    def build_gold_range(definition)
      return 0..0 unless definition

      definition.fetch("min").to_i..definition.fetch("max").to_i
    end

    def build_dungeon_block(id, definition)
      DungeonBlock.new(
        id: id,
        name: definition.fetch("name"),
        tiles: definition.fetch("tiles"),
        exits: definition.fetch("exits")
      )
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

    def dungeon_blocks_data
      @dungeon_blocks_data ||= load_yaml("dungeon_blocks.yml")
    end

    def load_yaml(file_name)
      path = File.join(DATA_DIRECTORY, file_name)
      YAML.safe_load(File.read(path), aliases: false)
    end

    def item_id_by_command_name
      @item_id_by_command_name ||= items_data.fetch("items").keys.to_h do |id|
        [item(id).command_name, id]
      end
    end

    def creature_id_by_name
      @creature_id_by_name ||= creatures_data.fetch("creatures").keys.to_h do |id|
        [creature(id).name, id]
      end
    end
  end
end
