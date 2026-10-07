type PendingWrite = { key: string; version: string; serialize: () => string };

/** Coalesce disposable browser knowledge without delaying authoritative server saves. */
export class ExplorationCache {
  private pending: PendingWrite | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private saved: { key: string; version: string } | null = null;

  private readonly write: (key: string, value: string) => void;
  private readonly delay: number;

  constructor(write: (key: string, value: string) => void, delay = 750) {
    this.write = write;
    this.delay = delay;
  }

  queue(key: string, version: string, serialize: () => string): void {
    if (this.pending && this.pending.key !== key) this.flush();
    if (this.saved?.key === key && this.saved.version === version) return;
    this.pending = { key, version, serialize };
    if (this.timer === null) this.timer = setTimeout(() => this.flush(), this.delay);
  }

  flush(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    const pending = this.pending;
    this.pending = null;
    if (!pending) return;
    try {
      this.write(pending.key, pending.serialize());
      this.saved = { key: pending.key, version: pending.version };
    } catch {
      // Browser storage is optional; quota and privacy restrictions must not stop play.
    }
  }

  discard(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    this.pending = null;
    this.saved = null;
  }
}
