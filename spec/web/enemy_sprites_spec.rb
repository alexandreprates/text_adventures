require 'json'
require 'yaml'

RSpec.describe "Enemy sprites" do
  let(:root) { File.expand_path("../..", __dir__) }
  let(:public_root) { File.join(root, "public") }
  let(:manifest_path) { File.join(public_root, "assets/enemies/enemies.json") }
  let(:creatures_path) { File.join(root, "data/creatures.yml") }

  it "registers completed sprites for known creatures with checked-in assets" do
    manifest = JSON.parse(File.read(manifest_path))
    creatures = YAML.safe_load_file(creatures_path).fetch("creatures")

    expect(manifest).to include("giant_spider")
    expect(manifest.keys - creatures.keys).to be_empty

    manifest.each do |creature_id, entry|
      expect(entry.fetch("name")).to eq(creatures.fetch(creature_id).fetch("name"))
      expect(File).to exist(File.join(public_root, entry.fetch("sprite").delete_prefix("/")))
      expect(File).to exist(File.join(public_root, entry.fetch("source").delete_prefix("/")))
    end
  end
end
