require 'open3'
require 'spec_helper'

RSpec.describe "text_adventures binary" do
  let(:root) { File.expand_path("../..", __dir__) }
  let(:binary) { File.join(root, "bin", "text_adventures") }

  it "runs a playable terminal session through the binary" do
    output, error, status = Open3.capture3(
      binary,
      stdin_data: <<~COMMANDS
        level
        skills
        go blacksmith
        buy iron dagger
        agree
        equip iron dagger
        inventory
        quit
      COMMANDS
    )

    expect(status).to be_success
    expect(error).to eq ""
    expect(output).to include "Welcome to Text Adventures"
    expect(output).to include "Adventurer level 1"
    expect(output).to include "Dagger Mastery: level 1 (0/50 XP)"
    expect(output).to include "You bought Iron Dagger."
    expect(output).to include "Equipped Iron Dagger."
    expect(output).to include "weapon: Iron Dagger (Atk: 12)"
    expect(output).to include "Thanks for playing."
  end

  it "plays a visible dungeon enemy and map loot loop through the binary" do
    output, error, status = Open3.capture3(
      { "TEXT_ADVENTURES_RANDOM_SEED" => "0" },
      binary,
      stdin_data: <<~COMMANDS
        go ruins
        go right
        go right
        go right
        go right
        go right
        go up
        attack
        attack
        attack
        attack
        loot
        look
        quit
      COMMANDS
    )

    lines = output.lines.map(&:chomp)
    after_collection = output.split("You collect the loot.").last

    expect(status).to be_success
    expect(error).to eq ""
    expect(output).to include "You go to Ruins."
    expect(lines).to include "??????##.x..??????"
    expect(lines).to include "??????##...x??????"
    expect(lines).to include "########.E##??????"
    expect(lines).to include "##..........??????"
    expect(lines).to include "########xE##??????"
    expect(output).to include "You see a Giant Spider"
    expect(output).to include "A Giant Spider is about to attack you!"
    expect(output).to include "Giant Spider dies."
    expect(output).to include "[loot dropped]"
    expect(lines).to include "########x@##??????"
    expect(output).to include "You collect the loot."
    expect(output).to include "[1x Tome of Freezing added to inventory]"
    expect(after_collection.lines.map(&:chomp)).to include "########x.##??????"
    expect(output).to include "Thanks for playing."
  end

  it "plays with game mode shortcuts through the binary" do
    output, error, status = Open3.capture3(
      { "TEXT_ADVENTURES_RANDOM_SEED" => "0" },
      binary,
      stdin_data: <<~COMMANDS
        go priest
        buy tome of fireball
        agree
        use tome of fireball
        go town
        go ruins
        game
        d

        i
        l
        c
        1
        text
        quit
      COMMANDS
    )

    expect(status).to be_success
    expect(error).to eq ""
    expect(output).to include "You bought Tome of Fireball."
    expect(output).to include "Studied Tome of Fireball."
    expect(output).to include "Game mode enabled."
    expect(output).to include "Ruins L1 [game] > You move right."
    expect(output).to include "Ruins L1 [game] > There is no enemy to attack."
    expect(output).to include "Currently you have nothing."
    expect(output).to include "There is no loot to collect."
    expect(output).to include "Choose a spell:"
    expect(output).to include " 1 - Fireball"
    expect(output).to include "You know Fireball, but there is no enemy to target."
    expect(output).to include "Text command mode enabled."
    expect(output).to include "Thanks for playing."
  end

  it "renders the terminal screen UI through the binary when enabled" do
    output, error, status = Open3.capture3(
      { "TEXT_ADVENTURES_SCREEN" => "1", "TEXT_ADVENTURES_RANDOM_SEED" => "0" },
      binary,
      stdin_data: <<~COMMANDS
        go ruins
        game
        d
        quit
      COMMANDS
    )

    lines = output.lines.map(&:chomp)

    expect(status).to be_success
    expect(error).to eq ""
    expect(lines).to include "+------------------------------------------------------------------------------+"
    expect(output).to include "Text Adventures - Town of Nee'Peh [text]"
    expect(output).to include "Text Adventures - Ruins L1 [text]"
    expect(output).to include "Text Adventures - Ruins L1 [game]"
    expect(output).to include "              ??????##..x.??????              "
    expect(output).to include "WASD move | Enter attack | c cast | i inventory | l loot | h help | text"
    expect(output).to include "Thanks for playing."
  end
end
