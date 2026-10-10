import { useEffect, useRef, type ReactNode } from "react";

export function GameDialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className="arcade-dialog"
      aria-labelledby="game-panel-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header className="arcade-dialog-heading flex items-center justify-between gap-4">
        <h2 id="game-panel-title">{title}</h2>
        <button type="button" aria-label="Close panel" onClick={onClose}>
          Close ×
        </button>
      </header>
      {children}
    </dialog>
  );
}
