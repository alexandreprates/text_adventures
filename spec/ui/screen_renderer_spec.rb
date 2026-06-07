require 'spec_helper'

RSpec.describe TextAdventures::UI::ScreenRenderer do
  subject(:renderer) { described_class.new }

  def strip_ansi(value)
    value.gsub(/\e\[[0-9;]*m/, "")
  end

  describe "constants" do
    it "defines the target terminal layout dimensions" do
      expect(described_class::DEFAULT_WIDTH).to eq 80
      expect(described_class::HEADER_INNER_WIDTH).to eq 78
      expect(described_class::LEFT_PANEL_WIDTH).to eq 46
      expect(described_class::RIGHT_PANEL_WIDTH).to eq 31
      expect(described_class::MAIN_PANEL_HEIGHT).to eq 17
      expect(described_class::LOG_HEIGHT).to eq 5
    end
  end

  describe "#truncate" do
    it "keeps text that already fits" do
      expect(renderer.truncate("Ruins", 10)).to eq "Ruins"
    end

    it "truncates long text with an ellipsis" do
      expect(renderer.truncate("Giant Spider Queen", 12)).to eq "Giant Spi..."
    end

    it "handles very small widths" do
      expect(renderer.truncate("abcdef", 2)).to eq ".."
      expect(renderer.truncate("abcdef", 0)).to eq ""
    end
  end

  describe "#pad" do
    it "pads text to a fixed width" do
      expect(renderer.pad("HP", 5)).to eq "HP   "
    end

    it "supports right and center alignment" do
      expect(renderer.pad("HP", 5, align: :right)).to eq "   HP"
      expect(renderer.pad("HP", 6, align: :center)).to eq "  HP  "
    end
  end

  describe "#bar" do
    it "renders a fixed-width proportional bar" do
      expect(renderer.bar(26, 30, width: 10)).to eq "[#########-]"
    end

    it "clamps values outside the valid range" do
      expect(renderer.bar(-5, 30, width: 10)).to eq "[----------]"
      expect(renderer.bar(99, 30, width: 10)).to eq "[##########]"
    end
  end

  describe "#box" do
    it "renders a fixed-width box with padded body lines" do
      box = renderer.box(["Ruins", "HP 26/30"], width: 20, height: 3, title: "Status")

      expect(box).to eq [
        "+ Status ----------+",
        "|Ruins             |",
        "|HP 26/30          |",
        "|                  |",
        "+------------------+"
      ]
      expect(box.map(&:length)).to all eq 20
    end

    it "truncates long body lines without breaking the border" do
      box = renderer.box(["Giant Spider Queen blocks the corridor"], width: 20)

      expect(box[1]).to eq "|Giant Spider Qu...|"
      expect(box.map(&:length)).to all eq 20
    end
  end

  describe "#columns" do
    it "combines two fixed-width columns with a separator" do
      rows = renderer.columns(["map"], ["sidebar"], left_width: 6, right_width: 8, height: 3)

      expect(rows).to eq [
        "map   |sidebar ",
        "      |        ",
        "      |        "
      ]
      expect(rows.map(&:length)).to all eq 15
    end
  end

  describe "#center_lines" do
    it "centers lines horizontally and vertically inside a fixed region" do
      rows = renderer.center_lines(["##x"], width: 7, height: 3)

      expect(rows).to eq [
        "       ",
        "  ##x  ",
        "       "
      ]
    end
  end

  describe "#render" do
    it "renders a fixed-width town screen from game state" do
      game = TextAdventures::Game.new
      game.handle("look")

      lines = renderer.render(game).lines.map(&:chomp)

      expect(lines.map(&:length)).to all eq 80
      expect(lines[1]).to include "Text Adventures - Town of Nee'Peh [text]"
      expect(lines.join("\n")).to include "Places"
      expect(lines.join("\n")).to include "Adventurer"
      expect(lines.join("\n")).to include "go <place> | inventory | spellbook | level | skills | game | help"
    end

    it "renders the ruins viewport centered in the left panel" do
      game = TextAdventures::Game.new(random: Random.new(0))
      game.handle("go ruins")

      lines = renderer.render(game).lines.map(&:chomp)

      expect(lines.map(&:length)).to all eq 80
      expect(lines[1]).to include "Text Adventures - Ruins L1 [text]"
      expect(lines.join("\n")).to include "              ??????##.x..??????              "
      expect(lines.join("\n")).to include "Adjacent"
      expect(lines.join("\n")).to include "go <dir> | attack | cast <spell> | inventory | loot | help | game"
    end

    it "filters dungeon map rows out of the bounded message log" do
      game = TextAdventures::Game.new(random: Random.new(0))
      game.handle("go ruins")
      game.handle("go right")

      log_section = renderer.render(game).lines.map(&:chomp)[21, 5]

      expect(log_section.join("\n")).to include "You move right."
      expect(log_section).to_not include "|??????????????????                                                            |"
    end

    it "filters command list rows out of the bounded message log" do
      game = TextAdventures::Game.new(random: Random.new(0))
      game.handle("go ruins")

      log_section = renderer.render(game).lines.map(&:chomp)[21, 5].join("\n")

      expect(log_section).to include "You go to Ruins."
      expect(log_section).to_not include "attack - to attack an enemy"
    end

    it "filters help menu rows out of the bounded message log" do
      game = TextAdventures::Game.new
      game.handle("help")

      log_section = renderer.render(game).lines.map(&:chomp)[21, 5].join("\n")

      expect(log_section).to include "Town help"
      expect(log_section).to_not include " go Ruins"
      expect(log_section).to_not include "level - show overall level and XP"
      expect(log_section).to_not include "Global commands:"
      expect(log_section).to_not include "You can:"
    end

    it "renders context-aware game mode controls outside the ruins" do
      game = TextAdventures::Game.new
      game.handle("game")

      lines = renderer.render(game).lines.map(&:chomp)

      expect(lines[1]).to include "Text Adventures - Town of Nee'Peh [game]"
      expect(lines.join("\n")).to include "i inventory | c cast | h help | text | type travel/shop commands normally"
      expect(lines.join("\n")).to_not include "WASD move"
    end

    it "renders dungeon game mode controls in the ruins" do
      game = TextAdventures::Game.new
      game.handle("go ruins")
      game.handle("game")

      lines = renderer.render(game).lines.map(&:chomp)

      expect(lines[1]).to include "Text Adventures - Ruins L1 [game]"
      expect(lines.join("\n")).to include "WASD move | Enter attack | c cast | i inventory | l loot | h help | text"
    end

    it "keeps active enemy HP visible in the ruins sidebar" do
      game = TextAdventures::Game.new(random: Random.new(0))
      game.handle("go ruins")
      game.dungeon.place_enemy(TextAdventures::Dungeon::Position.new(x: 4, y: 2), "giant_spider")
      game.handle("look")

      screen = renderer.render(game)

      expect(screen).to include "Enemy"
      expect(screen).to include "Giant Spider"
      expect(screen).to include "HP [##########] 35/35"
    end

    it "renders useful town sublocation commands in the left panel" do
      game = TextAdventures::Game.new
      game.handle("go blacksmith")

      screen = renderer.render(game)

      expect(screen).to include "Blacksmith"
      expect(screen).to include "Weapons"
      expect(screen).to include " buy <weapon>"
      expect(screen).to include " sell <weapon>"
    end

    it "renders an inventory screen after inventory commands" do
      game = TextAdventures::Game.new
      game.player.inventory.add(TextAdventures::Item.potion("Potion of Heal", price: 10, recovery: 20))
      game.handle("inventory")

      lines = renderer.render(game).lines.map(&:chomp)
      screen = lines.join("\n")

      expect(lines.map(&:length)).to all eq 80
      expect(lines[1]).to include "Text Adventures - Town of Nee'Peh [text] - Inventory"
      expect(screen).to include "Equipped"
      expect(screen).to include "Bag"
      expect(screen).to include "1 1x Potion of Heal"
      expect(screen).to include "Skills"
      expect(screen).to include "use/equip/drop <item> | h help | continue with any command"
    end

    it "renders a cast selection screen while game mode spell selection is pending" do
      game = TextAdventures::Game.new
      game.player.learn_spell(TextAdventures::Spell.fireball)
      game.handle("game")
      game.handle("c")

      lines = renderer.render(game).lines.map(&:chomp)
      screen = lines.join("\n")

      expect(lines.map(&:length)).to all eq 80
      expect(lines[1]).to include "Text Adventures - Town of Nee'Peh [game] - Cast Spell"
      expect(screen).to include "Choose a spell"
      expect(screen).to include "1 Fireball"
      expect(screen).to include "Causes 12~22 of damage"
      expect(screen).to include "0 Cancel"
      expect(screen).to include "1-9 cast | 0 cancel"
    end

    it "does not emit ANSI colors by default" do
      game = TextAdventures::Game.new

      expect(renderer.render(game)).to_not include "\e["
    end

    it "can render optional ANSI colors without changing visual width" do
      color_renderer = described_class.new(color: true)
      game = TextAdventures::Game.new

      colored_lines = color_renderer.render(game).lines.map(&:chomp)
      visible_lines = colored_lines.map { |line| strip_ansi(line) }

      expect(color_renderer.render(game)).to include "\e["
      expect(visible_lines.map(&:length)).to all eq 80
    end
  end
end
