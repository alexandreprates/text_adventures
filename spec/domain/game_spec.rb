require 'spec_helper'

RSpec.describe TextAdventures::Game do
  class TestScene
    attr_reader :handled_game, :handled_command

    def initialize(response: "handled response")
      @response = response
    end

    def name
      :test_scene
    end

    def handle(game, command)
      @handled_game = game
      @handled_command = command
      response
    end

    private

    attr_reader :response
  end

  describe ".new" do
    subject(:game) { described_class.new }

    it "starts in Town with a player and empty state slots" do
      expect(game.player).to be_a TextAdventures::Character
      expect(game.current_scene_name).to eq :town
      expect(game.pending_confirmation).to be_nil
      expect(game.dungeon).to be_nil
      expect(game.battle).to be_nil
      expect(game.pending_loot).to be_nil
      expect(game.history).to eq []
    end

    it "accepts injected state dependencies" do
      player = TextAdventures::Character.new(name: "Custom")
      scene = TestScene.new
      random = Random.new(1234)
      game = described_class.new(
        player: player,
        current_scene: scene,
        pending_confirmation: :pending,
        dungeon: :dungeon,
        battle: :battle,
        pending_loot: :loot,
        history: [:entry],
        random: random
      )

      expect(game).to have_attributes(
        player: player,
        current_scene: scene,
        current_scene_name: :test_scene,
        pending_confirmation: :pending,
        dungeon: :dungeon,
        battle: :battle,
        pending_loot: :loot,
        history: [:entry],
        random: random
      )
    end
  end

  describe "#handle" do
    it "delegates known commands to the current scene" do
      scene = TestScene.new(response: "scene response")
      game = described_class.new(current_scene: scene)

      response = game.handle("go ruins")

      expect(response).to eq "scene response"
      expect(scene.handled_game).to be game
      expect(scene.handled_command).to have_attributes(verb: :go, target: "ruins")
    end

    it "handles inventory as a global player command" do
      scene = TestScene.new(response: "scene response")
      game = described_class.new(current_scene: scene)
      game.player.inventory.add(TextAdventures::Item.potion("Potion of Heal", price: 10, recovery: 20), quantity: 2)

      response = game.handle("inventory")

      expect(response).to eq <<~TEXT.chomp
        Currently you have:
         2x Potion of Heal (Recovery 20 Health)
        Equipped:
         weapon: Sword (Atk: 10)
         armor: Leather Armor (Def: 20)
      TEXT
      expect(scene.handled_command).to be_nil
    end

    it "renders an explicit empty inventory through the global command" do
      game = described_class.new(current_scene: TestScene.new(response: "scene response"))

      expect(game.handle("inventory")).to include "Currently you have nothing."
    end

    it "handles spellbook as a global player command" do
      scene = TestScene.new(response: "scene response")
      game = described_class.new(current_scene: scene)
      game.player.learn_spell(TextAdventures::Spell.fireball)

      response = game.handle("spellbook")

      expect(response).to eq <<~TEXT.chomp
        You can cast:
         1x Fireball (level 1) - Causes 12~22 of damage
      TEXT
      expect(scene.handled_command).to be_nil
    end

    it "equips an inventory weapon as a global player command" do
      scene = TestScene.new(response: "scene response")
      game = described_class.new(current_scene: scene)
      spear = TextAdventures::Item.weapon("Spear", price: 50, attack: 22)
      game.player.inventory.add(spear)

      response = game.handle("equip spear")

      expect(response).to eq <<~TEXT.chomp
        Equipped Spear.
        [your attack is now 23]
      TEXT
      expect(game.player.equipped_weapon).to eq spear
      expect(scene.handled_command).to be_nil
    end

    it "equips an inventory armor as a global player command" do
      game = described_class.new(current_scene: TestScene.new(response: "scene response"))
      armor = TextAdventures::Item.armor("Iron Armor", price: 40, defense: 35)
      game.player.inventory.add(armor)

      response = game.handle("equip iron armor")

      expect(response).to eq <<~TEXT.chomp
        Equipped Iron Armor.
        [your defense is now 35]
      TEXT
      expect(game.player.equipped_armor).to eq armor
    end

    it "rejects missing or non-equippable inventory items" do
      game = described_class.new(current_scene: TestScene.new(response: "scene response"))
      game.player.inventory.add(TextAdventures::Item.potion("Potion of Heal", price: 10, recovery: 20))

      expect(game.handle("equip sword")).to eq "You do not have sword."
      expect(game.handle("equip potion of heal")).to eq "Potion of Heal cannot be equipped."
    end

    it "uses healing potions and removes them from inventory" do
      game = described_class.new(current_scene: TestScene.new(response: "scene response"))
      potion = TextAdventures::Item.potion("Potion of Heal", price: 10, recovery: 20)
      game.player.inventory.add(potion)
      game.player.take_damage(12)

      response = game.handle("use potion of heal")

      expect(response).to eq <<~TEXT.chomp
        Used Potion of Heal.
        [recovered 12 health]
        [your health is now 30/30]
        [1x Potion of Heal removed from inventory]
      TEXT
      expect(game.player.health.current).to eq 30
      expect(game.player.inventory.quantity("potion of heal")).to eq 0
    end

    it "uses tomes to teach a new spell and consumes them" do
      game = described_class.new(current_scene: TestScene.new(response: "scene response"))
      tome = TextAdventures::Item.tome("Tome of Ice Bolt", price: 25, spell: "Ice Bolt")
      game.player.inventory.add(tome)

      response = game.handle("use tome of ice bolt")

      expect(response).to eq <<~TEXT.chomp
        Studied Tome of Ice Bolt.
        [learned Ice Bolt level 1]
        [1x Tome of Ice Bolt removed from inventory]
      TEXT
      expect(game.player).to be_known_spell("ice bolt")
      expect(game.player.inventory.quantity("tome of ice bolt")).to eq 0
    end

    it "uses tomes to level a known spell and consumes them" do
      game = described_class.new(current_scene: TestScene.new(response: "scene response"))
      tome = TextAdventures::Item.tome("Tome of Ice Bolt", price: 25, spell: "Ice Bolt")
      game.player.learn_spell(TextAdventures::Spell.ice_bolt)
      game.player.inventory.add(tome)

      response = game.handle("use tome of ice bolt")

      expect(response).to eq <<~TEXT.chomp
        Studied Tome of Ice Bolt.
        [Ice Bolt is now level 2]
        [1x Tome of Ice Bolt removed from inventory]
      TEXT
      expect(game.player.spells["ice bolt"]).to have_attributes(level: 2)
      expect(game.player.inventory.quantity("tome of ice bolt")).to eq 0
    end

    it "rejects missing or unusable inventory items" do
      game = described_class.new(current_scene: TestScene.new(response: "scene response"))
      sword = TextAdventures::Item.weapon("Sword", price: 15, attack: 10)
      game.player.inventory.add(sword)

      expect(game.handle("use potion of heal")).to eq "You do not have potion of heal."
      expect(game.handle("use sword")).to eq "Sword cannot be used."
      expect(game.player.inventory.quantity("sword")).to eq 1
    end

    it "drops one carried inventory item" do
      game = described_class.new(current_scene: TestScene.new(response: "scene response"))
      potion = TextAdventures::Item.potion("Potion of Heal", price: 10, recovery: 20)
      game.player.inventory.add(potion, quantity: 2)

      response = game.handle("drop potion of heal")

      expect(response).to eq <<~TEXT.chomp
        Dropped Potion of Heal.
        [1x Potion of Heal removed from inventory]
      TEXT
      expect(game.player.inventory.quantity("potion of heal")).to eq 1
    end

    it "returns a clear message when dropping a missing item" do
      game = described_class.new(current_scene: TestScene.new(response: "scene response"))

      expect(game.handle("drop sword")).to eq "You do not have sword."
    end

    it "protects equipped weapons and armor from being dropped" do
      game = described_class.new(current_scene: TestScene.new(response: "scene response"))
      sword = TextAdventures::Item.weapon("Sword", price: 15, attack: 10)
      armor = TextAdventures::Item.armor("Iron Armor", price: 40, defense: 35)
      game.player.inventory.add(sword)
      game.player.inventory.add(armor)
      game.player.equip(armor)

      expect(game.handle("drop sword")).to eq "You cannot drop equipped Sword."
      expect(game.handle("drop iron armor")).to eq "You cannot drop equipped Iron Armor."
      expect(game.player.inventory.quantity("sword")).to eq 1
      expect(game.player.inventory.quantity("iron armor")).to eq 1
    end

    it "returns parser messages for unknown commands without delegating" do
      scene = TestScene.new(response: "scene response")
      game = described_class.new(current_scene: scene)

      response = game.handle("dance")

      expect(response).to eq "Unknown command: dance."
      expect(scene.handled_command).to be_nil
    end

    it "blocks commands after the player dies" do
      scene = TestScene.new(response: "scene response")
      player = TextAdventures::Character.new
      player.take_damage(player.health.current)
      game = described_class.new(current_scene: scene, player: player)

      response = game.handle("look")

      expect(response).to eq <<~TEXT.chomp
        You cannot continue; Adventurer has fallen.
        Start a new adventure to try again.
      TEXT
      expect(scene.handled_command).to be_nil
    end

    it "records command history" do
      game = described_class.new(current_scene: TestScene.new(response: "done"))

      game.handle("attack")

      expect(game.history).to contain_exactly(
        have_attributes(command: "attack", response: "done")
      )
    end

    it "keeps responses deterministic when a random source is injected" do
      random = Random.new(123)
      scene = Class.new do
        def name
          :random_scene
        end

        def handle(game, _command)
          "roll #{game.random.rand(10)}"
        end
      end.new

      game = described_class.new(current_scene: scene, random: random)

      expect(game.handle("attack")).to eq "roll 2"
      expect(game.handle("attack")).to eq "roll 2"
    end
  end

  describe TextAdventures::Scenes::Town do
    subject(:scene) { described_class.new }

    it "has the Town scene name" do
      expect(scene.name).to eq :town
    end

    it "renders a minimal town look response" do
      game = TextAdventures::Game.new(current_scene: scene)

      expect(game.handle("look")).to include("Welcome to Text Adventures")
      expect(game.handle("look")).to include("town of Nee'Peh")
    end
  end
end
