require 'spec_helper'

RSpec.describe TextAdventures::Web::ResponseEvents do
  it "converts response lines into typed text events" do
    events = described_class.call(<<~TEXT)
      You move right.
      You descend deeper into the ruins.
      You go to Ruins.
      You attack a Giant Spider causing 10 of damage.
      You cast Fireball causing 13 of damage.
      Giant Spider attacks you with fangs causing 2 of damage.
      Equipped Iron Armor.
      Unknown command: dance.
    TEXT

    expect(events).to include(
      hash_including(
        type: "movement",
        sequence: 0,
        actor: "player",
        action: "move",
        facing: "right",
        outcome: "success",
        duration_ms: 300
      ),
      hash_including(
        type: "combat.damage",
        sequence: 3,
        actor: "player",
        target: "enemy",
        action: "attack",
        effect: "slash",
        outcome: "hit",
        duration_ms: 520
      ),
      hash_including(
        type: "combat.damage",
        sequence: 4,
        actor: "player",
        target: "enemy",
        action: "cast",
        effect: "magic"
      ),
      hash_including(
        type: "combat.damage",
        sequence: 5,
        actor: "enemy",
        target: "player",
        action: "attack"
      ),
      hash_including(type: "error.invalid_action", sequence: 7, outcome: "rejected")
    )
    expect(events.map { |event| event.fetch(:text) }).to eq [
      "You move right.",
      "You descend deeper into the ruins.",
      "You go to Ruins.",
      "You attack a Giant Spider causing 10 of damage.",
      "You cast Fireball causing 13 of damage.",
      "Giant Spider attacks you with fangs causing 2 of damage.",
      "Equipped Iron Armor.",
      "Unknown command: dance."
    ]
  end

  it "skips blank lines and keeps unclassified text as message events" do
    events = described_class.call("Welcome to Text Adventures\n\nWhat will you do now?")

    expect(events).to eq [
      { type: "message", text: "Welcome to Text Adventures", sequence: 0, actor: "world", action: "message" },
      { type: "message", text: "What will you do now?", sequence: 1, actor: "world", action: "message" }
    ]
  end

  it "skips map rows, section headings, command affordances, and map legends" do
    events = described_class.call(<<~TEXT)
      Ruins Level 2
      ??????
      ##.xE@
      Here you can:
       go <up|right|down|left> - to move around
       attack - to attack an enemy
      Movement:
       P - entrance portal
       ? - unrevealed area
      You descend deeper into the ruins.
    TEXT

    expect(events).to eq [
      {
        type: "movement",
        text: "You descend deeper into the ruins.",
        sequence: 0,
        actor: "player",
        action: "descend",
        outcome: "success",
        duration_ms: 300
      }
    ]
  end

  it "includes movement coordinates supplied by the web transport" do
    events = described_class.call(
      "You move down.",
      context: {
        action: { "type" => "move", "direction" => "down" },
        from: { x: 3, y: 2 },
        to: { x: 3, y: 3 }
      }
    )

    expect(events.first).to include(
      facing: "down",
      from: { x: 3, y: 2 },
      to: { x: 3, y: 3 }
    )
  end
end
