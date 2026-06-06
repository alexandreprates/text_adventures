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

    it "returns parser messages for unknown commands without delegating" do
      scene = TestScene.new(response: "scene response")
      game = described_class.new(current_scene: scene)

      response = game.handle("dance")

      expect(response).to eq "Unknown command: dance."
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
