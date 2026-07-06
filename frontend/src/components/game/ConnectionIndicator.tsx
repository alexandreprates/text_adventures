import { useEffect, useRef } from "react";
import type { ConnectionStatus } from "../../lib/types";

const connectionStatusColors: Record<ConnectionStatus, string> = {
  connecting: "#ffdd00",
  online: "#33ff57",
  sending: "#ffdd00",
  offline: "#ff3333",
  error: "#ff3333",
};

const connectionLabels: Record<ConnectionStatus, string> = {
  connecting: "Connection request",
  online: "Connection online",
  sending: "Connection request",
  offline: "Connection offline",
  error: "Connection offline",
};

type ConnectionIndicatorProps = {
  status: ConnectionStatus;
};

export function ConnectionIndicator({ status }: ConnectionIndicatorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const label = connectionLabels[status];

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const color = connectionStatusColors[status];
    const { width, height } = canvas;
    const centerX = width / 2;
    const baseY = height * 0.72;

    context.clearRect(0, 0, width, height);
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = 4;
    context.lineCap = "round";

    [22, 15, 8].forEach((radius) => {
      context.beginPath();
      context.arc(centerX, baseY, radius, Math.PI * 1.18, Math.PI * 1.82);
      context.stroke();
    });

    context.beginPath();
    context.arc(centerX, baseY + 3, 4, 0, Math.PI * 2);
    context.fill();
  }, [status]);

  return (
    <canvas
      ref={canvasRef}
      className="connection-indicator"
      width="60"
      height="60"
      data-status={status}
      role="status"
      aria-label={label}
      title={label}
    />
  );
}
