require 'spec_helper'

RSpec.describe "Loot economy balance" do
  TARGET_GOLD_PER_HOUR = 1.0
  EXPECTED_VICTORIES_PER_HOUR = 20
  MAX_EXPECTED_VALUE_PER_VICTORY = TARGET_GOLD_PER_HOUR / EXPECTED_VICTORIES_PER_HOUR

  def expected_loot_value(creature)
    profile = creature.loot_profile

    expected_gold_value(profile) +
      expected_item_value(profile.common_chance, profile.common_items) +
      expected_item_value(profile.rare_chance, profile.rare_items)
  end

  def expected_gold_value(profile)
    profile.gold_chance.to_f / 100.0 * average_range(profile.gold_range)
  end

  def expected_item_value(chance, items)
    return 0 if items.empty?

    chance.to_f / 100.0 * average_item_sell_value(items)
  end

  def average_item_sell_value(items)
    items.sum do |item|
      TextAdventures::Scenes::Merchant.new(
        name: :audit,
        display_name: "Audit",
        stock: [],
        accepted_types: [item.type]
      ).sell_price(item)
    end / items.length.to_f
  end

  def average_range(range)
    (range.begin + range.end) / 2.0
  end

  it "keeps each creature near the one gold per hour economy target" do
    values = TextAdventures::ContentCatalog.creature_ids.to_h do |creature_id|
      creature = TextAdventures::ContentCatalog.creature(creature_id)

      [creature_id, expected_loot_value(creature)]
    end

    expect(values).to all(satisfy { |_creature_id, value| value <= MAX_EXPECTED_VALUE_PER_VICTORY })
  end

  it "keeps the roster average below the hourly gold target" do
    values = TextAdventures::ContentCatalog.creature_ids.map do |creature_id|
      expected_loot_value(TextAdventures::ContentCatalog.creature(creature_id))
    end

    expect(values.sum / values.length * EXPECTED_VICTORIES_PER_HOUR).to be <= TARGET_GOLD_PER_HOUR
  end
end
