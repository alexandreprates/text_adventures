import { describe, expect, it } from "vitest";
import { SocketReconnectBackoff, socketReconnectDelayMs } from "./socketReconnect";

describe("socketReconnectDelayMs", () => {
  it("uses capped exponential backoff for consecutive failures", () => {
    expect(Array.from({ length: 8 }, (_, attempt) => socketReconnectDelayMs(attempt))).toEqual([
      1_000,
      2_000,
      4_000,
      8_000,
      16_000,
      30_000,
      30_000,
      30_000,
    ]);
  });

  it("normalizes invalid negative values and supports disabling the delay", () => {
    expect(socketReconnectDelayMs(-2)).toBe(1_000);
    expect(socketReconnectDelayMs(3, 0)).toBe(0);
    expect(socketReconnectDelayMs(3, 1_000, 0)).toBe(0);
  });

  it("restarts at the base delay after a successful connection resets the backoff", () => {
    const backoff = new SocketReconnectBackoff();

    expect([backoff.nextDelayMs(), backoff.nextDelayMs(), backoff.nextDelayMs()]).toEqual([
      1_000,
      2_000,
      4_000,
    ]);

    backoff.reset();

    expect(backoff.nextDelayMs()).toBe(1_000);
  });
});
