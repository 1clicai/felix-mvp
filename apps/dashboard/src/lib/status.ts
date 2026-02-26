export function statusColor(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("fail") || normalized.includes("invalid")) return "#f87171";
  if (normalized.includes("run") || normalized.includes("pending")) return "#facc15";
  if (normalized.includes("success") || normalized.includes("succeed") || normalized.includes("active")) return "#4ade80";
  return "#94a3b8";
}
