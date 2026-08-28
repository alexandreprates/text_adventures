export const defaultSocketReconnectDelayMs = 1_000;
export const defaultSocketReconnectMaxDelayMs = 30_000;

export function socketReconnectDelayMs(
  attempt: number,
  baseDelayMs = defaultSocketReconnectDelayMs,
  maxDelayMs = defaultSocketReconnectMaxDelayMs,
): number {
  const normalizedAttempt = Math.max(0, Math.floor(attempt));
  const normalizedBaseDelay = Math.max(0, Math.floor(baseDelayMs));
  const normalizedMaxDelay = Math.max(0, Math.floor(maxDelayMs));
  const exponentialDelay = normalizedBaseDelay * 2 ** normalizedAttempt;

  return Math.min(exponentialDelay, normalizedMaxDelay);
}

export class SocketReconnectBackoff {
  private attempt = 0;

  nextDelayMs(
    baseDelayMs = defaultSocketReconnectDelayMs,
    maxDelayMs = defaultSocketReconnectMaxDelayMs,
  ): number {
    const delayMs = socketReconnectDelayMs(this.attempt, baseDelayMs, maxDelayMs);
    this.attempt += 1;

    return delayMs;
  }

  reset(): void {
    this.attempt = 0;
  }
}
