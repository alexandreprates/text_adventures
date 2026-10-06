export const musicTracks = {
  town: {
    title: "Village Consort",
    src: "/assets/music/village-consort.mp3",
    source: "https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1700007",
    setting: "Town",
  },
  dungeon: {
    title: "Darkest Child var A",
    src: "/assets/music/darkest-child-var-a.mp3",
    source: "https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100784",
    setting: "Dungeon",
  },
} as const;

export const musicLicense = "https://creativecommons.org/licenses/by/4.0/";
const preferenceKey = "text_adventures.music_enabled";
type Track = keyof typeof musicTracks;
export type MusicStatus = "ready" | "loading" | "playing" | "paused" | "error";
type Channel = { audio: HTMLAudioElement; gain: GainNode; source: MediaElementAudioSourceNode };

export function savedMusicEnabled(): boolean {
  try { return localStorage.getItem(preferenceKey) !== "false"; }
  catch { return true; }
}

export function rememberMusicEnabled(enabled: boolean) {
  try { localStorage.setItem(preferenceKey, String(enabled)); }
  catch { /* Music remains usable when browser storage is restricted. */ }
}

// Stream the files instead of decoding several minutes of stereo audio into memory.
// GainNodes also provide volume control on mobile browsers that ignore audio.volume.
export class GameMusic {
  private context?: AudioContext;
  private channels?: Record<Track, Channel>;
  private track: Track | null = null;
  private enabled: boolean;
  private unlocked = false;
  private disposed = false;
  private status: MusicStatus = "ready";
  private revision = 0;
  private fadeTimer?: ReturnType<typeof setTimeout>;
  private notify: (status: MusicStatus) => void;

  constructor(enabled: boolean, notify: (status: MusicStatus) => void) {
    this.enabled = enabled;
    this.notify = notify;
    document.addEventListener("click", this.onGesture);
    document.addEventListener("keydown", this.onGesture);
    document.addEventListener("visibilitychange", this.onVisibility);
    window.addEventListener("pagehide", this.pause);
    window.addEventListener("pageshow", this.onVisibility);
  }

  setScene(scene: string | undefined) {
    const next = scene ? (scene === "ruins" ? "dungeon" : "town") : null;
    if (next === this.track) return;
    this.track = next;
    if (!next) this.pause();
    else if ((this.unlocked || this.status === "loading") && this.enabled && !document.hidden) void this.play();
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (enabled) void this.play(true);
    else this.pause();
  }

  retry() { void this.play(true); }

  private setStatus(status: MusicStatus) {
    this.status = status;
    if (!this.disposed) this.notify(status);
  }

  private onGesture = () => {
    if (this.enabled && this.track && (this.status === "ready" || this.status === "paused")) {
      void this.play(true);
    }
  };

  private onVisibility = () => {
    if (document.hidden) this.pause();
    else if (this.enabled && this.unlocked && this.status !== "error") void this.play();
  };

  private initialize() {
    if (this.context) return;
    this.context = new AudioContext();
    const makeChannel = (track: Track): Channel => {
      const audio = new Audio(musicTracks[track].src);
      audio.preload = "none";
      audio.loop = true;
      const gain = this.context!.createGain();
      gain.gain.value = 0;
      const source = this.context!.createMediaElementSource(audio);
      source.connect(gain);
      gain.connect(this.context!.destination);
      audio.addEventListener("error", () => {
        if (!this.disposed && this.enabled && this.track === track) {
          this.pause();
          this.setStatus("error");
        }
      });
      return { audio, gain, source };
    };
    this.channels = { town: makeChannel("town"), dungeon: makeChannel("dungeon") };
  }

  private async play(gesture = false) {
    if (this.disposed || !this.enabled || !this.track || document.hidden) return;
    const revision = ++this.revision;
    clearTimeout(this.fadeTimer);
    this.setStatus("loading");
    try {
      this.initialize();
      const context = this.context!;
      const channels = this.channels!;
      const target = channels[this.track];
      if (target.audio.error) target.audio.load();
      // Invoke resume and play synchronously within the gesture, before awaiting.
      const resumed = context.resume();
      const started = target.audio.play();
      if (gesture && !this.unlocked) {
        // Unlock the other element while the gesture is still active (iOS).
        const other = channels[this.track === "town" ? "dungeon" : "town"];
        void other.audio.play().catch(() => undefined);
      }
      await Promise.all([resumed, started]);
      if (revision !== this.revision || this.disposed) return;
      this.unlocked = true;
      for (const channel of Object.values(channels)) {
        const gain = channel.gain.gain;
        gain.cancelScheduledValues(context.currentTime);
        gain.setValueAtTime(gain.value, context.currentTime);
        gain.linearRampToValueAtTime(channel === target ? 0.25 : 0, context.currentTime + 0.8);
      }
      this.fadeTimer = setTimeout(() => {
        for (const channel of Object.values(channels)) {
          if (channel !== target) channel.audio.pause();
        }
      }, 850);
      this.setStatus("playing");
    } catch (error) {
      if (revision !== this.revision || this.disposed) return;
      this.pause();
      this.setStatus(error instanceof Error && error.name === "NotAllowedError" ? "ready" : "error");
    }
  }

  private pause = () => {
    ++this.revision;
    clearTimeout(this.fadeTimer);
    for (const channel of Object.values(this.channels || {})) {
      channel.audio.pause();
      channel.gain.gain.cancelScheduledValues(this.context!.currentTime);
      channel.gain.gain.value = 0;
    }
    if (this.context && this.context.state !== "closed") void this.context.suspend().catch(() => undefined);
    this.setStatus("paused");
  };

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.pause();
    document.removeEventListener("click", this.onGesture);
    document.removeEventListener("keydown", this.onGesture);
    document.removeEventListener("visibilitychange", this.onVisibility);
    window.removeEventListener("pagehide", this.pause);
    window.removeEventListener("pageshow", this.onVisibility);
    for (const channel of Object.values(this.channels || {})) {
      channel.source.disconnect();
      channel.gain.disconnect();
      channel.audio.removeAttribute("src");
      channel.audio.load();
    }
    if (this.context) void this.context.close().catch(() => undefined);
  }
}
