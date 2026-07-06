import { useCallback, useState } from "react";
import { GameShell } from "./components/game/GameShell";
import { PlatformerFrontendMockup } from "./components/game/PlatformerFrontendMockup";
import { useAutoExplore } from "./hooks/useAutoExplore";
import {
  actionFromCommand,
  autoCompatibleManualCommand,
  commandUpdatesFacing,
  isNewGameCommand,
  isShopCommand,
  manualAutoExploreGoal,
} from "./lib/commands";
import type { CollectionTab, GameAction } from "./lib/types";
import { useGameSession } from "./hooks/useGameSession";
import "./App.css";

const initialMapZoom = 1;

function App() {
  const mockup = new URLSearchParams(window.location.search).get("mockup");

  if (mockup === "platformer") {
    return <PlatformerFrontendMockup />;
  }

  return <PlayableGame />;
}

function PlayableGame() {
  const session = useGameSession();
  const [activeTab, setActiveTab] = useState<CollectionTab>("inventory");
  const [commandValue, setCommandValue] = useState("");
  const [shopOpen, setShopOpen] = useState(false);
  const [mapZoom, setMapZoom] = useState(initialMapZoom);
  const [playerDirection, setPlayerDirection] = useState("down");

  const openShop = useCallback(() => {
    if (session.state?.trade) {
      setShopOpen(true);
      return;
    }

    session.appendError(new Error("No merchant trade is available here."));
  }, [session]);

  const submitAction = useCallback(
    async (action: GameAction) => {
      await session.sendAction(action);
    },
    [session],
  );

  const runGameCommand = useCallback(
    async (command: string) => {
      const normalized = command.trim();
      if (!normalized) return;

      if (isNewGameCommand(normalized)) {
        await session.startNewGame();
        return;
      }

      if (isShopCommand(normalized)) {
        openShop();
        return;
      }

      let action: GameAction;
      try {
        action = actionFromCommand(normalized);
      } catch (error) {
        session.appendError(error);
        throw error;
      }

      const nextDirection = commandUpdatesFacing(action);
      if (nextDirection) setPlayerDirection(nextDirection);

      if (action.type === "inventory") setActiveTab("inventory");
      if (action.type === "spellbook") setActiveTab("spells");

      await session.sendAction(action);
    },
    [openShop, session],
  );

  const autoExplore = useAutoExplore({
    state: session.state,
    gameId: session.gameId,
    connectionStatus: session.status,
    runCommand: runGameCommand,
  });

  const submitCommand = useCallback(
    (command: string) => {
      const normalized = command.trim();
      if (!normalized) return;

      const autoGoal = manualAutoExploreGoal(normalized, session.state);
      if (autoGoal) {
        autoExplore.setGoal(autoGoal);
        return;
      }

      if (autoExplore.enabled && !autoCompatibleManualCommand(normalized)) {
        autoExplore.stop("stopped");
      }

      void runGameCommand(normalized).catch(() => undefined);
    },
    [autoExplore, runGameCommand, session.state],
  );

  return (
    <GameShell
      state={session.state}
      status={session.status}
      events={session.lastEvents}
      logLines={session.logLines}
      activeTab={activeTab}
      commandValue={commandValue}
      shopOpen={shopOpen}
      autoExplore={autoExplore}
      mapZoom={mapZoom}
      playerDirection={playerDirection}
      onTabChange={setActiveTab}
      onCommandValueChange={setCommandValue}
      onCommand={submitCommand}
      onOpenShop={openShop}
      onCloseShop={() => setShopOpen(false)}
      onMapZoomChange={setMapZoom}
      onSubmitAction={submitAction}
    />
  );
}

export default App;
