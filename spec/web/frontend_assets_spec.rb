require 'spec_helper'

RSpec.describe "Frontend assets" do
  let(:root) { File.expand_path("../..", __dir__) }
  let(:frontend_root) { File.join(root, "frontend") }
  let(:public_root) { File.join(frontend_root, "public") }
  let(:source_root) { File.join(frontend_root, "src") }

  it "checks in the Vite React entrypoints, typed renderer, and game assets" do
    expect(File).to exist(File.join(frontend_root, "index.html"))
    expect(File).to exist(File.join(frontend_root, "package.json"))
    expect(File).to exist(File.join(frontend_root, "vite.config.ts"))
    expect(File).to exist(File.join(frontend_root, "nginx.conf"))
    expect(File).to exist(File.join(source_root, "main.tsx"))
    expect(File).to exist(File.join(source_root, "App.tsx"))
    expect(File).to exist(File.join(source_root, "App.css"))
    expect(File).to exist(File.join(source_root, "index.css"))
    expect(File).not_to exist(File.join(public_root, "map_renderer.js"))
    expect(File).to exist(File.join(source_root, "game/isometric/IsometricDungeonRenderer.ts"))
    expect(File).to exist(File.join(public_root, "assets/isometric/tiles/floor.png"))
    expect(File).to exist(File.join(public_root, "assets/isometric/tiles/wall.png"))
    expect(File).to exist(File.join(public_root, "assets/isometric/actors/adventurer-actions.png"))
    expect(File).to exist(File.join(public_root, "assets/isometric/actors/duelist-walk.png"))
    expect(File).to exist(File.join(public_root, "assets/isometric/actors/duelist-attack.png"))
    expect(File).to exist(File.join(public_root, "assets/isometric/actors/dragoon-walk.png"))
    expect(File).to exist(File.join(public_root, "assets/isometric/actors/dragoon-attack.png"))
    expect(File).to exist(File.join(public_root, "assets/isometric/actors/nightblade-walk.png"))
    expect(File).to exist(File.join(public_root, "assets/isometric/actors/nightblade-attack.png"))
    expect(File).to exist(File.join(public_root, "assets/isometric/enemies/goblin-actions.png"))
    expect(File).to exist(File.join(public_root, "assets/isometric/enemies/skeleton-actions.png"))
    expect(File).to exist(File.join(public_root, "assets/isometric/props/chest-actions.png"))
    expect(File).to exist(File.join(public_root, "assets/isometric/props/torch-loop.png"))
    expect(File).to exist(File.join(public_root, "assets/isometric/props/torch-loop-right.png"))
    expect(File).to exist(File.join(public_root, "assets/isometric/props/portal.png"))
    expect(File).to exist(File.join(public_root, "assets/isometric/props/stairs-down.png"))
    expect(File).to exist(File.join(public_root, "assets/isometric/effects/slash.png"))
    expect(File).to exist(File.join(public_root, "assets/isometric/effects/magic.png"))
    expect(File).to exist(File.join(public_root, "assets/tilesets/original-dungeon-tileset.png"))
    expect(File).to exist(File.join(public_root, "assets/locations/village-hub.png"))
    expect(File).to exist(File.join(public_root, "assets/locations/tavern-interior.png"))
    expect(File).to exist(File.join(public_root, "assets/locations/merchant-district.png"))
    expect(File).to exist(File.join(public_root, "assets/locations/blacksmith-workshop.png"))
    expect(File).to exist(File.join(public_root, "assets/locations/armorsmith-shop.png"))
    expect(File).to exist(File.join(public_root, "assets/locations/temple-sanctuary.png"))
    expect(File).to exist(File.join(public_root, "assets/figma/dungeon-terminal-reference.png"))
    expect(File).to exist(File.join(public_root, "assets/atlas/class/Adventurer.png"))
    expect(File).to exist(File.join(public_root, "assets/atlas/class/Blademaster.png"))
    expect(File).to exist(File.join(public_root, "assets/atlas/class/Dragoon.png"))
    expect(File).to exist(File.join(public_root, "assets/atlas/class/Nightblade.png"))
    expect(File).to exist(File.join(public_root, "assets/atlas/class/Arcanist.png"))
    expect(File).to exist(File.join(public_root, "assets/atlas/class/Warlord.png"))
    expect(File).to exist(File.join(public_root, "assets/atlas/class/Duelist.png"))
    expect(File).to exist(File.join(public_root, "assets/atlas/class/Mystic.png"))
    expect(File).to exist(File.join(public_root, "assets/atlas/class/Spellblade.png"))
    expect(File).to exist(File.join(public_root, "assets/atlas/class/Warden.png"))
    expect(File).to exist(File.join(public_root, "assets/atlas/class/Skirmisher.png"))
    expect(File).to exist(File.join(public_root, "assets/atlas/class/Battlemage.png"))
    expect(File).to exist(File.join(public_root, "assets/atlas/class/Sentinel.png"))
    expect(File).to exist(File.join(public_root, "assets/atlas/class/Hexblade.png"))
    expect(File).to exist(File.join(public_root, "assets/atlas/class/Ranger.png"))
    expect(File).not_to exist(File.join(public_root, "assets/classes"))
    expect(File).not_to exist(File.join(public_root, "app.js"))
    expect(File).not_to exist(File.join(public_root, "styles.css"))
  end

  it "checks in the generated Adventurer class atlas" do
    sheet = File.binread(File.join(public_root, "assets/atlas/class/Adventurer.png"), 33)

    expect(sheet.byteslice(0, 8)).to eq("\x89PNG\r\n\x1A\n".b)
    expect(sheet.byteslice(16, 8).unpack("NN")).to eq([874, 1799])
    expect(sheet.byteslice(24, 2).unpack("CC")).to eq([8, 6])
  end

  it "checks in normalized directional class animation sheets" do
    %w[
      adventurer-walk.png
      adventurer-attack.png
      druid-walk.png
      druid-attack.png
      duelist-walk.png
      duelist-attack.png
      dragoon-walk.png
      dragoon-attack.png
      nightblade-walk.png
      nightblade-attack.png
      arcanist-walk.png
      arcanist-attack.png
      spellblade-walk.png
      spellblade-attack.png
      warden-walk.png
      warden-attack.png
      skirmisher-walk.png
      skirmisher-attack.png
      battlemage-walk.png
      battlemage-attack.png
      sentinel-walk.png
      sentinel-attack.png
      hexblade-walk.png
      hexblade-attack.png
      ranger-walk.png
      ranger-attack.png
      mystic-walk.png
      mystic-attack.png
    ].each do |filename|
      sheet = File.binread(File.join(public_root, "assets/isometric/actors", filename), 33)

      expect(sheet.byteslice(0, 8)).to eq("\x89PNG\r\n\x1A\n".b)
      expect(sheet.byteslice(16, 8).unpack("NN")).to eq([384, 384])
      expect(sheet.byteslice(24, 2).unpack("CC")).to eq([8, 6])
    end
  end

  it "checks in normalized enemy attack and death animation sheets" do
    %w[
      giant_spider-attack.png
      giant_spider-death.png
      orc_raider-attack.png
      orc_raider-death.png
      orc_berserker-attack.png
      orc_berserker-death.png
      kobold_trapper-attack.png
      kobold_trapper-death.png
      kobold_sparkmage-attack.png
      kobold_sparkmage-death.png
      gnoll_hunter-attack.png
      gnoll_hunter-death.png
      gnoll_bonecaller-attack.png
      gnoll_bonecaller-death.png
      wight_knight-attack.png
      wight_knight-death.png
      ghoul_stalker-attack.png
      ghoul_stalker-death.png
      zombie_brute-attack.png
      zombie_brute-death.png
      shadow_imp-attack.png
      shadow_imp-death.png
      brimstone_imp-attack.png
      brimstone_imp-death.png
      lesser_demon-attack.png
      lesser_demon-death.png
      forest_sprite-attack.png
      forest_sprite-death.png
      pixie_trickster-attack.png
      pixie_trickster-death.png
      satyr_duelist-attack.png
      satyr_duelist-death.png
      dryad_thornweaver-attack.png
      dryad_thornweaver-death.png
      fae_blade_dancer-attack.png
      fae_blade_dancer-death.png
    ].each do |filename|
      sheet = File.binread(File.join(public_root, "assets/isometric/enemies", filename), 33)

      expect(sheet.byteslice(0, 8)).to eq("\x89PNG\r\n\x1A\n".b)
      expect(sheet.byteslice(16, 8).unpack("NN")).to eq([256, 256])
      expect(sheet.byteslice(24, 2).unpack("CC")).to eq([8, 6])
    end
  end

  it "wires the React frontend to game API, WebSocket, and modular panels" do
    html = File.read(File.join(frontend_root, "index.html"))
    app = File.read(File.join(source_root, "App.tsx"))
    session_hook = File.read(File.join(source_root, "hooks/useGameSession.ts"))
    auto_explore_hook = File.read(File.join(source_root, "hooks/useAutoExplore.ts"))
    api = File.read(File.join(source_root, "lib/gameApi.ts"))
    commands = File.read(File.join(source_root, "lib/commands.ts"))
    shell = File.read(File.join(source_root, "components/game/GameShell.tsx"))
    command_panel = File.read(File.join(source_root, "components/game/CommandPanel.tsx"))
    map_panel = File.read(File.join(source_root, "components/game/MapPanel.tsx"))
    trade_overlay = File.read(File.join(source_root, "components/game/TradeOverlay.tsx"))
    vite_config = File.read(File.join(frontend_root, "vite.config.ts"))
    dockerfile = File.read(File.join(root, "Dockerfile"))

    expect(html).not_to include('/map_renderer.js')
    expect(html).to include('<script type="module" src="/src/main.tsx"></script>')
    expect(html).to include('<title>Text Adventures</title>')
    expect(app).to include('useGameSession()')
    expect(app).to include('useAutoExplore({')
    expect(app).to include('actionFromCommand(normalized)')
    expect(app).to include('isShopCommand(normalized)')
    expect(app).to include('manualAutoExploreGoal(normalized')
    expect(app).to include('autoCompatibleManualCommand(normalized)')
    expect(app).to include('setPlayerDirection(nextDirection)')
    expect(shell).to include('<CharacterPanel state={state} />')
    expect(shell).to include('<MapPanel')
    expect(shell).to include('<CollectionPanel')
    expect(shell).to include('<CommandPanel')
    expect(shell).to include('<CommandBar')
    expect(shell).to include('<TradeOverlay')
    expect(api).to include('fetch("/api/games"')
    expect(api).to include('fetch(`/api/games/${encodeURIComponent(gameId)}`)')
    expect(api).to include('fetch(`/api/games/${encodeURIComponent(gameId)}/actions`')
    expect(api).to include('socketUrl(gameId: string)')
    expect(session_hook).to include('new WebSocket(socketUrl(gameId))')
    expect(session_hook).to include('socketActionPayload(action)')
    expect(session_hook).to include('socketPingPayload()')
    expect(session_hook).to include('parseSocketMessage(String(event.data))')
    expect(session_hook).to include('mergeStatePatch(stateRef.current, message.patch)')
    expect(session_hook).to include('executeAction(gameId, action)')
    expect(session_hook).to include('rememberGameId(nextGameId)')
    expect(commands).to include('quickCommandsFor(state: GameState | null)')
    expect(commands).to include('manualAutoExploreGoal(')
    expect(commands).to include('autoCompatibleManualCommand(')
    expect(commands).to include('{ label: "Attack", command: "attack", kind: "primary" }')
    expect(commands).to include('{ label: "Shop", command: "shop", kind: "primary" }')
    expect(auto_explore_hook).to include('AUTO_EXPLORE_MEMORY_KEY_PREFIX')
    expect(auto_explore_hook).to include('shortestAutoExplorePath(')
    expect(auto_explore_hook).to include('nextAutoExploreGoalDecision()')
    expect(auto_explore_hook).to include('autoExploreHealingAction()')
    expect(command_panel).to include('autoExploreCommands()')
    expect(command_panel).to include('Auto speed')
    expect(command_panel).to include('autoExplore.setGoal(autoGoalFromCommand(command.command))')
    expect(map_panel).to include('new IsometricDungeonRenderer(canvasRef.current)')
    expect(map_panel).to include('rendererRef.current.render(viewport')
    expect(map_panel).to include('rendererRef.current?.play(events)')
    expect(map_panel).to include('useReducedMotion()')
    expect(map_panel).to include('Loading isometric dungeon')
    expect(map_panel).to include('textRowsFromViewport(viewport)')
    expect(map_panel).to include('Revive in Town')
    expect(map_panel).to include('New Game')
    expect(trade_overlay).to include('type: "trade"')
    expect(trade_overlay).to include('tradePayload(prunedSelections.buy)')
    expect(trade_overlay).to include('Sell all junk')
    expect(vite_config).to include("'/api'")
    expect(vite_config).to include("target: 'http://127.0.0.1:4567'")
    expect(vite_config).to include("'/ws'")
    expect(vite_config).to include('ws: true')
    expect(dockerfile).to include('FROM node:alpine AS frontend-build')
    expect(dockerfile).to include('RUN pnpm build')
    expect(dockerfile).to include('COPY --from=frontend-build /text_adventures/frontend/dist /usr/share/nginx/html')
    expect(api).not_to include('/commands')
  end
end
