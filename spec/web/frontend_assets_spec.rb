require 'spec_helper'

RSpec.describe "Frontend assets" do
  let(:root) { File.expand_path("../..", __dir__) }
  let(:public_root) { File.join(root, "public") }

  it "checks in the HTML, CSS, and JavaScript frontend files" do
    expect(File).to exist(File.join(public_root, "index.html"))
    expect(File).to exist(File.join(public_root, "styles.css"))
    expect(File).to exist(File.join(public_root, "app.js"))
  end

  it "wires the frontend to the JSON API endpoints" do
    html = File.read(File.join(public_root, "index.html"))
    javascript = File.read(File.join(public_root, "app.js"))

    expect(html).to include('<link rel="stylesheet" href="/styles.css">')
    expect(html).to include('<script src="/app.js"></script>')
    expect(javascript).to include('fetch("/games"')
    expect(javascript).to include('fetch(`/games/${this.gameId}/commands`')
    expect(javascript).to include('state.scene === "ruins" && state.dungeon?.map?.length')
    expect(javascript).to include('state.dungeon.map.join("\\n")')
    expect(javascript).to include('function isLoggableLine(line)')
    expect(javascript).to include('function quickCommandsFor(state)')
    expect(javascript).to include('function ruinsCommands(state)')
    expect(javascript).to include('function inputModeCommand(state)')
    expect(javascript).to include('selectTab("inventory")')
    expect(javascript).to include('function selectTab(name)')
    expect(javascript).to include('state.dungeon?.nearby_loot')
    expect(javascript).to include('Cast ${firstDamageSpell.display_name}')
    expect(javascript).to include('state.pending?.confirmation')
    expect(javascript).to include('function suggestedItemCommands(player)')
    expect(javascript).to include('equippedNames.includes(item.name)')
    expect(javascript).to include('function updateCommandPlaceholder(state)')
    expect(javascript).to include('locationPanels')
    expect(javascript).to include('/^[?#.xE@]+$/')
  end
end
