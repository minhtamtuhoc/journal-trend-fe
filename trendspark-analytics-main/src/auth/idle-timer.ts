const LAST_ACTIVITY_KEY = "helix.last_activity";
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function recordActivity(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
}

export function getIdleMs(): number {
  if (typeof window === "undefined") return 0;
  const last = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
  if (!last) return 0; // if no activity has been recorded yet, treat as just active
  return Date.now() - last;
}

export function clearActivity(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LAST_ACTIVITY_KEY);
}
