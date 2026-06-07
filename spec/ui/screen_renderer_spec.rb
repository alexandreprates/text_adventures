require 'spec_helper'

RSpec.describe TextAdventures::UI::ScreenRenderer do
  subject(:renderer) { described_class.new }

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
end
