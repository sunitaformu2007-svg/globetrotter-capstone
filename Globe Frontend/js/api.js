/* ===========================================================
   GlobeTrotter — API client
   Wraps fetch() to the Flask monolith, handles the JWT and
   common error shapes so page scripts stay short.
   =========================================================== */

const API_BASE = "http://127.0.0.1:5000/api";

const Auth = {
  getToken() { return localStorage.getItem("gt_token"); },
  getUser() {
    const raw = localStorage.getItem("gt_user");
    return raw ? JSON.parse(raw) : null;
  },
  setSession(token, user) {
    localStorage.setItem("gt_token", token);
    localStorage.setItem("gt_user", JSON.stringify(user));
  },
  updateUser(user) {
    localStorage.setItem("gt_user", JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem("gt_token");
    localStorage.removeItem("gt_user");
  },
  isLoggedIn() { return !!this.getToken(); },
  requireLogin() {
    if (!this.isLoggedIn()) {
      window.location.href = "login.html";
    }
  },
};

async function apiRequest(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = Auth.getToken();
    if (!token) {
      window.location.href = "login.html";
      throw new Error("Not authenticated");
    }
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new Error(
      "Can't reach the GlobeTrotter server. Make sure the Flask backend is running on http://127.0.0.1:5000."
    );
  }

  let data = null;
  try { data = await response.json(); } catch (_) { /* no body */ }

  if (response.status === 401 && auth) {
    Auth.clear();
    window.location.href = "login.html";
    throw new Error("Session expired");
  }

  if (!response.ok) {
    const message = (data && data.error) || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

const Api = {
  register: (payload) => apiRequest("/register", { method: "POST", body: payload }),
  login: (payload) => apiRequest("/login", { method: "POST", body: payload }),
  getProfile: () => apiRequest("/profile", { auth: true }),
  updateProfile: (payload) => apiRequest("/profile", { method: "PUT", body: payload, auth: true }),

  searchDestinations: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v != null))
    ).toString();
    return apiRequest(`/destinations${qs ? `?${qs}` : ""}`);
  },
  getDestination: (id) => apiRequest(`/destinations/${id}`),

  getRecommendations: (limit = 8) => apiRequest(`/recommendations?limit=${limit}`, { auth: true }),

  listItineraries: () => apiRequest("/itineraries", { auth: true }),
  getItinerary: (id) => apiRequest(`/itineraries/${id}`, { auth: true }),
  createItinerary: (payload) => apiRequest("/itineraries", { method: "POST", body: payload, auth: true }),
  updateItinerary: (id, payload) => apiRequest(`/itineraries/${id}`, { method: "PUT", body: payload, auth: true }),
  deleteItinerary: (id) => apiRequest(`/itineraries/${id}`, { method: "DELETE", auth: true }),
};

/* Deterministic placeholder photo per destination so cards look distinct
   without depending on a licensed image API. */
function destPhotoUrl(destination, w = 480, h = 260) {
  return `https://picsum.photos/seed/${encodeURIComponent(destination.image_seed || destination.name)}/${w}/${h}`;
}

function showToast(message, type = "success") {
  let toast = document.getElementById("gt-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "gt-toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast show ${type === "error" ? "toast-error" : ""}`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 3200);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
