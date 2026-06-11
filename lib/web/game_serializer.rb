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
          input_mode: game.input_mode.to_s,
          player: player_state,
          dungeon: dungeon_state,
          battle: battle_state,
          pending: pending_state,
          history: history_state
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

        game.game_mode? ? "#{label} [game]" : label
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

        {
          level: dungeon.level,
          map: dungeon.render(view: :viewport).lines.drop(1).map(&:chomp),
          player_position: position_state(dungeon.current_global_position),
          visible_enemy: enemy_position_state(dungeon.adjacent_enemy_position),
          visible_enemies: visible_enemy_states,
          nearby_loot: loot_position_state(dungeon.nearby_loot_position)
        }
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
          confirmation: !game.pending_confirmation.nil?,
          spell_choices: spells_state(game.pending_game_spell_choices || [])
        }
      end

      def history_state
        game.history.map do |entry|
          {
            command: entry.command,
            response: entry.response.to_s,
            lines: entry.response.to_s.lines.map(&:chomp)
          }
        end
      end

      def enemy_position_state(position)
        return nil unless position

        creature_id = game.dungeon.enemy_at(position)
        state = position_state(position)
        state[:creature_id] = creature_id
        state
      end

      def visible_enemy_states
        game.dungeon.visible_enemies.map do |enemy|
          position_state(enemy.fetch(:position)).merge(
            creature_id: enemy.fetch(:creature_id),
            map_position: position_state(enemy.fetch(:render_position))
          )
        end
      end

      def loot_position_state(position)
        return nil unless position

        loot = game.dungeon.loot_at(position) || []
        position_state(position).merge(items: loot.map { |item| item_state(item) })
      end

      def position_state(position)
        {
          x: position.x,
          y: position.y
        }
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
