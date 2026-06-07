require 'bundler'
require 'spec_helper'

RSpec.describe "Project dependency setup" do
  let(:root) { File.expand_path("..", __dir__) }

  it "keeps Bundler local install artifacts ignored" do
    gitignore = File.read(File.join(root, ".gitignore"))

    expect(gitignore).to include(".bundle/")
    expect(gitignore).to include("vendor/bundle/")
  end

  it "checks in a lockfile for the declared dependencies" do
    lockfile = File.read(File.join(root, "Gemfile.lock"))
    parser = Bundler::LockfileParser.new(lockfile)

    expect(parser.dependencies.keys).to contain_exactly("rake", "rspec")
    expect(parser.specs.map(&:name)).to include("rake", "rspec")
  end
end
