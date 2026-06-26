module TextAdventures
  class Battle
    Result = Struct.new(:lines, :finished?, :loot, :player_defeated?, keyword_init: true) do
      def to_response
        Response.new(lines)
      end
    end

    CRITICAL_CHANCE = 10
    JUNK_DROP_CHANCE_MULTIPLIER = 1.3
    JUNK_DROP_MINIMUM_CHANCE = 40
    attr_reader :creature, :random, :contributions, :spear_thrust_used

    def self.enemy_damage_after_defense(raw_damage, defense)
      return 0 unless raw_damage.positive?

      mitigated = (raw_damage * 100.0 / (100 + defense.to_i)).ceil
      [mitigated, 1].max
    end

    def initialize(
      creature:,
      random: Random.new,
      contributions: {},
      spear_thrust_used: false
    )
      @creature = creature
      @random = random
      @contributions = Hash.new(0)
      @spear_thrust_used = spear_thrust_used
      contributions.each { |skill, amount| @contributions[skill.to_sym] = amount.to_i }
    end

    def attack(player)
      lines = start_turn_lines(player)
      return player_defeat_result(lines) if player.dead?
      return victory_result(player, lines) if creature.dead?

      recovered_mana = player.recover_mana(0.5)
      damage = player_damage(player)
      critical = critical_hit?(player)
      damage *= 2 if critical
      creature.take_damage(damage)
      record_contribution(weapon_skill(player.equipped_weapon), damage)

      lines << "[recovered #{recovered_mana} MP]" if recovered_mana.positive?
      lines << player_attack_line(damage, critical)
      lines.concat spear_thrust_lines(player) unless creature.dead?
      lines.concat dagger_double_attack_lines(player) unless creature.dead?
      if creature.dead?
        return victory_result(player, lines)
      end

      lines.concat enemy_turn_lines(player)
      return player_defeat_result(lines) if player.dead?

      Result.new(lines: lines, finished?: false, loot: LootDrop.empty)
    end

    def cast_spell(player, spell)
      return insufficient_mana_result(player, spell) unless player.enough_mana?(spell.mp_cost)

      return cast_damage_spell(player, spell) if spell.damage?
      return cast_healing_spell(player, spell) if spell.healing?
      return cast_cure_spell(player, spell) if spell.cure?
    end

    private

    def cast_damage_spell(player, spell)
      lines = start_turn_lines(player)
      return player_defeat_result(lines) if player.dead?
      return victory_result(player, lines) if creature.dead?

      player.spend_mana(spell.mp_cost)
      damage = spell_damage(player, spell)
      creature.take_damage(damage)
      record_contribution(spell_skill(spell), damage)
      lines << "You cast #{spell.display_name} causing #{damage} of damage."

      lines.concat spell_status_lines(spell)
      if creature.dead?
        return victory_result(player, lines)
      end

      lines.concat enemy_turn_lines(player)
      return player_defeat_result(lines) if player.dead?

      Result.new(lines: lines, finished?: false, loot: LootDrop.empty)
    end

    def cast_healing_spell(player, spell)
      lines = start_turn_lines(player)
      return player_defeat_result(lines) if player.dead?
      return victory_result(player, lines) if creature.dead?

      player.spend_mana(spell.mp_cost)
      before = player.health.current
      player.heal(spell.healing_range.begin + player.nature_magic_healing_bonus)
      recovered = player.health.current - before
      record_contribution(spell_skill(spell), [recovered, 1].max)
      lines << "You cast #{spell.display_name} and recover #{recovered} health."
      lines.concat enemy_turn_lines(player)
      return player_defeat_result(lines) if player.dead?

      Result.new(lines: lines, finished?: false, loot: LootDrop.empty)
    end

    def cast_cure_spell(player, spell)
      lines = start_turn_lines(player)
      return player_defeat_result(lines) if player.dead?
      return victory_result(player, lines) if creature.dead?

      player.spend_mana(spell.mp_cost)
      cured_statuses = player.curable_statuses
      player.clear_statuses(*cured_statuses)
      record_contribution(spell_skill(spell), 1)
      lines << if cured_statuses.any?
                 "You cast #{spell.display_name} and remove #{status_list(cured_statuses)}."
               else
                 "You cast #{spell.display_name}, but there is nothing to cure."
               end
      lines.concat enemy_turn_lines(player)
      return player_defeat_result(lines) if player.dead?

      Result.new(lines: lines, finished?: false, loot: LootDrop.empty)
    end

    def player_defeat_result(lines)
      Result.new(
        lines: lines + ["You have fallen."],
        finished?: true,
        loot: LootDrop.empty,
        player_defeated?: true
      )
    end

    def victory_result(player, lines)
      lines << "#{creature.display_name} dies."
      lines.concat award_xp_lines(player)
      Result.new(lines: lines, finished?: true, loot: roll_loot)
    end

    def insufficient_mana_result(player, spell)
      Result.new(
        lines: [
          "Not enough MP to cast #{spell.display_name}. [MP: #{player.mana.current}/#{player.mana.max}, cost: #{spell.mp_cost}]"
        ],
        finished?: false,
        loot: LootDrop.empty
      )
    end

    def roll_loot
      profile = creature.loot_profile
      return LootDrop.new(items: creature.loot_table) unless profile

      items = []
      items << random_item(profile.common_items) if roll_loot_items?(profile.common_chance, profile.common_items)
      items << random_item(profile.rare_items) if roll_loot_items?(profile.rare_chance, profile.rare_items)

      gold = roll_chance?(profile.gold_chance) ? roll_gold(profile.gold_range) : 0
      LootDrop.new(items: items.compact, gold: gold)
    end

    def roll_loot_items?(chance, items)
      items.any? && roll_chance?(adjusted_loot_chance(chance, items))
    end

    def adjusted_loot_chance(chance, items)
      return chance unless items.all?(&:junk?)

      [[chance.to_f * JUNK_DROP_CHANCE_MULTIPLIER, JUNK_DROP_MINIMUM_CHANCE].max, 100].min
    end

    def roll_chance?(chance)
      basis_points = (chance.to_f * 100).round
      basis_points.positive? && random.rand(10_000) < basis_points
    end

    def random_item(items)
      items[random.rand(items.length)]
    end

    def roll_gold(range)
      return 0 unless range && range.end.positive?

      range.begin + random.rand(range.size)
    end

    def record_contribution(skill, amount)
      return unless skill

      contributions[skill] += amount
    end

    def award_xp_lines(player)
      xp_gains = distribute_xp
      xp_gains.map do |skill, amount|
        player.gain_skill_xp(skill, amount)
        "[#{amount} XP gained in #{skill_label(skill)}]"
      end
    end

    def distribute_xp
      return {} if creature.xp_reward.zero? || contributions.empty?

      total = contributions.values.sum
      allocations = contributions.to_h do |skill, contribution|
        exact = creature.xp_reward * contribution.to_f / total
        [skill, { amount: exact.floor, remainder: exact - exact.floor }]
      end

      remaining = creature.xp_reward - allocations.values.sum { |allocation| allocation.fetch(:amount) }
      allocations.sort_by { |_skill, allocation| -allocation.fetch(:remainder) }
                 .first(remaining)
                 .each { |skill, allocation| allocations[skill] = allocation.merge(amount: allocation.fetch(:amount) + 1) }

      allocations.transform_values { |allocation| allocation.fetch(:amount) }.reject { |_skill, amount| amount.zero? }
    end

    def weapon_skill(weapon)
      weapon_class = equipment_weapon_class(weapon)
      {
        sword: :swordsmanship,
        spear: :spearmanship,
        dagger: :dagger_mastery
      }[weapon_class]
    end

    def equipment_weapon_class(weapon)
      return nil unless weapon
      return weapon.weapon_class if weapon.respond_to?(:weapon_class) && weapon.weapon_class

      normalized_name = Item.normalize_name(weapon.name)
      return :sword if normalized_name.include?("sword")
      return :spear if normalized_name.match?(/spear|halberd|lance/)
      return :dagger if normalized_name.include?("dagger")

      nil
    end

    def spell_skill(spell)
      return :combat_magic if spell.damage?
      return :nature_magic if spell.healing? || spell.cure?

      nil
    end

    def skill_label(skill)
      skill.to_s.tr("_", " ").split.map(&:capitalize).join(" ")
    end

    def player_damage(player)
      [player.attack - creature.defense, 1].max
    end

    def critical_hit?(player)
      random.rand(100) < CRITICAL_CHANCE + player.dagger_critical_bonus
    end

    def dagger_double_attack_lines(player)
      chance = player.dagger_double_attack_chance
      return [] unless chance.positive?
      return [] unless random.rand(100) < chance

      damage = player_damage(player)
      creature.take_damage(damage)
      record_contribution(weapon_skill(player.equipped_weapon), damage)

      ["You strike again with your dagger causing #{damage} of damage."]
    end

    def spear_thrust_lines(player)
      chance = player.spear_thrust_chance
      return [] unless chance.positive?
      return [] if @spear_thrust_used

      self.spear_thrust_used = true
      return [] unless random.rand(100) < chance

      damage = player.spear_thrust_damage
      creature.take_damage(damage)
      record_contribution(weapon_skill(player.equipped_weapon), damage)

      ["You drive a precise thrust with your spear causing #{damage} of damage."]
    end

    def player_attack_line(damage, critical)
      suffix = critical ? " (critical hit)" : ""
      "You attack a #{creature.display_name} causing #{damage} of damage#{suffix}."
    end

    def spell_damage(player, spell)
      [spell.damage_range.begin + spell_damage_bonus(player, spell) - creature.defense, 1].max
    end

    def spell_damage_bonus(player, spell)
      return 0 unless spell.damage?

      player.combat_magic_damage_bonus
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

    def status_list(statuses)
      statuses.map { |status| status.to_s.tr("_", " ") }.join(" and ")
    end

    def counterattack_lines(player)
      attack = enemy_attack
      return ["#{creature.display_name} attacks you with #{attack.name}, but you parry with your sword."] if sword_parry?(player)

      damage = counterattack_damage(player, attack)
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

    def enemy_attack_damage(attack)
      attack.damage_range.begin + random.rand(attack.damage_range.size)
    end

    def counterattack_damage(player, attack)
      self.class.enemy_damage_after_defense(enemy_attack_damage(attack), player.defense)
    end

    def sword_parry?(player)
      chance = player.sword_parry_chance
      chance.positive? && random.rand(100) < chance
    end

    def start_turn_lines(player)
      player.tick_status_effects
    end

    attr_writer :spear_thrust_used
  end
end
