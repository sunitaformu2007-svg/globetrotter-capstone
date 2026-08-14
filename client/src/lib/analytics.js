const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

/**
 * Fire-and-forget event tracking. Never throws, never blocks the UI —
 * if the backend or database isn't reachable, this just silently does
 * nothing rather than breaking the page.
 */
export function trackEvent(eventType, meta = {}) {
  try {
    const token = localStorage.getItem("dta_token");
    fetch(`${API_BASE}/analytics/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ eventType, path: window.location.pathname, meta }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Never let analytics break the app.
  }
}
