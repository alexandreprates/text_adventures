const SAVED_GAME_ID_KEY = "text_adventures.game_id";

export function gameIdFromUrl(): string | null {
  try {
    const match = window.location.pathname.match(/^\/game\/([^/]+)$/);

    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

export function savedGameId(): string | null {
  try {
    return window.localStorage.getItem(SAVED_GAME_ID_KEY);
  } catch {
    return null;
  }
}

export function rememberGameId(gameId: string): void {
  try {
    window.localStorage.setItem(SAVED_GAME_ID_KEY, gameId);
  } catch {
    // localStorage can be unavailable in restricted browser contexts.
  }

  updateGameUrl(gameId);
}

export function forgetGameId(): void {
  try {
    window.localStorage.removeItem(SAVED_GAME_ID_KEY);
  } catch {
    // localStorage can be unavailable in restricted browser contexts.
  }

  updateGameUrl(null);
}

function updateGameUrl(gameId: string | null): void {
  try {
    const url = new URL(window.location.href);
    url.pathname = gameId ? `/game/${encodeURIComponent(gameId)}` : "/";
    url.search = "";
    window.history.replaceState({}, "", url);
  } catch {
    // History can be unavailable in restricted browser contexts.
  }
}
