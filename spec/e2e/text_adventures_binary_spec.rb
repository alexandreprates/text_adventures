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

  it "creates the dungeon incrementally when the player crosses a block exit" do
    output, error, status = Open3.capture3(
      { "TEXT_ADVENTURES_RANDOM_SEED" => "0" },
      binary,
      stdin_data: <<~COMMANDS
        go ruins
        go right
        go right
        go right
        quit
      COMMANDS
    )

    lines = output.lines.map(&:chomp)

    expect(status).to be_success
    expect(error).to eq ""
    expect(output).to include "You go to Ruins."
    expect(lines).to include "## x  "
    expect(lines).to include "##   x"
    expect(lines).to include a_string_matching(/\A.{12}\z/)
    expect(lines).to include a_string_matching(/\A.{6}x.{5}\z/)
    expect(output).to include "Thanks for playing."
  end
end
