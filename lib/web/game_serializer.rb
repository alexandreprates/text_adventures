module TextAdventures
  module Web
    class GameSerializer
      def initialize(game)
        @game = game
      end

      def to_h
        {
          scene: game.current_scene_name.to_s,
          scene_display_name: scene_display_name,
          prompt: prompt,
          player: player_state,
          dungeon: dungeon_state,
          battle: battle_state,
          pending: pending_state
        }
      end

      private

      attr_reader :game

      def scene_display_name
        scene = game.current_scene
        return scene.display_name if scene.respond_to?(:display_name)

        scene.name.to_s.split("_").map(&:capitalize).join(" ")
      end

      def prompt
        scene = game.current_scene
        label = if scene.name == :ruins && game.dungeon
                  "Ruins L#{game.dungeon.level}"
                else
                  scene_display_name
                end

        label
      end

      def player_state
        player = game.player
        {
          name: player.name,
          health: {
            current: player.health.current,
            max: player.health.max
          },
          gold: player.gold,
          current_class: player.current_class,
          level: player.overall_level,
          xp: player.overall_experience,
          attack: player.attack,
          defense: player.defense,
          statuses: player.status_effects.map(&:to_s),
          equipment: {
            weapon: equipment_state(player.equipped_weapon),
            armor: equipment_state(player.equipped_armor)
          },
          inventory: inventory_state(player.inventory),
          spells: spells_state(player.spells.values),
          skills: skills_state(player)
        }
      end

      def equipment_state(equipment)
        return nil unless equipment

        {
          name: equipment_name(equipment),
          display_name: equipment_display_name(equipment),
          attack: equipment_value(equipment, :attack),
          defense: equipment_value(equipment, :defense),
          weapon_class: optional_string(equipment, :weapon_class),
          armor_class: optional_string(equipment, :armor_class)
        }.compact
      end

      def inventory_state(inventory)
        inventory.entries_list.map do |entry|
          item_state(entry.item).merge(quantity: entry.quantity)
        end
      end

      def item_state(item)
        {
          name: item.command_name,
          display_name: item.display_name,
          type: item.type.to_s,
          price: item.price,
          attack: item.attack,
          defense: item.defense,
          recovery: item.recovery,
          spell: item.spell,
          weapon_class: item.weapon_class&.to_s,
          armor_class: item.armor_class&.to_s
        }.compact
      end

      def spells_state(spells)
        spells.sort_by(&:display_name).map do |spell|
          {
            name: spell.command_name,
            display_name: spell.display_name,
            level: spell.level,
            kind: spell.kind.to_s,
            description: spell.description
          }
        end
      end

      def skills_state(player)
        CharacterProgression::SKILL_TRACKS.to_h do |skill|
          level = player.progression.skill_level(skill)
          [
            skill.to_s,
            {
              level: level,
              xp: player.progression.skill_xp(skill),
              next_level_xp: player.progression.xp_required_for(level)
            }
          ]
        end
      end

      def dungeon_state
        dungeon = game.dungeon
        return nil unless dungeon

        map_rows = dungeon_map_rows(dungeon)
        {
          level: dungeon.level,
          viewport: dungeon_viewport_state(dungeon, map_rows),
          player_position: position_state(dungeon.current_global_position),
          entrance_portal: optional_position_state(dungeon.entrance_portal_position),
          descent: optional_position_state(dungeon.floor_exit_position),
          nearby_loot: loot_position_state(dungeon.nearby_loot_position)
        }
      end

      def dungeon_map_rows(dungeon)
        dungeon.render(view: :viewport).lines.drop(1).map(&:chomp)
      end

      def dungeon_viewport_state(dungeon, map_rows)
        width = map_rows.map(&:length).max.to_i
        height = map_rows.length
        player_entity = entity_positions(map_rows, "x").first

        {
          width: width,
          height: height,
          origin: viewport_origin(dungeon, player_entity),
          terrain: viewport_terrain(map_rows, width),
          entities: viewport_entities(dungeon, map_rows, width, height)
        }
      end

      def viewport_origin(dungeon, player_entity)
        return nil unless player_entity

        position = dungeon.current_global_position
        {
          x: position.x - player_entity.fetch(:x),
          y: position.y - player_entity.fetch(:y)
        }
      end

      def viewport_terrain(map_rows, width)
        map_rows.map do |row|
          row.ljust(width, "?").tr("xE@P> ", ".....")
        end.join
      end

      def viewport_entities(dungeon, map_rows, width, height)
        origin = viewport_origin(dungeon, entity_positions(map_rows, "x").first)
        entities = []
        entities.concat(entity_positions(map_rows, "x").map { |position| position.merge(type: "player") })
        entities << viewport_entity("portal", dungeon.entrance_portal_position, origin, width, height)
        entities << viewport_entity("descent", dungeon.floor_exit_position, origin, width, height)
        entities << viewport_entity("loot", dungeon.nearby_loot_position, origin, width, height)
        entities.concat(enemy_viewport_entities(dungeon))
        entities.compact.sort_by { |entity| [entity.fetch(:y), entity.fetch(:x), entity.fetch(:type)] }
      end

      def viewport_entity(type, global_position, origin, width, height)
        position = viewport_position(global_position, origin, width, height)
        position&.merge(type: type)
      end

      def viewport_position(global_position, origin, width, height)
        return nil unless global_position && origin

        x = global_position.x - origin.fetch(:x)
        y = global_position.y - origin.fetch(:y)
        return nil unless x.between?(0, width - 1) && y.between?(0, height - 1)

        { x: x, y: y }
      end

      def entity_positions(map_rows, symbol)
        map_rows.each_with_index.flat_map do |row, y|
          row.chars.each_with_index.filter_map do |character, x|
            { x: x, y: y } if character == symbol
          end
        end
      end

      def enemy_viewport_entities(dungeon)
        dungeon.visible_enemies.map do |enemy|
          position_state(enemy.fetch(:render_position)).merge(
            type: "enemy",
            creature_id: enemy.fetch(:creature_id)
          )
        end
      end

      def battle_state
        battle = game.battle
        return { active: false, enemy: nil } unless battle

        {
          active: true,
          enemy: creature_state(battle.creature)
        }
      end

      def creature_state(creature)
        {
          name: creature.name,
          display_name: creature.display_name,
          health: {
            current: creature.health.current,
            max: creature.health.max
          },
          defense: creature.defense,
          xp_reward: creature.xp_reward,
          statuses: creature.active_statuses.map(&:to_s)
        }
      end

      def pending_state
        {
          confirmation: !game.pending_confirmation.nil?
        }
      end

      def loot_position_state(position)
        return nil unless position

        loot = LootDrop.coerce(game.dungeon.loot_at(position))
        position_state(position).merge(
          items: loot.map { |item| item_state(item) },
          gold: loot.gold
        )
      end

      def position_state(position)
        {
          x: position.x,
          y: position.y
        }
      end

      def optional_position_state(position)
        position_state(position) if position
      end

      def equipment_name(equipment)
        return equipment.command_name if equipment.respond_to?(:command_name)

        Item.normalize_name(equipment.name)
      end

      def equipment_display_name(equipment)
        return equipment.display_name if equipment.respond_to?(:display_name)

        equipment.name
      end

      def equipment_value(equipment, attribute)
        return 0 unless equipment.respond_to?(attribute)

        equipment.public_send(attribute).to_i
      end

      def optional_string(object, attribute)
        return nil unless object.respond_to?(attribute)

        value = object.public_send(attribute)
        value&.to_s
      end
    end
  end
end
