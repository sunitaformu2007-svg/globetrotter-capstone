const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

async function request(path, { method = "GET", body, token, params } = {}) {
  let url = `${API_BASE}${path}`;
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
    ).toString();
    if (qs) url += `?${qs}`;
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Can't reach the Douala Travel Assistant server. Is it running?");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const Api = {
  health: () => request("/health"),

  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  me: (token) => request("/auth/me", { token }),

  places: (params) => request("/places", { params }),
  place: (id) => request(`/places/${id}`),
  hotels: (params) => request("/places/hotels", { params }),
  restaurants: (params) => request("/places/restaurants", { params }),
  attractions: () => request("/places/attractions"),
  emergency: () => request("/places/emergency"),
  transportation: () => request("/places/transportation"),
  savePlace: (id, token) => request(`/places/${id}/save`, { method: "POST", token }),
  unsavePlace: (id, token) => request(`/places/${id}/save`, { method: "DELETE", token }),

  planTrip: (payload) => request("/planner", { method: "POST", body: payload }),
  weather: () => request("/weather"),
  route: (params) => request("/directions/route", { params }),
  taxiFare: (distanceKm) => request("/directions/taxi-fare", { params: { distance_km: distanceKm } }),
  chat: (payload) => request("/chat", { method: "POST", body: payload }),
};

export const Auth = {
  getToken: () => localStorage.getItem("dta_token"),
  getUser: () => {
    const raw = localStorage.getItem("dta_user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      localStorage.removeItem("dta_token");
      localStorage.removeItem("dta_user");
      return null;
    }
  },
  setSession: (token, user) => {
    localStorage.setItem("dta_token", token);
    localStorage.setItem("dta_user", JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem("dta_token");
    localStorage.removeItem("dta_user");
  },
};

export function fcfa(amount) {
  if (!amount) return "Free";
  return `${amount.toLocaleString()} FCFA`;
}

export const CATEGORY_LABELS = {
  restaurant: "Restaurants",
  cafe: "Cafés",
  nightlife: "Nightlife",
  hotel: "Hotels",
  culture: "Culture",
  market: "Markets",
  nature: "Nature",
  transportation: "Getting around",
  emergency: "Emergency",
};
