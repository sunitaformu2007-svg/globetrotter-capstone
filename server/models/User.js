import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password_hash: { type: String, required: true },
  location: { type: String, default: "" },
  preferences: { type: [String], default: [] },
  saved_places: { type: [Number], default: [] },
  created_at: { type: Date, default: Date.now },
});

// Avoids "OverwriteModelError" when this file gets re-imported during
// hot-reload in development.
export const UserModel = mongoose.models.User || mongoose.model("User", userSchema);
