import jwt from "jsonwebtoken";
import { userIdOf } from "../utils/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-only-insecure-secret";

export function signToken(user) {
  return jwt.sign({ sub: userIdOf(user), email: user.email }, JWT_SECRET, { expiresIn: "7d" });
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Missing bearer token" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    req.userEmail = payload.email;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Like requireAuth, but never blocks the request — just attaches
 * req.userId/req.userEmail when a valid token is present. Used on public
 * endpoints so analytics can be tied to a signed-in user when possible,
 * without requiring login for basic browsing.
 */
export function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.userId = payload.sub;
      req.userEmail = payload.email;
    } catch (err) {
      // Invalid/expired token on a public route — just proceed anonymously.
    }
  }
  next();
}
