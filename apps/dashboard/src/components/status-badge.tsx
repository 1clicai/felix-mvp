"use client";

import { statusColor } from "../lib/status";

export function StatusBadge({ status }: { status: string }) {
  const color = statusColor(status);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        background: "rgba(148,163,184,0.12)",
        borderRadius: "999px",
        padding: "0.15rem 0.75rem",
        fontSize: "0.85rem",
        color: "#f8fafc",
      }}
    >
      <span
        style={{
          width: "0.5rem",
          height: "0.5rem",
          borderRadius: "50%",
          background: color,
        }}
      />
      {status}
    </span>
  );
}
