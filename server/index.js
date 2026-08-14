import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";

import { connectDb, isDbConfigured } from "./utils/mongo.js";
import authRoutes from "./routes/auth.js";
import placesRoutes from "./routes/places.js";
import plannerRoutes from "./routes/planner.js";
import weatherRoutes from "./routes/weather.js";
import directionsRoutes from "./routes/directions.js";
import chatRoutes from "./routes/chat.js";
import analyticsRoutes from "./routes/analytics.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Douala Travel Assistant API",
    database_connected: isDbConfigured(),
    ai_configured: Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/places", placesRoutes);
app.use("/api/planner", plannerRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/directions", directionsRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

app.listen(PORT, () => {
  console.log(`Douala Travel Assistant API listening on http://localhost:${PORT}`);
});

// Connect to the database in the background — the server starts responding
// immediately either way, and automatically uses file storage until (or
// unless) this connection succeeds.
connectDb();
