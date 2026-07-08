import { useCallback, useEffect, useRef, useState } from "react";
import {
  createGame,
  deleteGame,
  executeAction,
  fetchGame,
  parseSocketMessage,
  socketActionPayload,
  socketPingPayload,
  socketUrl,
} from "../lib/gameApi";
import { forgetGameId, gameIdFromUrl, rememberGameId, savedGameId } from "../lib/storage";
import type {
  ConnectionStatus,
  GameAction,
  GameEvent,
  GamePayload,
  GameState,
} from "../lib/types";
import { eventsFromPayload, mergeStatePatch } from "../lib/viewModels";

type PendingAction = {
  resolve: (payload: GamePayload) => void;
  reject: (error: Error) => void;
};

declare global {
  interface Window {
    __TEXT_ADVENTURES_SOCKET_HEARTBEAT_INTERVAL_MS?: number;
    __TEXT_ADVENTURES_SOCKET_RECONNECT_DELAY_MS?: number;
  }
}

const defaultSocketHeartbeatIntervalMs = 25_000;
const defaultSocketReconnectDelayMs = 1_000;

type GameSnapshot = {
  gameId: string | null;
  state: GameState | null;
  logLines: string[];
  lastEvents: GameEvent[];
};

const emptySnapshot: GameSnapshot = {
  gameId: null,
  state: null,
  logLines: [],
  lastEvents: [],
};

function socketTimingValue(key: keyof Window, fallback: number): number {
  const configured = window[key];

  return typeof configured === "number" && configured >= 0 ? configured : fallback;
}

export type GameSession = GameSnapshot & {
  status: ConnectionStatus;
  sendAction: (action: GameAction) => Promise<GamePayload>;
  startNewGame: () => Promise<void>;
  appendError: (error: unknown) => void;
};

