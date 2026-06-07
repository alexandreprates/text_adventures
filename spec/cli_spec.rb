require 'spec_helper'
require 'stringio'

load File.expand_path("../bin/text_adventures", __dir__)

RSpec.describe TextAdventures::CLI do
  class FakeLineReader
    attr_reader :prompts

    def initialize(commands)
      @commands = commands
      @prompts = []
    end

    def call(prompt)
      prompts << prompt
      @commands.shift
    end
  end

  class FakeScreenRenderer
    attr_reader :rendered_scenes

    def initialize
      @rendered_scenes = []
    end

    def render(game)
      rendered_scenes << game.current_scene_name
      "[screen: #{game.current_scene_name}]"
    end
  end

  it "runs a terminal game loop until the player quits" do
    input = StringIO.new("inventory\nquit\n")
    output = StringIO.new

    described_class.new(input: input, output: output, screen_renderer: nil).run

    text = output.string
    expect(text).to include "Welcome to Text Adventures"
    expect(text).to include "Town > "
    expect(text).to include "Currently you have nothing."
    expect(text).to include "Thanks for playing."
  end

  it "updates the prompt with the current scene" do
    input = StringIO.new("go ruins\nquit\n")
    output = StringIO.new

    described_class.new(input: input, output: output, screen_renderer: nil).run

    expect(output.string).to include "Town > You go to Ruins."
    expect(output.string).to include "Ruins L1 > "
  end

  it "uses an interactive line reader with scene prompts when available" do
    output = StringIO.new
    line_reader = FakeLineReader.new(["go ruins", "quit"])

    described_class.new(output: output, line_reader: line_reader, screen_renderer: nil).run

    expect(line_reader.prompts).to eq [
      "\nTown > ",
      "\nRuins L1 > "
    ]
    expect(output.string).to include "You go to Ruins."
    expect(output.string).to include "Thanks for playing."
  end

  it "marks the prompt when game mode is active" do
    output = StringIO.new
    line_reader = FakeLineReader.new(["game", "quit"])

    described_class.new(output: output, line_reader: line_reader, screen_renderer: nil).run

    expect(line_reader.prompts).to eq [
      "\nTown > ",
      "\nTown [game] > "
    ]
    expect(output.string).to include "Game mode enabled."
  end

  it "can render command responses through a screen renderer" do
    input = StringIO.new("go ruins\nquit\n")
    output = StringIO.new
    screen_renderer = FakeScreenRenderer.new

    described_class.new(input: input, output: output, screen_renderer: screen_renderer).run

    expect(output.string).to include "[screen: town]"
    expect(output.string).to include "[screen: ruins]"
    expect(output.string).to_not include "Welcome to Text Adventures"
    expect(screen_renderer.rendered_scenes).to eq %i[town ruins]
  end
end
