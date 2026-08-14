import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { findUserById, updateUser, publicUser } from "../utils/db.js";
import { logEvent } from "../utils/analytics.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLACES_PATH = path.join(__dirname, "..", "data", "places.json");
const PLACES_BACKUP_PATH = path.join(__dirname, "..", "data", "places.backup.json");

function loadPlaces() {
  try {
    const raw = fs.readFileSync(PLACES_PATH, "utf-8");
    const data = JSON.parse(raw);
    const backupRaw = fs.existsSync(PLACES_BACKUP_PATH) ? fs.readFileSync(PLACES_BACKUP_PATH, "utf-8") : null;
    const normalized = JSON.stringify(data, null, 2);
    if (backupRaw !== normalized) {
      fs.writeFileSync(PLACES_BACKUP_PATH, normalized);
    }
    return data;
  } catch (err) {
    console.error("\n⚠️  server/data/places.json has a mistake in it (probably a missing comma or quote).");
    console.error("   Error detail:", err.message);
    console.error("   Restoring the last known-good copy so the site keeps working.\n");
    if (fs.existsSync(PLACES_BACKUP_PATH)) {
      const backup = JSON.parse(fs.readFileSync(PLACES_BACKUP_PATH, "utf-8"));
      fs.writeFileSync(PLACES_PATH, JSON.stringify(backup, null, 2));
      return backup;
    }
    throw err;
  }
}

const PLACES = loadPlaces();

const router = Router();

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

export function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

router.get("/", optionalAuth, (req, res) => {
  const { category, q, max_cost, near_lat, near_lng, radius_km } = req.query;
  let results = PLACES;

  if (category) {
    results = results.filter((p) => p.category === category);
  }
  if (q) {
    const needle = q.toLowerCase();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) ||
        p.area.toLowerCase().includes(needle) ||
        p.description.toLowerCase().includes(needle) ||
        p.tags.some((t) => t.toLowerCase().includes(needle))
    );
  }
  if (max_cost) {
    results = results.filter((p) => p.avg_cost_usd <= Number(max_cost));
  }
  if (near_lat && near_lng) {
    const lat = Number(near_lat);
    const lng = Number(near_lng);
    const radius = radius_km ? Number(radius_km) : 5;
    results = results
      .map((p) => ({ ...p, distance_km: Number(distanceKm(lat, lng, p.lat, p.lng).toFixed(2)) }))
      .filter((p) => p.distance_km <= radius)
      .sort((a, b) => a.distance_km - b.distance_km);
  }

  if (q || category) {
    logEvent("search", {
      userId: req.userId,
      userEmail: req.userEmail,
      meta: { q: q || null, category: category || null, resultCount: results.length },
    });
  }

  res.json({
    count: results.length,
    categories: [...new Set(PLACES.map((p) => p.category))].sort(),
    results,
  });
});

router.get("/hotels", (req, res) => {
  const { max_cost, wifi, parking, pool, airport_shuttle, min_rating } = req.query;
  let results = PLACES.filter((p) => p.category === "hotel");
  if (max_cost) results = results.filter((p) => p.avg_cost_usd <= Number(max_cost));
  if (min_rating) results = results.filter((p) => p.rating >= Number(min_rating));
  if (wifi === "true") results = results.filter((p) => p.amenities?.wifi);
  if (parking === "true") results = results.filter((p) => p.amenities?.parking);
  if (pool === "true") results = results.filter((p) => p.amenities?.pool);
  if (airport_shuttle === "true") results = results.filter((p) => p.amenities?.airport_shuttle);
  res.json({ count: results.length, results });
});

router.get("/restaurants", (req, res) => {
  const { cuisine, max_cost, min_rating } = req.query;
  let results = PLACES.filter((p) => p.category === "restaurant");
  if (cuisine) results = results.filter((p) => p.cuisine?.toLowerCase().includes(cuisine.toLowerCase()));
  if (max_cost) results = results.filter((p) => p.avg_cost_usd <= Number(max_cost));
  if (min_rating) results = results.filter((p) => p.rating >= Number(min_rating));
  res.json({ count: results.length, results });
});

router.get("/attractions", (req, res) => {
  const results = PLACES.filter((p) => ["culture", "nature", "market"].includes(p.category));
  res.json({ count: results.length, results });
});

router.get("/emergency", (req, res) => {
  const results = PLACES.filter((p) => p.category === "emergency");
  res.json({ count: results.length, results });
});

router.get("/transportation", (req, res) => {
  const results = PLACES.filter((p) => p.category === "transportation");
  res.json({ count: results.length, results });
});

router.get("/:id", optionalAuth, (req, res) => {
  const place = PLACES.find((p) => p.id === Number(req.params.id));
  if (!place) return res.status(404).json({ error: "Place not found" });
  logEvent("place_view", {
    userId: req.userId,
    userEmail: req.userEmail,
    meta: { placeId: place.id, placeName: place.name },
  });
  res.json(place);
});

// -------- Saved places (requires auth) --------

router.post("/:id/save", requireAuth, async (req, res) => {
  const placeId = Number(req.params.id);
  const place = PLACES.find((p) => p.id === placeId);
  if (!place) return res.status(404).json({ error: "Place not found" });

  const user = await findUserById(req.userId);
  const saved = new Set(user.saved_places || []);
  saved.add(placeId);
  const updated = await updateUser(req.userId, { saved_places: [...saved] });
  logEvent("save_place", { userId: req.userId, userEmail: req.userEmail, meta: { placeId, placeName: place.name } });
  res.json({ user: publicUser(updated) });
});

router.delete("/:id/save", requireAuth, async (req, res) => {
  const placeId = Number(req.params.id);
  const user = await findUserById(req.userId);
  const saved = (user.saved_places || []).filter((id) => id !== placeId);
  const updated = await updateUser(req.userId, { saved_places: saved });
  logEvent("unsave_place", { userId: req.userId, userEmail: req.userEmail, meta: { placeId } });
  res.json({ user: publicUser(updated) });
});

export { PLACES };
export default router;
