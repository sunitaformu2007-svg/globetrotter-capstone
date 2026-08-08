import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "data", "users.json");

let writeLock = Promise.resolve();

function readDb() {
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

// Serializes writes so concurrent requests can't clobber each other —
// good enough for a small file-backed store like this one.
function writeDb(data) {
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

export function getUsers() {
  return readDb().users;
}

export function findUserByEmail(email) {
  const db = readDb();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id) {
  const db = readDb();
  return db.users.find((u) => u.id === id);
}

export async function createUser({ name, email, passwordHash, location, preferences }) {
  const db = readDb();
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
  await writeDb(db);
  return user;
}

export async function updateUser(id, patch) {
  const db = readDb();
  const idx = db.users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  db.users[idx] = { ...db.users[idx], ...patch };
  await writeDb(db);
  return db.users[idx];
}

export function publicUser(user) {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  return rest;
}
