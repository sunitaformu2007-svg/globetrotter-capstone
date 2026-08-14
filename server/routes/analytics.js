import { Router } from "express";
import { optionalAuth } from "../middleware/auth.js";
import { logEvent } from "../utils/analytics.js";
import { isDbConfigured } from "../utils/mongo.js";
import { AnalyticsEventModel } from "../models/AnalyticsEvent.js";

const router = Router();

router.post("/track", optionalAuth, (req, res) => {
  const { eventType, path, meta } = req.body || {};
  if (!eventType) return res.status(400).json({ error: "eventType is required" });

  logEvent(eventType, {
    userId: req.userId,
    userEmail: req.userEmail,
    path: path || null,
    meta: meta || {},
  });
  res.status(204).end();
});

// Simple summary so you don't strictly need to open MongoDB Atlas just to
// see how many people are using the site. Intentionally read-only and
// intentionally not exposing individual users' emails in the counts.
router.get("/summary", async (req, res) => {
  if (!isDbConfigured()) {
    return res.json({ configured: false, message: "No database connected yet — nothing to summarize." });
  }

  const [totalEvents, byType, uniqueUsers, last7Days] = await Promise.all([
    AnalyticsEventModel.countDocuments(),
    AnalyticsEventModel.aggregate([{ $group: { _id: "$event_type", count: { $sum: 1 } } }]),
    AnalyticsEventModel.distinct("user_email"),
    AnalyticsEventModel.countDocuments({ created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
  ]);

  res.json({
    configured: true,
    total_events: totalEvents,
    events_last_7_days: last7Days,
    unique_signed_in_users: uniqueUsers.filter(Boolean).length,
    by_event_type: Object.fromEntries(byType.map((b) => [b._id, b.count])),
  });
});

export default router;
