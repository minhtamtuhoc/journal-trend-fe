export function getHiddenNotifications(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("helix_hidden_notifications");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function hideNotification(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const current = getHiddenNotifications();
    if (!current.includes(id)) {
      const next = [...current, id];
      localStorage.setItem("helix_hidden_notifications", JSON.stringify(next));
    }
  } catch (err) {
    console.error("Failed to hide notification in storage:", err);
  }
}

export function hideNotifications(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const current = getHiddenNotifications();
    const next = Array.from(new Set([...current, ...ids]));
    localStorage.setItem("helix_hidden_notifications", JSON.stringify(next));
  } catch (err) {
    console.error("Failed to hide notifications in storage:", err);
  }
}

export function clearHiddenNotifications(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("helix_hidden_notifications");
  } catch (err) {
    console.error("Failed to clear hidden notifications from storage:", err);
  }
}