export function useGameSession(): GameSession {
  const [snapshot, setSnapshot] = useState<GameSnapshot>(emptySnapshot);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const gameIdRef = useRef<string | null>(null);
  const stateRef = useRef<GameState | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const openSocketRef = useRef<(gameId: string) => Promise<void>>(() =>
    Promise.reject(new Error("WebSocket opener is not ready.")),
  );
  const heartbeatIntervalRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const pendingActionRef = useRef<PendingAction | null>(null);
  const manuallyDisconnectedRef = useRef(false);

  const appendError = useCallback((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    setSnapshot((previous) => ({
      ...previous,
      logLines: [...previous.logLines, `! ${message}`].slice(-80),
      lastEvents: [{ type: "error.invalid_action", text: message }],
    }));
  }, []);

  const applyPayload = useCallback((payload: GamePayload) => {
    const nextGameId = payload.game_id || gameIdRef.current;
    const nextState = payload.state || stateRef.current;
    const events = eventsFromPayload(payload);

    if (nextGameId) {
      gameIdRef.current = nextGameId;
      rememberGameId(nextGameId);
    }

    if (nextState) stateRef.current = nextState;

    setSnapshot((previous) => {
      const eventLines = events.map((event) => event.text).filter(Boolean);

      return {
        gameId: nextGameId,
        state: nextState,
        lastEvents: events,
        logLines: eventLines.length
          ? [...previous.logLines, ...eventLines].slice(-80)
          : previous.logLines,
      };
    });
  }, []);

  const resolvePendingAction = useCallback((payload: GamePayload) => {
    const pending = pendingActionRef.current;
    pendingActionRef.current = null;
    if (pending) pending.resolve(payload);
  }, []);

  const rejectPendingAction = useCallback((error: Error) => {
    const pending = pendingActionRef.current;
    pendingActionRef.current = null;
    if (pending) pending.reject(error);
  }, []);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current === null) return;

    window.clearInterval(heartbeatIntervalRef.current);
    heartbeatIntervalRef.current = null;
  }, []);

  const clearReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current === null) return;

    window.clearTimeout(reconnectTimeoutRef.current);
    reconnectTimeoutRef.current = null;
  }, []);

  const startHeartbeat = useCallback(
    (socket: WebSocket) => {
      clearHeartbeat();

      const intervalMs = socketTimingValue(
        "__TEXT_ADVENTURES_SOCKET_HEARTBEAT_INTERVAL_MS",
        defaultSocketHeartbeatIntervalMs,
      );
      if (intervalMs <= 0) return;

      heartbeatIntervalRef.current = window.setInterval(() => {
        if (socketRef.current !== socket) {
          clearHeartbeat();
          return;
        }

        if (socket.readyState === WebSocket.OPEN) {
          socket.send(socketPingPayload());
        }
      }, intervalMs);
    },
    [clearHeartbeat],
  );

  const scheduleReconnect = useCallback(
    (gameId: string) => {
      clearReconnect();

      const delayMs = socketTimingValue(
        "__TEXT_ADVENTURES_SOCKET_RECONNECT_DELAY_MS",
        defaultSocketReconnectDelayMs,
      );

      reconnectTimeoutRef.current = window.setTimeout(() => {
        reconnectTimeoutRef.current = null;
        if (manuallyDisconnectedRef.current || socketRef.current) return;

        setStatus("connecting");
        void openSocketRef
          .current(gameId)
          .then(() => {
            if (!manuallyDisconnectedRef.current) setStatus("online");
          })
          .catch(() => {
            if (!manuallyDisconnectedRef.current) setStatus("offline");
          });
      }, delayMs);
    },
    [clearReconnect],
  );

  const disconnectSocket = useCallback((manual = true) => {
    manuallyDisconnectedRef.current = manual;
    pendingActionRef.current = null;
    clearHeartbeat();
    if (manual) clearReconnect();

    if (socketRef.current) {
      const socket = socketRef.current;
      socketRef.current = null;
      socket.close();
    }
  }, [clearHeartbeat, clearReconnect]);

  const openSocket = useCallback(
    (gameId: string): Promise<void> => {
      disconnectSocket(false);
      clearReconnect();
      manuallyDisconnectedRef.current = false;

      const socket = new WebSocket(socketUrl(gameId));
      socketRef.current = socket;

      return new Promise((resolve, reject) => {
        socket.addEventListener(
          "open",
          () => {
            startHeartbeat(socket);
            resolve();
          },
          { once: true },
        );

        socket.addEventListener(
          "error",
          () => {
            reject(new Error("WebSocket connection failed."));
          },
          { once: true },
        );

        socket.addEventListener("message", (event) => {
          const message = parseSocketMessage(String(event.data));

          if (message.type === "pong") return;

          if (message.type === "state") {
            applyPayload({ game_id: message.game_id, state: message.state });
            return;
          }

          if (message.type === "events") {
            const state = mergeStatePatch(stateRef.current, message.patch);
            const payload: GamePayload = {
              game_id: message.game_id || gameIdRef.current || undefined,
              state: state || undefined,
              events: message.events || [],
              response: message.response,
            };

            applyPayload(payload);
            resolvePendingAction(payload);
            return;
          }

          const error = new Error(message.error?.message || "WebSocket error.");
          rejectPendingAction(error);
          appendError(error);
          setStatus("error");
        });

        socket.addEventListener("close", () => {
          clearHeartbeat();
          if (socketRef.current !== socket) return;

          socketRef.current = null;
          rejectPendingAction(new Error("Connection lost."));
          if (!manuallyDisconnectedRef.current) {
            setStatus("offline");
            scheduleReconnect(gameId);
          }
        });
      });
    },
    [
      appendError,
      applyPayload,
      clearHeartbeat,
      clearReconnect,
      disconnectSocket,
      rejectPendingAction,
      resolvePendingAction,
      scheduleReconnect,
      startHeartbeat,
    ],
  );

  useEffect(() => {
    openSocketRef.current = openSocket;
  }, [openSocket]);

  const sendViaSocket = useCallback((action: GameAction): Promise<GamePayload> => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error("WebSocket is not connected."));
    }
    if (pendingActionRef.current) {
      return Promise.reject(new Error("Another action is still pending."));
    }

    return new Promise((resolve, reject) => {
      pendingActionRef.current = { resolve, reject };
      socket.send(socketActionPayload(action));
    });
  }, []);

  const sendAction = useCallback(
    async (action: GameAction): Promise<GamePayload> => {
      const gameId = gameIdRef.current;
      if (!gameId) throw new Error("Game session is not ready.");

      setStatus("sending");

      try {
        const socket = socketRef.current;
        const payload =
          socket && socket.readyState === WebSocket.OPEN
            ? await sendViaSocket(action)
            : await executeAction(gameId, action);

        if (!socket || socket.readyState !== WebSocket.OPEN) applyPayload(payload);
        setStatus("online");

        return payload;
      } catch (error) {
        setStatus("error");
        appendError(error);
        throw error;
      }
    },
    [appendError, applyPayload, sendViaSocket],
  );

  const startNewGame = useCallback(async () => {
    const previousGameId = gameIdRef.current;

    setStatus("connecting");
    disconnectSocket();
    forgetGameId();
    gameIdRef.current = null;
    stateRef.current = null;
    setSnapshot(emptySnapshot);

    if (previousGameId) {
      try {
        await deleteGame(previousGameId);
      } catch {
        // A missing old session should not block creating the next game.
      }
    }

    try {
      const payload = await createGame();
      applyPayload(payload);
      if (payload.game_id) await openSocket(payload.game_id);
      setStatus("online");
    } catch (error) {
      setStatus("error");
      appendError(error);
    }
  }, [appendError, applyPayload, disconnectSocket, openSocket]);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      setStatus("connecting");

      try {
        const existingGameId = gameIdFromUrl() || savedGameId();
        let payload: GamePayload;

        if (existingGameId) {
          try {
            payload = await fetchGame(existingGameId);
          } catch {
            forgetGameId();
            payload = await createGame();
          }
        } else {
          payload = await createGame();
        }

        if (cancelled) return;

        applyPayload(payload);
        let socketConnected = false;
        if (payload.game_id) {
          try {
            await openSocket(payload.game_id);
            socketConnected = true;
          } catch (error) {
            appendError(error);
          }
        }

        if (!cancelled) setStatus(socketConnected || !payload.game_id ? "online" : "offline");
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          appendError(error);
        }
      }
    }

    void boot();

    return () => {
      cancelled = true;
      disconnectSocket();
    };
  }, [appendError, applyPayload, disconnectSocket, openSocket]);

  return {
    ...snapshot,
    status,
    sendAction,
    startNewGame,
    appendError,
  };
}
