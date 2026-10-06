require 'spec_helper'

RSpec.describe "Loot economy balance" do
  let(:catalog) { TextAdventures::ContentCatalog.new }
  let(:merchant) { TextAdventures::Scenes::Tavern.new }

  # Measure rewards per victory, independent of animation speed or player pace.
  EXPECTED_VALUE_BY_LEVEL = { 1 => 1.0..1.5, 3 => 1.5..2.0, 6 => 2.5..3.5, 9 => 3.5..5.0 }.freeze

  def expected_loot_value(creature)
    profile = creature.loot_profile
    gold = profile.gold_chance / 100.0 * (profile.gold_range.begin + profile.gold_range.end) / 2.0
    items = [[profile.common_chance, profile.common_items], [profile.rare_chance, profile.rare_items]]
    gold + items.sum do |chance, pool|
      pool.empty? ? 0 : chance / 100.0 * pool.sum { |item| merchant.sell_price(item) } / pool.length
    end
  end

  it "guarantees enough cash for a healing potion even when every optional drop misses" do
    unlucky_random = Class.new do
      def rand(limit)
        limit - 1
      end
    end.new
    potion_price = merchant.buy_price(catalog.item("potion_of_heal"))

    catalog.creature_ids.each do |id|
      creature = catalog.creature(id)
      creature.take_damage(creature.health.max)
      loot = TextAdventures::Battle.new(creature: creature, random: unlucky_random)
                                   .attack(TextAdventures::Character.new).loot

      expect(loot.gold).to be >= potion_price
      expect(loot.items).to be_empty
    end
  end

  it "bounds each creature's total sale value within its difficulty band" do
    EXPECTED_VALUE_BY_LEVEL.each do |level, range|
      catalog.creature_ids_for_level(level).each do |id|
        expect(expected_loot_value(catalog.creature(id))).to be_between(range.begin, range.end), id
      end
    end
  end

  it "keeps actual combat drops consistent with the documented reward budget" do
    EXPECTED_VALUE_BY_LEVEL.each do |level, range|
      random = Random.new(level)
      ids = catalog.creature_ids_for_level(level)
      player = TextAdventures::Character.new
      total = 4_000.times.sum do
        creature = catalog.creature(ids.sample(random: random))
        creature.take_damage(creature.health.max)
        loot = TextAdventures::Battle.new(creature: creature, random: random).attack(player).loot
        loot.gold + loot.items.sum { |item| merchant.sell_price(item) }
      end
      expected = ids.sum { |id| expected_loot_value(catalog.creature(id)) } / ids.length

      expect(total / 4_000.0).to be_within(0.15).of(expected)
      expect(total / 4_000.0).to be_between(range.begin, range.end)
    end
  end

  it "funds repeated early expeditions without requiring rare drops or free rest" do
    100.times do |seed|
      player = TextAdventures::Character.new
      game = TextAdventures::Game.new(player: player)
      random = Random.new(seed)
      ids = catalog.creature_ids_for_level(1)

      40.times do |index|
        creature = catalog.creature(ids.sample(random: random))
        battle = TextAdventures::Battle.new(creature: creature, random: random)
        loop do
          if player.health.current <= [player.health.max - 20, 18].max
            expect(player.inventory.quantity("potion of heal")).to be_positive, "seed #{seed}, fight #{index + 1}"
            game.handle("use potion of heal")
          end
          result = battle.attack(player)
          expect(player).not_to be_dead
          next unless result.finished?

          # Cash alone must fund supplies; do not depend on optional item sales.
          player.gold += result.loot.gold
          break
        end
        next unless (index + 1) % 5 == 0

        game.handle("go tavern")
        quantity = 5 - player.inventory.quantity("potion of heal")
        if quantity.positive?
          expect(game.handle("trade buy=potion of heal:#{quantity}")).to include "Trade completed."
        end
      end

      expect(player.inventory.quantity("potion of heal")).to eq 5
      expect(player.gold).to be_between(15, 40), "seed #{seed} ended with #{player.gold}g"
    end
  end

  it "makes the first upgrade attainable while keeping expensive equipment a longer goal" do
    early_value = catalog.creature_ids_for_level(1).sum { |id| expected_loot_value(catalog.creature(id)) } /
                  catalog.creature_ids_for_level(1).length
    upgrade = merchant.buy_price(catalog.item("bastard_sword"))
    # Reserve half a potion per victory before saving for equipment.
    savings_per_victory = early_value - merchant.buy_price(catalog.item("potion_of_heal")) * 0.5

    expect(upgrade / savings_per_victory).to be_between(30, 50)
    expect(merchant.buy_price(catalog.item("kings_nep_sword")) / early_value).to be > 300
  end

  it "covers sustained potion costs in deeper pools with equipment appropriate to the band" do
    [[3, "bastard_sword", "chain_shirt", :swordsmanship],
     [6, "shadow_dagger", "breastplate", :dagger_mastery],
     [9, "assassin_dagger", "chain_mail", :dagger_mastery]].each do |level, weapon, armor, skill|
      30.times do |seed|
        progression = TextAdventures::CharacterProgression.new(
          skill_experience: { skill => TextAdventures::CharacterProgression.xp_required_for(level - 1) }
        )
        player = TextAdventures::Character.new(progression: progression, equipped_weapon: catalog.item(weapon),
                                               equipped_armor: catalog.item(armor))
        # Carry enough supplies to measure their full replacement cost without town healing.
        player.inventory.add(catalog.item("potion_of_heal"), quantity: 95)
        game = TextAdventures::Game.new(player: player)
        random = Random.new(seed)
        revenue = 0
        consumed = 0

        40.times do
          creature = catalog.creature(catalog.creature_ids_for_level(level).sample(random: random))
          battle = TextAdventures::Battle.new(creature: creature, random: random)
          loop do
            if player.health.current <= [player.health.max - 20, 18].max
              expect(player.inventory.quantity("potion of heal")).to be_positive
              game.handle("use potion of heal")
              consumed += 1
            end
            result = battle.attack(player)
            expect(player).not_to be_dead
            next unless result.finished?

            revenue += result.loot.gold
            break
          end
        end

        supply_cost = consumed * merchant.buy_price(catalog.item("potion_of_heal"))
        expect(revenue - supply_cost).to be_between(10, 160), "pool #{level}, seed #{seed}"
      end
    end
  end

  it "never profits from buying and reselling shop stock" do
    %w[blacksmith armorsmith priest tavern].each do |shop|
      catalog.shop(shop).fetch(:stock).each do |item|
        expect(merchant.sell_price(item)).to be <= merchant.buy_price(item)
      end
    end
  end

  it "keeps starter and purchased healing potions identical" do
    starter = TextAdventures::Character.new.inventory.find("potion of heal")
    potion = catalog.item("potion_of_heal")

    expect(starter).to have_attributes(price: potion.price, recovery: potion.recovery)
  end

  it "lets a penniless player recover health and mana in town without selling equipment" do
    player = TextAdventures::Character.new(health: 1, mana: 0, inventory: TextAdventures::Inventory.new)
    game = TextAdventures::Game.new(player: player)
    game.handle("go tavern")
    game.handle("sleep")

    expect(player.gold).to eq 0
    expect(player.health.current).to eq player.health.max
    expect(player.mana.current).to eq player.mana.max
    expect(player.equipped_weapon).not_to be_nil
  end
end
