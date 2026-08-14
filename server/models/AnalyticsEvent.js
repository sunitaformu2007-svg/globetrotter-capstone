import mongoose from "mongoose";

const analyticsEventSchema = new mongoose.Schema({
  event_type: { type: String, required: true }, // e.g. "register", "login", "page_view", "search", "place_view", "chat_message", "save_place", "trip_planned"
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  user_email: { type: String, default: null }, // denormalized for easy reading in Atlas's table view
  path: { type: String, default: null },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  created_at: { type: Date, default: Date.now },
});

export const AnalyticsEventModel =
  mongoose.models.AnalyticsEvent || mongoose.model("AnalyticsEvent", analyticsEventSchema);
