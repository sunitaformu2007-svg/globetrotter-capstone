import { isDbConfigured } from "./mongo.js";
import { AnalyticsEventModel } from "../models/AnalyticsEvent.js";

/**
 * Fire-and-forget event logger. Safe to call from anywhere — does nothing
 * if no database is connected yet, and never throws or slows down the
 * response it's called from.
 */
export function logEvent(eventType, { userId = null, userEmail = null, path = null, meta = {} } = {}) {
  if (!isDbConfigured()) return;
  AnalyticsEventModel.create({
    event_type: eventType,
    user_id: userId,
    user_email: userEmail,
    path,
    meta,
  }).catch((err) => {
    console.error(`Failed to log analytics event "${eventType}":`, err.message);
  });
}
