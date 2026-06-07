require 'spec_helper'

RSpec.describe TextAdventures::Response do
  describe ".render" do
    it "renders plain strings unchanged" do
      expect(described_class.render("You are in town.")).to eq "You are in town."
    end

    it "renders structured responses to plain text" do
      response = described_class.new(
        "Welcome to Text Adventures",
        "",
        "You are now on the town of Nee'Peh."
      )

      expect(described_class.render(response)).to eq <<~TEXT.chomp
        Welcome to Text Adventures

        You are now on the town of Nee'Peh.
      TEXT
    end
  end

  describe ".new" do
    it "normalizes lines to strings and skips nil values" do
      response = described_class.new("Gold:", 120, nil)

      expect(response.lines).to eq ["Gold:", "120"]
    end
  end

  describe "#append" do
    it "returns a new response with additional lines" do
      response = described_class.new("You bought Spear.")
      next_response = response.append("[1x Spear added to inventory]")

      expect(response.to_text).to eq "You bought Spear."
      expect(next_response.to_text).to eq <<~TEXT.chomp
        You bought Spear.
        [1x Spear added to inventory]
      TEXT
    end
  end

  describe "#to_s" do
    it "joins lines with newlines" do
      response = described_class.new("Line one", "Line two")

      expect(response.to_s).to eq "Line one\nLine two"
    end
  end
end
