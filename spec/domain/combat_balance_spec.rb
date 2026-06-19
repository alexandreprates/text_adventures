require 'spec_helper'

RSpec.describe "combat balance" do
  LEVEL_POOL_SAMPLES = {
    1 => 2..6,
    3 => 3..8,
    6 => 4..9,
    9 => 5..11
  }.freeze
  EXPECTED_WEAPON_TIERS = {
    1 => "sword",
    3 => "bastard_sword",
    6 => "shadow_dagger",
    9 => "assassin_dagger"
  }.freeze
  EXPECTED_TURNS_TO_KILL = {
    1 => 2.0..5.0,
    3 => 2.0..5.0,
    6 => 2.0..5.0,
    9 => 3.0..6.0
  }.freeze
  DUNGEON_POOL_LEVEL_CAPS = {
    1 => 2,
    3 => 5,
    6 => 8,
    9 => 999
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

  it "keeps expected weapon tiers from collapsing level-band enemy pools" do
    EXPECTED_WEAPON_TIERS.each do |level, item_id|
      creature_ids = TextAdventures::ContentCatalog.creature_ids_for_level(level)
      weapon = TextAdventures::ContentCatalog.item(item_id)
      average_turns = average_turns_to_kill(creature_ids, weapon.attack)
      expected_range = EXPECTED_TURNS_TO_KILL.fetch(level)

      expect(average_turns)
        .to be_between(expected_range.begin, expected_range.end),
            "expected #{weapon.display_name} to average #{expected_range} turns against level #{level} pool, " \
            "got #{average_turns.round(2)}"
    end
  end

  it "keeps shop equipment progression monotonic within each family" do
    expect(stock_values("blacksmith", :sword, :attack)).to eq [10, 14, 18, 23, 30]
    expect(stock_values("blacksmith", :spear, :attack)).to eq [12, 15, 19, 24, 29]
    expect(stock_values("blacksmith", :dagger, :attack)).to eq [6, 10, 14, 20, 26]

    expect(stock_values("armorsmith", :light, :defense)).to eq [8, 12, 16, 20, 24]
    expect(stock_values("armorsmith", :medium, :defense)).to eq [18, 23, 28, 34, 40]
    expect(stock_values("armorsmith", :heavy, :defense)).to eq [26, 33, 41, 50, 60]
  end

  it "keeps shop equipment availability aligned to item tiers" do
    expect(stock_values("blacksmith", :sword, :min_level)).to eq [1, 2, 3, 5, 9]
    expect(stock_values("blacksmith", :spear, :min_level)).to eq [1, 2, 3, 5, 7]
    expect(stock_values("blacksmith", :dagger, :min_level)).to eq [1, 1, 2, 5, 7]

    expect(stock_values("armorsmith", :light, :min_level)).to eq [1, 1, 2, 3, 5]
    expect(stock_values("armorsmith", :medium, :min_level)).to eq [2, 3, 5, 7, 7]
    expect(stock_values("armorsmith", :heavy, :min_level)).to eq [5, 7, 7, 9, 9]
  end

  it "does not drop equipment above the dungeon pool level band" do
    DUNGEON_POOL_LEVEL_CAPS.each do |level, max_item_level|
      creature_ids = TextAdventures::ContentCatalog.creature_ids_for_level(level)
      oversized_drops = creature_ids.flat_map do |creature_id|
        creature_equipment_drops(creature_id).select { |item| item.min_level > max_item_level }
                                    .map { |item| "#{creature_id}: #{item.display_name} requires level #{item.min_level}" }
      end

      expect(oversized_drops).to eq []
    end
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

  def average_turns_to_kill(creature_ids, weapon_attack)
    turns = creature_ids.map do |creature_id|
      creature = TextAdventures::ContentCatalog.creature(creature_id)
      damage = [TextAdventures::Character::DEFAULT_BASE_ATTACK + weapon_attack - creature.defense, 1].max
      creature.health.max.to_f / damage
    end

    turns.sum.to_f / turns.length
  end

  def stock_values(shop_id, equipment_class, attribute)
    TextAdventures::ContentCatalog.shop(shop_id).fetch(:stock)
                  .select { |item| item.weapon_class == equipment_class || item.armor_class == equipment_class }
                  .map(&attribute)
  end

  def creature_equipment_drops(creature_id)
    creature = TextAdventures::ContentCatalog.creature(creature_id)
    items = creature.loot_table + creature.loot_profile.common_items + creature.loot_profile.rare_items

    items.select { |item| item.weapon? || item.armor? }.uniq(&:command_name)
  end
end
