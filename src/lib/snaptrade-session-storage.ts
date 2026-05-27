import { SnapTradeCredentials } from "@/lib/snaptrade-client";

const SESSION_KEY = "capitol-trades-snaptrade-session";

export function loadSnapTradeSession(): SnapTradeCredentials | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as SnapTradeCredentials;
    if (!parsed?.userId || !parsed?.userSecret) return null;

    return parsed;
  } catch {
    return null;
  }
}

export function saveSnapTradeSession(session: SnapTradeCredentials): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSnapTradeSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}
