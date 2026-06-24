require "json"
require "time"

module TextAdventures
  module Persistence
    class GameSnapshot
      CURRENT_SCHEMA_VERSION = 1

      def self.dump(game, saved_at: Time.now.utc)
        new.dump(game, saved_at: saved_at)
      end

      def self.load(payload)
        new.load(payload)
      end

      def dump(game, saved_at: Time.now.utc)
        {
          "schema_version" => CURRENT_SCHEMA_VERSION,
          "saved_at" => saved_at.utc.iso8601,
          "game" => {
            "scene" => game.current_scene_name.to_s,
            "world_seed" => game.world_seed,
            "random" => random_snapshot(game.random),
            "player" => player_snapshot(game.player),
            "dungeon" => dungeon_snapshot(game.dungeon),
            "battle" => battle_snapshot(game.battle),
            "pending" => pending_snapshot(game)
          }
        }
      rescue ArgumentError => error
        raise SnapshotContentError, error.message
      end

      def load(payload)
        snapshot = normalize_payload(payload)
        version = Integer(snapshot.fetch("schema_version"))
        unless version == CURRENT_SCHEMA_VERSION
          raise SnapshotVersionError, "unsupported snapshot schema version: #{version}"
        end

        game_snapshot = snapshot.fetch("game")
        random = random_from(game_snapshot.fetch("random"))
        world_seed = game_snapshot["world_seed"] || random.seed
        dungeon = dungeon_from(game_snapshot["dungeon"], random: random)
        scene = scene_from(game_snapshot.fetch("scene"), dungeon: dungeon, random: random)
        player = player_from(game_snapshot.fetch("player"))
        battle = battle_from(game_snapshot["battle"], random: random)
        pending = game_snapshot.fetch("pending", {})

        Game.new(
          player: player,
          current_scene: scene,
          pending_confirmation: confirmation_from(pending["confirmation"], current_scene: scene),
          dungeon: dungeon,
          battle: battle,
          pending_loot: loot_from(pending["loot"]),
          active_enemy_position: position_from(pending["active_enemy_position"]),
          random: random,
          world_seed: world_seed
        )
      rescue KeyError, TypeError, ArgumentError => error
        raise SnapshotContentError, error.message
      end

      private

      def normalize_payload(payload)
        value = payload.is_a?(String) ? JSON.parse(payload) : payload
        stringify_keys(value)
      rescue JSON::ParserError => error
        raise SnapshotContentError, error.message
      end

      def stringify_keys(value)
        case value
        when Hash
          value.to_h { |key, child| [key.to_s, stringify_keys(child)] }
        when Array
          value.map { |child| stringify_keys(child) }
        else
          value
        end
      end

      def random_snapshot(random)
        unless random.respond_to?(:snapshot)
          raise ArgumentError, "game random source cannot be persisted"
        end

        random.snapshot
      end

      def random_from(snapshot)
        RandomSource.from_snapshot(snapshot)
      end

      def player_snapshot(player)
        {
          "name" => player.name,
          "health" => {
            "current" => player.health.current,
            "max" => player.health.max
          },
          "mana" => {
            "current" => player.mana.current,
            "max" => player.mana.max
          },
          "gold" => player.gold,
          "base_attack" => player.base_attack,
          "base_defense" => player.base_defense,
          "equipment" => {
            "weapon" => item_id_for(player.equipped_weapon),
            "armor" => item_id_for(player.equipped_armor)
          },
          "inventory" => inventory_snapshot(player.inventory),
          "spells" => player.spells.values.map { |spell| spell_snapshot(spell) },
          "statuses" => player.status_effects.map(&:to_s),
          "status_durations" => player.status_durations.to_h { |status, duration| [status.to_s, duration] },
          "progression" => {
            "skill_experience" => player.progression.skill_experience.to_h { |skill, xp| [skill.to_s, xp] }
          }
        }
      end

      def player_from(snapshot)
        status_effects = snapshot.fetch("statuses", [])
        progression = CharacterProgression.new(
          skill_experience: snapshot.fetch("progression").fetch("skill_experience", {})
        )
        mana = mana_snapshot(snapshot, progression)

        Character.new(
          name: snapshot.fetch("name"),
          health: Integer(snapshot.fetch("health").fetch("current")),
          max_health: Integer(snapshot.fetch("health").fetch("max")),
          mana: numeric_value(mana.fetch("current")),
          max_mana: numeric_value(mana.fetch("max")),
          gold: Integer(snapshot.fetch("gold")),
          base_attack: Integer(snapshot.fetch("base_attack")),
          base_defense: Integer(snapshot.fetch("base_defense")),
          equipped_weapon: item_from_id(snapshot.fetch("equipment").fetch("weapon")),
          equipped_armor: item_from_id(snapshot.fetch("equipment").fetch("armor")),
          inventory: inventory_from(snapshot.fetch("inventory", [])),
          spells: snapshot.fetch("spells", []).map { |spell| spell_from(spell) },
          status_effects: status_effects,
          status_durations: snapshot.fetch("status_durations", {}),
          progression: progression
        )
      end

      def mana_snapshot(snapshot, progression)
        snapshot.fetch(
          "mana",
          {
            "current" => Character.max_mana_for(progression),
            "max" => Character.max_mana_for(progression)
          }
        )
      end

      def numeric_value(value)
        return value if value.is_a?(Numeric)

        number = Float(value)
        number == number.to_i ? number.to_i : number
      end

      def inventory_snapshot(inventory)
        inventory.entries_list.map do |entry|
          {
            "item_id" => item_id_for(entry.item),
            "quantity" => entry.quantity
          }
        end
      end

      def inventory_from(entries)
        Inventory.new.tap do |inventory|
          entries.each do |entry|
            inventory.add(item_from_id(entry.fetch("item_id")), quantity: Integer(entry.fetch("quantity")))
          end
        end
      end

      def spell_snapshot(spell)
        {
          "name" => spell.command_name,
          "level" => spell.level
        }
      end

      def spell_from(snapshot)
        Spell.for(snapshot.fetch("name"), level: Integer(snapshot.fetch("level")))
      end

      def dungeon_snapshot(dungeon)
        return nil unless dungeon

        {
          "level" => dungeon.level,
          "revealed_blocks" => dungeon.revealed_blocks.map do |key, block|
            {
              "x" => key.fetch(0),
              "y" => key.fetch(1),
              "block_id" => block.id
            }
          end,
          "player_position" => position_snapshot(dungeon.player_position),
          "current_block_position" => position_snapshot(dungeon.current_block_position),
          "floor_exit_position" => position_snapshot(dungeon.floor_exit_position),
          "enemies" => dungeon.enemies.map do |key, creature_id|
            position_snapshot_from_key(key).merge("creature_id" => creature_id.to_s)
          end,
          "dropped_loot" => dungeon.dropped_loot.map do |key, loot|
            position_snapshot_from_key(key).merge("loot" => loot_snapshot(loot))
          end
        }
      end

      def dungeon_from(snapshot, random:)
        return nil unless snapshot

        Dungeon.new(
          level: Integer(snapshot.fetch("level")),
          revealed_blocks: snapshot.fetch("revealed_blocks").to_h do |entry|
            [[Integer(entry.fetch("x")), Integer(entry.fetch("y"))], entry.fetch("block_id")]
          end,
          player_position: position_from(snapshot.fetch("player_position")),
          current_block_position: block_position_from(snapshot.fetch("current_block_position")),
          floor_exit_position: position_from(snapshot["floor_exit_position"]),
          enemies: snapshot.fetch("enemies", []).to_h do |entry|
            [[Integer(entry.fetch("x")), Integer(entry.fetch("y"))], entry.fetch("creature_id")]
          end,
          dropped_loot: snapshot.fetch("dropped_loot", []).to_h do |entry|
            [[Integer(entry.fetch("x")), Integer(entry.fetch("y"))], loot_from(entry.fetch("loot"))]
          end,
          random: random
        )
      end

      def battle_snapshot(battle)
        return nil unless battle

        {
          "creature" => creature_snapshot(battle.creature),
          "contributions" => battle.contributions.to_h { |skill, amount| [skill.to_s, amount] },
          "spear_brace_used" => battle.spear_brace_used
        }
      end

      def battle_from(snapshot, random:)
        return nil unless snapshot

        Battle.new(
          creature: creature_from(snapshot.fetch("creature")),
          random: random,
          contributions: snapshot.fetch("contributions", {}),
          spear_brace_used: snapshot.fetch("spear_brace_used", false)
        )
      end

      def creature_snapshot(creature)
        {
          "creature_id" => ContentCatalog.creature_id_for(creature),
          "health" => {
            "current" => creature.health.current,
            "max" => creature.health.max
          },
          "active_statuses" => creature.active_statuses.map(&:to_s)
        }
      end

      def creature_from(snapshot)
        base = ContentCatalog.creature(snapshot.fetch("creature_id"))
        Creature.new(
          name: base.display_name,
          health: Integer(snapshot.fetch("health").fetch("current")),
          max_health: Integer(snapshot.fetch("health").fetch("max")),
          defense: base.defense,
          xp_reward: base.xp_reward,
          attacks: base.attacks,
          loot_table: base.loot_table,
          loot_profile: base.loot_profile,
          status_effects: base.status_effects,
          active_statuses: snapshot.fetch("active_statuses", [])
        )
      end

      def pending_snapshot(game)
        {
          "confirmation" => confirmation_snapshot(game.pending_confirmation),
          "loot" => loot_snapshot(game.pending_loot),
          "active_enemy_position" => position_snapshot(game.active_enemy_position)
        }
      end

      def confirmation_snapshot(confirmation)
        return nil unless confirmation

        {
          "merchant" => confirmation.merchant.name.to_s,
          "action" => confirmation.action.to_s,
          "item_id" => item_id_for(confirmation.item),
          "price" => confirmation.price
        }
      end

      def confirmation_from(snapshot, current_scene:)
        return nil unless snapshot

        unless current_scene.is_a?(Scenes::Merchant) && current_scene.name.to_s == snapshot.fetch("merchant")
          raise ArgumentError, "pending confirmation merchant does not match current scene"
        end

        Scenes::Merchant::Confirmation.new(
          merchant: current_scene,
          action: snapshot.fetch("action").to_sym,
          item: item_from_id(snapshot.fetch("item_id")),
          price: Integer(snapshot.fetch("price"))
        )
      end

      def loot_snapshot(loot)
        return nil unless loot

        {
          "gold" => loot.gold,
          "items" => loot.items.map { |item| item_id_for(item) }
        }
      end

      def loot_from(snapshot)
        return nil unless snapshot

        LootDrop.new(
          gold: Integer(snapshot.fetch("gold", 0)),
          items: snapshot.fetch("items", []).map { |item_id| item_from_id(item_id) }
        )
      end

      def scene_from(name, dungeon:, random:)
        case name.to_s
        when "town"
          Scenes::Town.new
        when "ruins"
          Scenes::Ruins.new(dungeon: dungeon || Dungeon.new(random: random))
        when "blacksmith"
          Scenes::Blacksmith.new
        when "armorsmith"
          Scenes::Armorsmith.new
        when "priest"
          Scenes::Priest.new
        when "tavern"
          Scenes::Tavern.new
        else
          raise ArgumentError, "unknown scene: #{name}"
        end
      end

      def item_id_for(item)
        ContentCatalog.item_id_for(item)
      end

      def item_from_id(id)
        ContentCatalog.item(id)
      end

      def position_snapshot(position)
        return nil unless position

        {
          "x" => position.x,
          "y" => position.y
        }
      end

      def position_snapshot_from_key(key)
        {
          "x" => key.fetch(0),
          "y" => key.fetch(1)
        }
      end

      def position_from(snapshot)
        return nil unless snapshot

        Dungeon::Position.new(x: Integer(snapshot.fetch("x")), y: Integer(snapshot.fetch("y")))
      end

      def block_position_from(snapshot)
        position = position_from(snapshot)
        Dungeon::BlockPosition.new(x: position.x, y: position.y)
      end
    end
  end
end
