import { Router } from "express";
import { PLACES } from "./places.js";
import { optionalAuth } from "../middleware/auth.js";
import { logEvent } from "../utils/analytics.js";

const router = Router();

const INTEREST_TO_CATEGORY = {
  food: "restaurant",
  nightlife: "nightlife",
  museums: "culture",
  shopping: "market",
  beaches: "nature",
  family: "culture",
  adventure: "nature",
};

router.post("/", optionalAuth, (req, res) => {
  const { budget_fcfa, days, interests } = req.body || {};

  const numDays = Math.max(1, Math.min(14, Number(days) || 3));
  const dailyBudget = budget_fcfa ? Number(budget_fcfa) / numDays : Infinity;
  const wantedCategories = (interests || []).map((i) => INTEREST_TO_CATEGORY[i]).filter(Boolean);

  const pool = PLACES.filter((p) => !["emergency", "transportation"].includes(p.category)).sort(
    (a, b) => b.rating - a.rating
  );

  const scored = pool.map((p) => {
    let score = p.rating;
    if (wantedCategories.includes(p.category)) score += 2;
    if (p.avg_cost_fcfa <= dailyBudget) score += 1;
    return { ...p, _score: score };
  });
  scored.sort((a, b) => b._score - a._score);

  const hotels = scored.filter((p) => p.category === "hotel").slice(0, 3);
  const restaurants = scored.filter((p) => p.category === "restaurant");
  const activities = scored.filter((p) => !["hotel", "restaurant"].includes(p.category));

  const itinerary = [];
  let restaurantCursor = 0;
  let activityCursor = 0;
  let estimatedTransportFcfa = 0;

  for (let day = 1; day <= numDays; day++) {
    const dayActivities = activities.slice(activityCursor, activityCursor + 2);
    activityCursor += 2;
    const lunch = restaurants[restaurantCursor % restaurants.length];
    restaurantCursor += 1;

    estimatedTransportFcfa += 1500 * 3;

    itinerary.push({
      day,
      morning: dayActivities[0] || null,
      lunch: lunch || null,
      afternoon: dayActivities[1] || null,
    });
  }

  logEvent("trip_planned", {
    userId: req.userId,
    userEmail: req.userEmail,
    meta: { days: numDays, budget_fcfa: budget_fcfa || null, interests: interests || [] },
  });

  res.json({
    days: numDays,
    budget_fcfa: budget_fcfa || null,
    interests: interests || [],
    itinerary,
    estimated_transport_fcfa: estimatedTransportFcfa,
    hotel_recommendations: hotels,
  });
});

export default router;
