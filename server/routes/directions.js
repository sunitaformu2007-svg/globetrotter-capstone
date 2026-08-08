import { Router } from "express";

const router = Router();

// OSRM's public demo server is free and needs no API key. It's rate-limited
// and not meant for heavy production traffic — swap in Google Directions API
// or your own OSRM instance when you're ready to scale.
const OSRM_BASE = "https://router.project-osrm.org/route/v1";

// Rough Douala taxi pricing model for the fare estimator (informal "course"
// taxis are usually negotiated, not metered — treat this as a ballpark).
const BASE_FARE_FCFA = 300;
const PER_KM_FCFA = 250;

router.get("/route", async (req, res) => {
  const { from_lat, from_lng, to_lat, to_lng, mode } = req.query;
  if (!from_lat || !from_lng || !to_lat || !to_lng) {
    return res.status(400).json({ error: "from_lat, from_lng, to_lat, to_lng are required" });
  }

  const profile = mode === "walking" ? "foot" : "driving";
  const url = `${OSRM_BASE}/${profile}/${from_lng},${from_lat};${to_lng},${to_lat}?overview=full&geometries=geojson`;

  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`OSRM responded ${r.status}`);
    const data = await r.json();
    const route = data.routes?.[0];
    if (!route) throw new Error("No route found");

    const distanceKm = route.distance / 1000;
    const durationMin = route.duration / 60;

    res.json({
      mode: profile,
      distance_km: Number(distanceKm.toFixed(2)),
      duration_min: Number(durationMin.toFixed(1)),
      geometry: route.geometry,
      taxi_fare_estimate_fcfa:
        profile === "driving" ? Math.round(BASE_FARE_FCFA + distanceKm * PER_KM_FCFA) : null,
    });
  } catch (err) {
    console.error("Directions fetch failed:", err.message);
    res.status(502).json({
      error: "Couldn't reach the routing service right now. Try again in a moment.",
    });
  }
});

router.get("/taxi-fare", (req, res) => {
  const { distance_km } = req.query;
  if (!distance_km) return res.status(400).json({ error: "distance_km is required" });
  const km = Number(distance_km);
  const fare = Math.round(BASE_FARE_FCFA + km * PER_KM_FCFA);
  res.json({ distance_km: km, estimated_fare_fcfa: fare, note: "Informal taxis are usually negotiated — treat this as a starting point." });
});

export default router;
