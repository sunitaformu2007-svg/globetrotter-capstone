import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { isDbConfigured } from "./mongo.js";
import { UserModel } from "../models/User.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "data", "users.json");

// ---------------------------------------------------------------------
// File-based fallback (used automatically if MONGODB_URI isn't set).
// This is the same simple approach the app started with — kept as a
// zero-setup fallback so the site still works before you connect a
// real database, and during local development without one.
// ---------------------------------------------------------------------

let writeLock = Promise.resolve();

function readFileDb() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = { users: [], next_user_id: 1 };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error("users.json is corrupted, resetting:", err.message);
    const initial = { users: [], next_user_id: 1 };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
}

function writeFileDb(data) {
  writeLock = writeLock.then(
    () =>
      new Promise((resolve, reject) => {
        fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), (err) => {
          if (err) reject(err);
          else resolve();
        });
      })
  );
  return writeLock;
}

// ---------------------------------------------------------------------
// Public API — every function below picks MongoDB or the file fallback
// automatically. Nothing calling these functions needs to know which one
// is active.
// ---------------------------------------------------------------------

export function getUsers() {
  if (isDbConfigured()) return UserModel.find({});
  return readFileDb().users;
}

export async function findUserByEmail(email) {
  if (isDbConfigured()) {
    return UserModel.findOne({ email: email.toLowerCase() });
  }
  const db = readFileDb();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export async function findUserById(id) {
  if (isDbConfigured()) {
    return UserModel.findById(id);
  }
  const db = readFileDb();
  return db.users.find((u) => String(u.id) === String(id));
}

export async function createUser({ name, email, passwordHash, location, preferences }) {
  if (isDbConfigured()) {
    const user = await UserModel.create({
      name,
      email,
      password_hash: passwordHash,
      location,
      preferences: preferences || [],
      saved_places: [],
    });
    return user;
  }

  const db = readFileDb();
  const user = {
    id: db.next_user_id,
    name,
    email,
    password_hash: passwordHash,
    location,
    preferences: preferences || [],
    saved_places: [],
    created_at: new Date().toISOString(),
  };
  db.users.push(user);
  db.next_user_id += 1;
  await writeFileDb(db);
  return user;
}

export async function updateUser(id, patch) {
  if (isDbConfigured()) {
    return UserModel.findByIdAndUpdate(id, patch, { new: true });
  }

  const db = readFileDb();
  const idx = db.users.findIndex((u) => String(u.id) === String(id));
  if (idx === -1) return null;
  db.users[idx] = { ...db.users[idx], ...patch };
  await writeFileDb(db);
  return db.users[idx];
}

/**
 * Returns the user's id as a plain string/number regardless of whether
 * it's a Mongo ObjectId or a file-based numeric id — useful since JWTs
 * and API responses need a consistent, serializable id.
 */
export function userIdOf(user) {
  return user._id ? String(user._id) : user.id;
}

export function publicUser(user) {
  if (!user) return null;
  const plain = user.toObject ? user.toObject() : user;
  const { password_hash, _id, __v, ...rest } = plain;
  return { id: userIdOf(user), ...rest };
}
