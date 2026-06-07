require 'open3'
require 'spec_helper'

RSpec.describe TextAdventures do
  let(:root) { File.expand_path("..", __dir__) }

  it "defines the project source directories in load order" do
    expect(described_class::SOURCE_DIRECTORIES).to eq %w[
      core_exten
      domain
      commands
      scenes
      ui
      persistence
      web
    ]
  end

  it "keeps source directories available for upcoming implementation areas" do
    described_class::SOURCE_DIRECTORIES.each do |directory|
      expect(Dir.exist?(File.join(root, "lib", directory))).to be true
    end
  end

  it "loads existing project files through the entrypoint" do
    expect(defined?(Extent)).to eq "constant"
  end

  it "can be required directly by a plain Ruby process" do
    command = [
      RbConfig.ruby,
      "-I#{root}",
      "-e",
      "require './lib/text_adventures'; puts defined?(TextAdventures); puts defined?(Extent)"
    ]

    stdout, stderr, status = Open3.capture3(*command, chdir: root)

    expect(status).to be_success, stderr
    expect(stdout.lines.map(&:strip)).to eq ["constant", "constant"]
  end
end
