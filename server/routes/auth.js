import { Router } from "express";
import bcrypt from "bcryptjs";
import { createUser, findUserByEmail, findUserById, publicUser } from "../utils/db.js";
import { signToken, requireAuth } from "../middleware/auth.js";
import { logEvent } from "../utils/analytics.js";

const router = Router();

router.post("/register", async (req, res) => {
  const { name, email, password, location, preferences } = req.body || {};

  const cleanName = (name || "").trim();
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanLocation = (location || "").trim();

  if (!cleanName || !cleanEmail || !password || !cleanLocation) {
    return res.status(400).json({ error: "name, email, location and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  if (await findUserByEmail(cleanEmail)) {
    return res.status(409).json({ error: "An account with that email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await createUser({
    name: cleanName,
    email: cleanEmail,
    passwordHash,
    location: cleanLocation,
    preferences: Array.isArray(preferences) ? preferences : [],
  });

  const token = signToken(user);
  const pub = publicUser(user);
  logEvent("register", { userId: pub.id, userEmail: pub.email, meta: { location: cleanLocation, preferences } });
  res.status(201).json({ token, user: pub });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  const cleanEmail = (email || "").trim().toLowerCase();

  const user = await findUserByEmail(cleanEmail);
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const ok = await bcrypt.compare(password || "", user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = signToken(user);
  const pub = publicUser(user);
  logEvent("login", { userId: pub.id, userEmail: pub.email });
  res.json({ token, user: pub });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await findUserById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: publicUser(user) });
});

export default router;
