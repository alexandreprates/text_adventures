require 'spec_helper'

RSpec.describe TextAdventures::Web::ResponseEvents do
  it "converts response lines into typed text events" do
    events = described_class.call(<<~TEXT)
      You move right.
      You go to Ruins.
      You attack a Giant Spider causing 10 of damage.
      Giant Spider attacks you with fangs causing 2 of damage.
      Equipped Iron Armor.
      Unknown command: dance.
    TEXT

    expect(events).to eq [
      { type: "movement", text: "You move right." },
      { type: "travel.changed_scene", text: "You go to Ruins." },
      { type: "combat.damage", text: "You attack a Giant Spider causing 10 of damage." },
      { type: "combat.damage", text: "Giant Spider attacks you with fangs causing 2 of damage." },
      { type: "inventory.equipped", text: "Equipped Iron Armor." },
      { type: "error.invalid_action", text: "Unknown command: dance." }
    ]
  end

  it "skips blank lines and keeps unclassified text as message events" do
    events = described_class.call("Welcome to Text Adventures\n\nWhat will you do now?")

    expect(events).to eq [
      { type: "message", text: "Welcome to Text Adventures" },
      { type: "message", text: "What will you do now?" }
    ]
  end
end
