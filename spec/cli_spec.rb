require 'spec_helper'
require 'stringio'

load File.expand_path("../bin/text_adventures", __dir__)

RSpec.describe TextAdventures::CLI do
  it "runs a terminal game loop until the player quits" do
    input = StringIO.new("inventory\nquit\n")
    output = StringIO.new

    described_class.new(input: input, output: output).run

    text = output.string
    expect(text).to include "Welcome to Text Adventures"
    expect(text).to include "Currently you have nothing."
    expect(text).to include "Thanks for playing."
  end
end
