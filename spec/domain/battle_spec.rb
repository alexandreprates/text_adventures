require 'spec_helper'

RSpec.describe TextAdventures::Battle do
  BattleSequenceRandom = Struct.new(:values) do
    def rand(_max)
      values.shift || 0
    end
  end

  subject(:battle) { described_class.new(creature: creature, random: random) }

  let(:creature) { TextAdventures::Creature.giant_spider }
  let(:random) { BattleSequenceRandom.new([99, 0, 99, 0]) }
  let(:player) { TextAdventures::Character.new(equipped_armor: nil) }

  describe "#attack" do
    it "damages the creature and lets a living enemy counterattack" do
      response = battle.attack(player)

      expect(response).to have_attributes(finished?: false)
      expect(response.loot).to be_empty
      expect(response.to_response.to_text).to eq <<~TEXT.chomp
        You attack a Giant Spider causing 10 of damage.
        Giant Spider attacks you with Bite causing 2 of damage.
      TEXT
      expect(creature.health.current).to eq 25
      expect(player.health.current).to eq 28
    end

    it "recovers half a mana point when using a physical attack" do
      player.spend_mana(2)

      response = battle.attack(player)

      expect(response.to_response.to_text).to start_with "[recovered 0.5 MP]\n"
      expect(player.mana.current).to eq 10.5
    end

    it "uses player defense to reduce enemy counterattack damage" do
      heavy_attack = TextAdventures::Creature.new(
        name: "Training Brute",
        health: 20,
        attacks: [
          TextAdventures::Creature::Attack.new(name: "Heavy Swing", damage_range: 20..20)
        ]
      )
      defended_player = TextAdventures::Character.new
      exposed_player = TextAdventures::Character.new(equipped_armor: nil)

      described_class.new(creature: heavy_attack, random: BattleSequenceRandom.new([99, 0, 99, 0])).attack(defended_player)
      described_class.new(
        creature: TextAdventures::Creature.new(
          name: "Training Brute",
          health: 20,
          attacks: [
            TextAdventures::Creature::Attack.new(name: "Heavy Swing", damage_range: 20..20)
          ]
        ),
        random: BattleSequenceRandom.new([99, 0, 99, 0])
      ).attack(exposed_player)

      expect(defended_player.health.current).to eq 12
      expect(exposed_player.health.current).to eq 10
    end

    it "supports critical hits" do
      critical_battle = described_class.new(creature: creature, random: BattleSequenceRandom.new([0, 0]))

      response = critical_battle.attack(player)

      expect(response.to_response.to_text).to include "You attack a Giant Spider causing 20 of damage (critical hit)."
      expect(creature.health.current).to eq 15
    end

    it "uses dagger mastery to improve critical hit chance" do
      creature = TextAdventures::Creature.new(name: "Training Shade", health: 20)
      dagger = TextAdventures::Item.weapon("Iron Dagger", price: 18, attack: 12, weapon_class: :dagger)
      player = TextAdventures::Character.new(equipped_weapon: dagger, equipped_armor: nil)
      player.gain_skill_xp(:dagger_mastery, 250)
      battle = described_class.new(creature: creature, random: BattleSequenceRandom.new([12]))

      response = battle.attack(player)

      expect(response.to_response.to_text).to include "You attack a Training Shade causing 26 of damage (critical hit)."
      expect(creature).to be_dead
    end

    it "lets sword users parry a counterattack when the parry roll succeeds" do
      creature = TextAdventures::Creature.new(
        name: "Training Brute",
        health: 30,
        attacks: [
          TextAdventures::Creature::Attack.new(name: "Heavy Swing", damage_range: 10..10)
        ]
      )
      sword = TextAdventures::Item.weapon("Longsword", price: 75, attack: 8, weapon_class: :sword)
      player = TextAdventures::Character.new(equipped_weapon: sword, equipped_armor: nil)
      player.gain_skill_xp(:swordsmanship, 250)
      battle = described_class.new(creature: creature, random: BattleSequenceRandom.new([99, 0, 0]))

      response = battle.attack(player)

      expect(response.to_response.to_text).to eq <<~TEXT.chomp
        You attack a Training Brute causing 11 of damage.
        Training Brute attacks you with Heavy Swing, but you parry with your sword.
      TEXT
      expect(player.health.current).to eq 35
    end

    it "lets spears add a thrust on the first attack when the thrust roll succeeds" do
      creature = TextAdventures::Creature.new(
        name: "Training Brute",
        health: 30,
        attacks: [
          TextAdventures::Creature::Attack.new(name: "Heavy Swing", damage_range: 10..10)
        ]
      )
      spear = TextAdventures::Item.weapon("Spear", price: 50, attack: 8, defense: 3, weapon_class: :spear)
      player = TextAdventures::Character.new(equipped_weapon: spear, equipped_armor: nil)
      battle = described_class.new(creature: creature, random: BattleSequenceRandom.new([99, 0, 0, 0]))

      response = battle.attack(player)

      expect(response.to_response.to_text).to eq <<~TEXT.chomp
        You attack a Training Brute causing 9 of damage.
        You drive a precise thrust with your spear causing 4 of damage.
        Training Brute attacks you with Heavy Swing causing 10 of damage.
      TEXT
      expect(creature.health.current).to eq 17
    end

    it "lets daggers strike twice when the double attack roll succeeds" do
      creature = TextAdventures::Creature.new(
        name: "Training Brute",
        health: 30,
        attacks: [
          TextAdventures::Creature::Attack.new(name: "Heavy Swing", damage_range: 0..0)
        ]
      )
      dagger = TextAdventures::Item.weapon("Iron Dagger", price: 18, attack: 8, weapon_class: :dagger)
      player = TextAdventures::Character.new(equipped_weapon: dagger, equipped_armor: nil)
      battle = described_class.new(creature: creature, random: BattleSequenceRandom.new([99, 0, 0, 0]))

      response = battle.attack(player)

      expect(response.to_response.to_text).to eq <<~TEXT.chomp
        You attack a Training Brute causing 9 of damage.
        You strike again with your dagger causing 9 of damage.
        Training Brute attacks you with Heavy Swing causing 0 of damage.
      TEXT
      expect(creature.health.current).to eq 12
    end

    it "ends the battle when the creature dies without counterattacking" do
      strong_player = TextAdventures::Character.new(base_attack: 40, equipped_weapon: nil, equipped_armor: nil)
      battle = described_class.new(creature: creature, random: BattleSequenceRandom.new([99, 0, 0, 0, 0]))

      response = battle.attack(strong_player)

      expect(response).to have_attributes(finished?: true)
      expect(response.loot.items.map(&:display_name)).to eq ["Cracked Fang", "Tome of Freezing"]
      expect(response.loot.gold).to eq 1
      expect(response.to_response.to_text).to eq <<~TEXT.chomp
        You attack a Giant Spider causing 39 of damage.
        Giant Spider dies.
      TEXT
      expect(creature).to be_dead
      expect(strong_player.health.current).to eq 30
    end

    it "raises junk loot drops to at least a forty-eight percent chance" do
      fang = TextAdventures::Item.junk("Cracked Fang", price: 2)
      creature = TextAdventures::Creature.new(
        name: "Spent Husk",
        health: 0,
        loot_profile: TextAdventures::Creature::LootProfile.new(
          common_chance: 1,
          common_items: [fang],
          rare_chance: 0,
          rare_items: [],
          gold_range: 0..0,
          gold_chance: 0
        )
      )
      battle = described_class.new(creature: creature, random: BattleSequenceRandom.new([4799, 0]))

      response = battle.attack(player)

      expect(response.loot.items).to eq [fang]
    end

    it "does not apply the junk loot minimum to non-junk drops" do
      tome = TextAdventures::Item.tome("Tome of Sparks", price: 25, spell: "Fireball")
      creature = TextAdventures::Creature.new(
        name: "Spent Acolyte",
        health: 0,
        loot_profile: TextAdventures::Creature::LootProfile.new(
          common_chance: 1,
          common_items: [tome],
          rare_chance: 0,
          rare_items: [],
          gold_range: 0..0,
          gold_chance: 0
        )
      )
      battle = described_class.new(creature: creature, random: BattleSequenceRandom.new([4799, 0]))

      response = battle.attack(player)

      expect(response.loot).to be_empty
    end

    it "awards victory XP to the equipped weapon skill" do
      creature = TextAdventures::Creature.new(
        name: "Training Shade",
        health: 10,
        xp_reward: 100
      )
      spear = TextAdventures::Item.weapon("Spear", price: 50, attack: 12, weapon_class: :spear)
      player = TextAdventures::Character.new(equipped_weapon: spear, equipped_armor: nil)
      battle = described_class.new(creature: creature, random: BattleSequenceRandom.new([99]))

      response = battle.attack(player)

      expect(response.to_response.to_text).to eq <<~TEXT.chomp
        You attack a Training Shade causing 13 of damage.
        Training Shade dies.
        [100 XP gained in Spearmanship]
      TEXT
      expect(player.skill_experience[:spearmanship]).to eq 100
      expect(player.overall_experience).to eq 100
    end

    it "applies poison from poison bite when the status roll succeeds" do
      poison_battle = described_class.new(
        creature: creature,
        random: BattleSequenceRandom.new([99, 1, 99, 0, 0])
      )

      response = poison_battle.attack(player)

      expect(response.to_response.to_text).to eq <<~TEXT.chomp
        You attack a Giant Spider causing 10 of damage.
        Giant Spider attacks you with Poison Bite causing 1 of damage.
        You are poisoned.
      TEXT
      expect(player).to be_status(:poison)
    end

    it "ticks poison damage over time before the player attacks" do
      player.apply_status(:poison)

      response = battle.attack(player)

      expect(response.to_response.to_text).to start_with "Poison deals 2 damage."
      expect(player.health.current).to eq 26
    end

    it "ends without loot when a counterattack defeats the player" do
      weak_player = TextAdventures::Character.new(health: 1, max_health: 30, equipped_armor: nil)

      response = battle.attack(weak_player)

      expect(response).to have_attributes(finished?: true, player_defeated?: true)
      expect(response.loot).to be_empty
      expect(response.to_response.to_text).to eq <<~TEXT.chomp
        You attack a Giant Spider causing 10 of damage.
        Giant Spider attacks you with Bite causing 2 of damage.
        You have fallen.
      TEXT
      expect(weak_player).to be_dead
    end

    it "ends before the player acts when poison defeats the player" do
      poisoned_player = TextAdventures::Character.new(health: 2, max_health: 30, equipped_armor: nil)
      poisoned_player.apply_status(:poison)

      response = battle.attack(poisoned_player)

      expect(response).to have_attributes(finished?: true, player_defeated?: true)
      expect(response.loot).to be_empty
      expect(response.to_response.to_text).to eq <<~TEXT.chomp
        Poison deals 2 damage.
        You have fallen.
      TEXT
      expect(creature.health.current).to eq 35
    end
  end

  describe "#cast_spell" do
    it "can force Ice Bolt to freeze the creature and skip its turn" do
      freeze_battle = described_class.new(
        creature: creature,
        random: BattleSequenceRandom.new([0])
      )

      response = freeze_battle.cast_spell(player, TextAdventures::Spell.ice_bolt)

      expect(response.to_response.to_text).to eq <<~TEXT.chomp
        You cast Ice Bolt causing 4 of damage.
        Giant Spider is frozen.
        Giant Spider is frozen and loses its turn.
      TEXT
      expect(creature.health.current).to eq 31
      expect(creature).to_not be_status(:freeze)
      expect(player.health.current).to eq 30
    end

    it "counterattacks when Ice Bolt does not freeze" do
      no_freeze_battle = described_class.new(
        creature: creature,
        random: BattleSequenceRandom.new([99, 0, 99, 0])
      )

      response = no_freeze_battle.cast_spell(player, TextAdventures::Spell.ice_bolt)

      expect(response.to_response.to_text).to eq <<~TEXT.chomp
        You cast Ice Bolt causing 4 of damage.
        Giant Spider attacks you with Bite causing 2 of damage.
      TEXT
      expect(player.health.current).to eq 28
      expect(player.mana.current).to eq 6
    end

    it "does not cast or advance the enemy turn without enough MP" do
      player.spend_mana(12)

      response = battle.cast_spell(player, TextAdventures::Spell.fireball)

      expect(response.to_response.to_text).to eq "Not enough MP to cast Fireball. [MP: 0/12, cost: 5]"
      expect(player.health.current).to eq 30
      expect(creature.health.current).to eq 35
    end

    it "adds combat magic bonus to offensive spell damage" do
      player.gain_skill_xp(:combat_magic, 250)
      battle = described_class.new(
        creature: creature,
        random: BattleSequenceRandom.new([0, 99, 0])
      )

      response = battle.cast_spell(player, TextAdventures::Spell.fireball)

      expect(response.to_response.to_text).to eq <<~TEXT.chomp
        You cast Fireball causing 13 of damage.
        Giant Spider attacks you with Bite causing 2 of damage.
      TEXT
    end

    it "casts Heal to restore player health during battle" do
      healing_battle = described_class.new(
        creature: creature,
        random: BattleSequenceRandom.new([0, 99, 0])
      )
      player.take_damage(12)

      response = healing_battle.cast_spell(player, TextAdventures::Spell.heal)

      expect(response.to_response.to_text).to eq <<~TEXT.chomp
        You cast Heal and recover 10 health.
        Giant Spider attacks you with Bite causing 2 of damage.
      TEXT
      expect(player.health.current).to eq 26
      expect(player.mana.current).to eq 8
    end

    it "adds nature magic bonus to healing spells" do
      player.gain_skill_xp(:nature_magic, 250)
      healing_battle = described_class.new(
        creature: creature,
        random: BattleSequenceRandom.new([0, 99, 0])
      )
      player.take_damage(20)

      response = healing_battle.cast_spell(player, TextAdventures::Spell.heal)

      expect(response.to_response.to_text).to eq <<~TEXT.chomp
        You cast Heal and recover 13 health.
        Giant Spider attacks you with Bite causing 2 of damage.
      TEXT
      expect(player.health.current).to eq 26
    end

    it "casts Cure to remove poison during battle" do
      cure_battle = described_class.new(
        creature: creature,
        random: BattleSequenceRandom.new([0, 99, 0])
      )
      player.apply_status(:poison)

      response = cure_battle.cast_spell(player, TextAdventures::Spell.cure)

      expect(response.to_response.to_text).to eq <<~TEXT.chomp
        Poison deals 2 damage.
        You cast Cure and remove poison.
        Giant Spider attacks you with Bite causing 2 of damage.
      TEXT
      expect(player).to_not be_status(:poison)
      expect(player.health.current).to eq 26
    end

    it "casts Cure to remove every curable player debuff during battle" do
      cure_battle = described_class.new(
        creature: creature,
        random: BattleSequenceRandom.new([0, 99, 0])
      )
      player.apply_status(:poison)
      player.apply_status(:disease)

      response = cure_battle.cast_spell(player, TextAdventures::Spell.cure)

      expect(response.to_response.to_text).to eq <<~TEXT.chomp
        Poison deals 2 damage.
        You cast Cure and remove poison and disease.
        Giant Spider attacks you with Bite causing 2 of damage.
      TEXT
      expect(player).to_not be_status(:poison)
      expect(player).to_not be_status(:disease)
      expect(player.health.current).to eq 26
    end

    it "distributes victory XP by battle contribution" do
      creature = TextAdventures::Creature.new(
        name: "Arcane Dummy",
        health: 30,
        xp_reward: 100,
        attacks: [
          TextAdventures::Creature::Attack.new(name: "Fizzle", damage_range: 0..0)
        ]
      )
      spear = TextAdventures::Item.weapon("Spear", price: 50, attack: 22, weapon_class: :spear)
      player = TextAdventures::Character.new(equipped_weapon: spear)
      battle = described_class.new(creature: creature, random: BattleSequenceRandom.new([99, 0]))

      battle.attack(player)
      response = battle.cast_spell(player, TextAdventures::Spell.fireball)

      expect(response.to_response.to_text).to eq <<~TEXT.chomp
        You cast Fireball causing 12 of damage.
        Arcane Dummy dies.
        [69 XP gained in Spearmanship]
        [31 XP gained in Combat Magic]
      TEXT
      expect(player.skill_experience[:spearmanship]).to eq 69
      expect(player.skill_experience[:combat_magic]).to eq 31
      expect(player.overall_experience).to eq 100
    end
  end
end
