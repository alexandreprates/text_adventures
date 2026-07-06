import type { GameAction, GamePayload, SocketMessage } from "./types";

async function parseResponse(response: Response): Promise<GamePayload> {
  const text = await response.text();
  const body = text ? (JSON.parse(text) as GamePayload) : {};

  if (!response.ok) {
    const maybeError = body as { error?: { message?: string } };
    throw new Error(maybeError.error?.message || `HTTP ${response.status}`);
  }

  return body;
}

export async function createGame(): Promise<GamePayload> {
  const response = await fetch("/api/games", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  return parseResponse(response);
}

export async function fetchGame(gameId: string): Promise<GamePayload> {
  const response = await fetch(`/api/games/${encodeURIComponent(gameId)}`);

  return parseResponse(response);
}

export async function deleteGame(gameId: string): Promise<GamePayload> {
  const response = await fetch(`/api/games/${encodeURIComponent(gameId)}`, {
    method: "DELETE",
  });

  return parseResponse(response);
}

export async function executeAction(
  gameId: string,
  action: GameAction,
): Promise<GamePayload> {
  const response = await fetch(`/api/games/${encodeURIComponent(gameId)}/actions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(action),
  });

  return parseResponse(response);
}

export function socketUrl(gameId: string): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

  return `${protocol}//${window.location.host}/ws?game_id=${encodeURIComponent(gameId)}`;
}

export function socketActionPayload(action: GameAction): string {
  const { type, ...fields } = action;

  return JSON.stringify({ type: "action", action: type, ...fields });
}

export function parseSocketMessage(data: string): SocketMessage {
  return JSON.parse(data) as SocketMessage;
}
