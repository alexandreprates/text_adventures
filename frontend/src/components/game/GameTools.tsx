import { useEffect, useRef, useState } from "react";
import {
  GameMusic, musicLicense, musicTracks, rememberMusicEnabled, savedMusicEnabled,
  type MusicStatus,
} from "../../lib/music";

export function GameTools({ scene }: { scene?: string }) {
  const [enabled, setEnabled] = useState(savedMusicEnabled);
  const [status, setStatus] = useState<MusicStatus>("ready");
  const music = useRef<GameMusic | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const controller = new GameMusic(savedMusicEnabled(), setStatus);
    music.current = controller;
    return () => { controller.dispose(); music.current = null; };
  }, []);

  useEffect(() => { music.current?.setScene(scene); }, [scene]);

  function toggleMusic() {
    if (enabled && (status === "error" || status === "ready")) {
      music.current?.retry();
      return;
    }
    const next = !enabled;
    setEnabled(next);
    rememberMusicEnabled(next);
    music.current?.setEnabled(next);
  }

  const label = !enabled ? "Enable music" : status === "error" ? "Retry music" : status === "ready" ? "Play music" : "Mute music";

  return (
    <div className="game-tools">
      <button type="button" className="game-tool-button" aria-label={label} title={label}
        aria-pressed={enabled} onClick={toggleMusic}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M11 5 6 9H3v6h3l5 4V5Z" />
          {enabled ? <path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /> : <path d="m16 9 6 6m0-6-6 6" />}
        </svg>
      </button>
      <span className="sr-only" role="status">
        {enabled && status === "error" ? "Music could not load. Use Retry music to try again." : ""}
      </span>
      <button type="button" className="game-tool-button" aria-label="Game credits" title="Game credits"
        aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="9" /><path d="M12 11v6" /><circle cx="12" cy="7" r="1" fill="currentColor" stroke="none" />
        </svg>
      </button>
      <dialog ref={dialog} className="game-credits-dialog" aria-labelledby="game-credits-title"
        onKeyDown={(event) => event.stopPropagation()}>
        <header className="game-credits-header">
          <h2 id="game-credits-title">Game credits</h2>
          <button type="button" className="game-tool-button" aria-label="Close credits" onClick={() => dialog.current?.close()}>×</button>
        </header>
        <section aria-labelledby="game-creators-title">
          <h3 id="game-creators-title">Text Adventures</h3>
          <p>Created by <strong>Alexandre Prates</strong></p>
          <p>Development assistance: <strong>OpenAI Codex</strong></p>
        </section>
        <section aria-labelledby="music-credits-title">
          <h3 id="music-credits-title">Music</h3>
          {Object.values(musicTracks).map((track) => (
            <div className="music-credit" key={track.src}>
              <span>{track.setting}</span>
              <a href={track.source} target="_blank" rel="noreferrer">{track.title}</a>
              <p>Kevin MacLeod (<a href="https://incompetech.com/" target="_blank" rel="noreferrer">incompetech.com</a>)</p>
            </div>
          ))}
          <p className="music-license">Both tracks licensed under <a href={musicLicense} target="_blank" rel="noreferrer">Creative Commons: By Attribution 4.0</a>.</p>
          <p className="music-license">Original recordings, played on repeat with volume fades.</p>
        </section>
      </dialog>
    </div>
  );
}
