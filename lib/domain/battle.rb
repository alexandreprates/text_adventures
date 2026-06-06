module TextAdventures
  class Battle
    Result = Struct.new(:lines, :finished?, keyword_init: true) do
      def to_response
        Response.new(lines)
      end
    end

    CRITICAL_CHANCE = 10

    attr_reader :creature, :random

    def initialize(creature:, random: Random.new)
      @creature = creature
      @random = random
    end

    def attack(player)
      damage = player_damage(player)
      critical = critical_hit?
      damage *= 2 if critical
      creature.take_damage(damage)

      lines = [player_attack_line(damage, critical)]
      if creature.dead?
        lines << "#{creature.display_name} dies."
        return Result.new(lines: lines, finished?: true)
      end

      lines << counterattack_line(player)
      Result.new(lines: lines, finished?: false)
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

    def counterattack_line(player)
      attack = creature.attacks.first
      damage = [attack.damage_range.begin - player.defense, 0].max
      player.take_damage(damage)

      "#{creature.display_name} attacks you with #{attack.name} causing #{damage} of damage."
    end
  end
end
