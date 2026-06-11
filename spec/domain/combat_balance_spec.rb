require 'spec_helper'

RSpec.describe "combat balance" do
  LEVEL_POOL_SAMPLES = {
    1 => 2..6,
    3 => 3..8,
    6 => 4..9,
    9 => 5..11
  }.freeze

  it "keeps enemy average damage meaningful against armor dropped in the same level band" do
    LEVEL_POOL_SAMPLES.each do |level, expected_damage_range|
      creature_ids = TextAdventures::ContentCatalog.creature_ids_for_level(level)
      baseline_defense = armor_drop_baseline_defense(creature_ids)
      average_damage = average_pool_damage_after_defense(creature_ids, baseline_defense)

      expect(average_damage)
        .to be_between(expected_damage_range.begin, expected_damage_range.end),
            "expected level #{level} pool to average #{expected_damage_range} damage " \
            "against #{baseline_defense} defense, got #{average_damage.round(2)}"
    end
  end

  it "lets high-level enemies punish undergeared armor without one-shotting the player on average" do
    creature_ids = TextAdventures::ContentCatalog.creature_ids_for_level(9)
    starter_defense = TextAdventures::Character::STARTER_ARMOR.defense
    average_damage = average_pool_damage_after_defense(creature_ids, starter_defense)

    expect(average_damage).to be_between(8, 15)
  end

  def armor_drop_baseline_defense(creature_ids)
    armor_defenses = creature_ids.flat_map do |creature_id|
      TextAdventures::ContentCatalog.creature(creature_id).loot_table
                       .select(&:armor?)
                       .map(&:defense)
    end

    defenses = armor_defenses.empty? ? [TextAdventures::Character::STARTER_ARMOR.defense] : armor_defenses
    defenses.sum.to_f / defenses.length
  end

  def average_pool_damage_after_defense(creature_ids, defense)
    damages = creature_ids.flat_map do |creature_id|
      TextAdventures::ContentCatalog.creature(creature_id).attacks.map do |attack|
        average_raw_damage = (attack.damage_range.begin + attack.damage_range.end) / 2.0
        TextAdventures::Battle.enemy_damage_after_defense(average_raw_damage, defense)
      end
    end

    damages.sum.to_f / damages.length
  end
end
