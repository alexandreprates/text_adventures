module TextAdventures
  class Battle
    Result = Struct.new(:lines, :finished?, :loot, keyword_init: true) do
      def to_response
        Response.new(lines)
      end
    end

    CRITICAL_CHANCE = 10
    POISON_DAMAGE = 2

    attr_reader :creature, :random

    def initialize(creature:, random: Random.new)
      @creature = creature
      @random = random
    end

    def attack(player)
      lines = poison_tick_lines(player)
      damage = player_damage(player)
      critical = critical_hit?
      damage *= 2 if critical
      creature.take_damage(damage)

      lines << player_attack_line(damage, critical)
      if creature.dead?
        lines << "#{creature.display_name} dies."
        return Result.new(lines: lines, finished?: true, loot: creature.loot_table)
      end

      lines.concat enemy_turn_lines(player)
      Result.new(lines: lines, finished?: false, loot: [])
    end

    def cast_spell(player, spell)
      lines = poison_tick_lines(player)
      damage = spell_damage(spell)
      creature.take_damage(damage)
      lines << "You cast #{spell.display_name} causing #{damage} of damage."

      lines.concat spell_status_lines(spell)
      if creature.dead?
        lines << "#{creature.display_name} dies."
        return Result.new(lines: lines, finished?: true, loot: creature.loot_table)
      end

      lines.concat enemy_turn_lines(player)
      Result.new(lines: lines, finished?: false, loot: [])
    end

    private

    def player_damage(player)
      [player.attack - creature.defense, 1].max
    end

    def critical_hit?
      random.rand(100) < CRITICAL_CHANCE
    end

    def player_attack_line(damage, critical)
      suffix = critical ? " (critical hit)" : ""
      "You attack a #{creature.display_name} causing #{damage} of damage#{suffix}."
    end

    def spell_damage(spell)
      [spell.damage_range.begin - creature.defense, 1].max
    end

    def spell_status_lines(spell)
      return [] unless spell.status && random.rand(100) < spell.status_chance

      creature.apply_status(spell.status)
      ["#{creature.display_name} is #{status_adjective(spell.status)}."]
    end

    def enemy_turn_lines(player)
      if creature.status?(:freeze)
        creature.clear_status(:freeze)
        return ["#{creature.display_name} is frozen and loses its turn."]
      end

      counterattack_lines(player)
    end

    def status_adjective(status)
      {
        freeze: "frozen"
      }.fetch(status, status.to_s)
    end

    def counterattack_lines(player)
      attack = enemy_attack
      damage = [attack.damage_range.begin - player.defense, 0].max
      player.take_damage(damage)

      lines = ["#{creature.display_name} attacks you with #{attack.name} causing #{damage} of damage."]
      if attack.status && random.rand(100) < attack.status_chance
        player.apply_status(attack.status)
        lines << "You are #{attack.status}ed."
      end
      lines
    end

    def enemy_attack
      creature.attacks[random.rand(creature.attacks.length)]
    end

    def poison_tick_lines(player)
      return [] unless player.status?(:poison)

      player.take_damage(POISON_DAMAGE)
      ["Poison deals #{POISON_DAMAGE} damage."]
    end
  end
end
