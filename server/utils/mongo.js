import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

let isConnected = false;
let hasWarnedMissing = false;
let hasWarnedFailed = false;

/**
 * Reflects whether MongoDB is actually connected right now — not just
 * whether the setting exists. This matters: if MONGODB_URI is set but
 * wrong (a very common first-attempt mistake — a typo, wrong password,
 * IP not whitelisted), requests must still fall back to file storage
 * instead of hanging while mongoose waits to reconnect.
 */
export function isDbConfigured() {
  return isConnected;
}

export async function connectDb() {
  if (!MONGODB_URI) {
    if (!hasWarnedMissing) {
      console.warn(
        "\n⚠️  No MONGODB_URI set — using local file storage instead of a real database.\n" +
          "   User accounts and analytics will NOT persist reliably on hosting services\n" +
          "   like Render's free tier. Add a MONGODB_URI environment variable to fix this.\n"
      );
      hasWarnedMissing = true;
    }
    return;
  }

  try {
    // Fail fast (5s) instead of mongoose's 30s default — so a wrong
    // connection string falls back to file storage quickly rather than
    // making every request hang.
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    isConnected = true;
    console.log("✅ Connected to MongoDB — using it for users and analytics.");
  } catch (err) {
    isConnected = false;
    if (!hasWarnedFailed) {
      console.error(
        "\n⚠️  MONGODB_URI is set but the connection failed:", err.message,
        "\n   Falling back to local file storage. Double-check your connection string,",
        "\n   password, and that your IP/0.0.0.0/0 is allowed in MongoDB Atlas's Network Access.\n"
      );
      hasWarnedFailed = true;
    }
  }
}

mongoose.connection.on("disconnected", () => {
  isConnected = false;
});
mongoose.connection.on("reconnected", () => {
  isConnected = true;
});
