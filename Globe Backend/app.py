"""
GlobeTrotter Travel Assistant — Phase 1: The Monolith
A single Flask app handling API + business logic + JSON-file data access,
exactly as described in the Phase 1 brief (no database yet).

Run:
    pip install -r requirements.txt
    python app.py
Server starts on http://localhost:5000
"""

import os
import json
import threading
import datetime
from functools import wraps

import jwt
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = Flask(__name__)
CORS(app)  # Phase 1: wide open so the static HTML/CSS/JS frontend can call the API freely

app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "globetrotter-dev-secret-change-me")
TOKEN_EXPIRY_DAYS = 7

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
DB_PATH = os.path.join(DATA_DIR, "db.json")

_db_lock = threading.Lock()  # Phase 1 "database": a JSON file, so writes are serialized in-process


# ---------------------------------------------------------------------------
# Data Access layer (the "Data Access" component from the architecture diagram)
# ---------------------------------------------------------------------------

def load_db():
    with _db_lock:
        with open(DB_PATH, "r", encoding="utf-8") as f:
            return json.load(f)


def save_db(db):
    with _db_lock:
        tmp_path = DB_PATH + ".tmp"
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(db, f, indent=2)
        os.replace(tmp_path, DB_PATH)


def public_user(user):
    """Strip sensitive fields before sending a user object to the client."""
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "preferences": user.get("preferences", []),
        "home_base": user.get("home_base", ""),
        "created_at": user.get("created_at"),
    }


# ---------------------------------------------------------------------------
# Auth helpers (Authentication component)
# ---------------------------------------------------------------------------

def issue_token(user_id):
    payload = {
        "sub": user_id,
        "iat": datetime.datetime.utcnow(),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=TOKEN_EXPIRY_DAYS),
    }
    return jwt.encode(payload, app.config["SECRET_KEY"], algorithm="HS256")


def login_required(view_fn):
    @wraps(view_fn)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or malformed Authorization header"}), 401
        token = auth_header.split(" ", 1)[1]
        try:
            payload = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Session expired, please log in again"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid authentication token"}), 401

        db = load_db()
        user = next((u for u in db["users"] if u["id"] == payload["sub"]), None)
        if not user:
            return jsonify({"error": "User no longer exists"}), 401

        g.user = user
        g.db = db
        return view_fn(*args, **kwargs)

    return wrapper


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "phase": "1 - monolith"})


# ---------------------------------------------------------------------------
# Auth endpoints — POST /register, POST /login
# ---------------------------------------------------------------------------

@app.post("/api/register")
def register():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    preferences = data.get("preferences") or []

    if not name or not email or not password:
        return jsonify({"error": "name, email and password are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    if not isinstance(preferences, list):
        return jsonify({"error": "preferences must be a list of categories"}), 400

    db = load_db()
    if any(u["email"] == email for u in db["users"]):
        return jsonify({"error": "An account with this email already exists"}), 409

    user = {
        "id": db["next_user_id"],
        "name": name,
        "email": email,
        "password_hash": generate_password_hash(password),
        "preferences": preferences,
        "home_base": data.get("home_base", ""),
        "created_at": datetime.datetime.utcnow().isoformat(),
    }
    db["users"].append(user)
    db["next_user_id"] += 1
    save_db(db)

    token = issue_token(user["id"])
    return jsonify({"token": token, "user": public_user(user)}), 201


@app.post("/api/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    db = load_db()
    user = next((u for u in db["users"] if u["email"] == email), None)
    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid email or password"}), 401

    token = issue_token(user["id"])
    return jsonify({"token": token, "user": public_user(user)}), 200


@app.get("/api/profile")
@login_required
def get_profile():
    return jsonify(public_user(g.user)), 200


@app.put("/api/profile")
@login_required
def update_profile():
    data = request.get_json(silent=True) or {}
    db = g.db
    user = next(u for u in db["users"] if u["id"] == g.user["id"])

    if "name" in data and data["name"].strip():
        user["name"] = data["name"].strip()
    if "preferences" in data and isinstance(data["preferences"], list):
        user["preferences"] = data["preferences"]
    if "home_base" in data:
        user["home_base"] = data["home_base"]

    save_db(db)
    return jsonify(public_user(user)), 200


# ---------------------------------------------------------------------------
# Destinations — GET /destinations (search), GET /destinations/<id>
# ---------------------------------------------------------------------------

@app.get("/api/destinations")
def search_destinations():
    db = load_db()
    destinations = db["destinations"]

    query = (request.args.get("search") or "").strip().lower()
    category = (request.args.get("category") or "").strip().lower()
    max_cost = request.args.get("max_cost", type=float)

    def matches(d):
        if query:
            haystack = " ".join([d["name"], d["country"], d["category"], *d["tags"]]).lower()
            if query not in haystack:
                return False
        if category and category != "all" and d["category"] != category:
            return False
        if max_cost is not None and d["avg_cost_usd"] > max_cost:
            return False
        return True

    results = [d for d in destinations if matches(d)]
    results.sort(key=lambda d: d["rating"], reverse=True)

    return jsonify({
        "count": len(results),
        "categories": sorted({d["category"] for d in destinations}),
        "results": results,
    }), 200


@app.get("/api/destinations/<int:dest_id>")
def get_destination(dest_id):
    db = load_db()
    destination = next((d for d in db["destinations"] if d["id"] == dest_id), None)
    if not destination:
        return jsonify({"error": "Destination not found"}), 404
    return jsonify(destination), 200


# ---------------------------------------------------------------------------
# Recommendations — GET /recommendations (Business Logic component)
# ---------------------------------------------------------------------------

@app.get("/api/recommendations")
@login_required
def recommendations():
    db = g.db
    user = g.user
    preferences = set(p.lower() for p in user.get("preferences", []))
    planned_ids = {it["destination_id"] for it in db["itineraries"] if it["user_id"] == user["id"]}

    def score(d):
        tags = set(t.lower() for t in d["tags"]) | {d["category"].lower()}
        overlap = len(tags & preferences)
        return (overlap, d["rating"])

    destinations = list(db["destinations"])
    destinations.sort(key=score, reverse=True)

    limit = request.args.get("limit", default=8, type=int)
    top = destinations[:limit]

    results = []
    for d in top:
        item = dict(d)
        item["already_planned"] = d["id"] in planned_ids
        item["matched_preferences"] = sorted(
            (set(t.lower() for t in d["tags"]) | {d["category"].lower()}) & preferences
        )
        results.append(item)

    basis = "your saved interests" if preferences else "overall traveler ratings"
    return jsonify({"basis": basis, "results": results}), 200


# ---------------------------------------------------------------------------
# Itineraries — POST /itineraries, GET /itineraries, GET/PUT/DELETE /itineraries/<id>
# ---------------------------------------------------------------------------

VALID_STATUSES = {"planned", "confirmed", "completed"}


@app.post("/api/itineraries")
@login_required
def create_itinerary():
    data = request.get_json(silent=True) or {}
    db = g.db

    title = (data.get("title") or "").strip()
    destination_id = data.get("destination_id")
    start_date = data.get("start_date")
    end_date = data.get("end_date")

    if not title:
        return jsonify({"error": "title is required"}), 400
    if not isinstance(destination_id, int):
        return jsonify({"error": "destination_id is required"}), 400
    if not next((d for d in db["destinations"] if d["id"] == destination_id), None):
        return jsonify({"error": "Unknown destination_id"}), 400
    if not start_date or not end_date:
        return jsonify({"error": "start_date and end_date are required (YYYY-MM-DD)"}), 400
    if start_date > end_date:
        return jsonify({"error": "start_date must be before end_date"}), 400

    itinerary = {
        "id": db["next_itinerary_id"],
        "user_id": g.user["id"],
        "title": title,
        "destination_id": destination_id,
        "start_date": start_date,
        "end_date": end_date,
        "notes": data.get("notes", ""),
        "status": data.get("status") if data.get("status") in VALID_STATUSES else "planned",
        "created_at": datetime.datetime.utcnow().isoformat(),
        "updated_at": datetime.datetime.utcnow().isoformat(),
    }
    db["itineraries"].append(itinerary)
    db["next_itinerary_id"] += 1
    save_db(db)

    return jsonify(itinerary), 201


def _itinerary_with_destination(itinerary, db):
    destination = next((d for d in db["destinations"] if d["id"] == itinerary["destination_id"]), None)
    out = dict(itinerary)
    out["destination"] = destination
    return out


@app.get("/api/itineraries")
@login_required
def list_itineraries():
    db = g.db
    mine = [it for it in db["itineraries"] if it["user_id"] == g.user["id"]]
    mine.sort(key=lambda it: it["start_date"])
    return jsonify({
        "count": len(mine),
        "results": [_itinerary_with_destination(it, db) for it in mine],
    }), 200


def _find_owned_itinerary(db, itinerary_id, user_id):
    return next(
        (it for it in db["itineraries"] if it["id"] == itinerary_id and it["user_id"] == user_id),
        None,
    )


@app.get("/api/itineraries/<int:itinerary_id>")
@login_required
def get_itinerary(itinerary_id):
    db = g.db
    itinerary = _find_owned_itinerary(db, itinerary_id, g.user["id"])
    if not itinerary:
        return jsonify({"error": "Itinerary not found"}), 404
    return jsonify(_itinerary_with_destination(itinerary, db)), 200


@app.put("/api/itineraries/<int:itinerary_id>")
@login_required
def update_itinerary(itinerary_id):
    db = g.db
    itinerary = _find_owned_itinerary(db, itinerary_id, g.user["id"])
    if not itinerary:
        return jsonify({"error": "Itinerary not found"}), 404

    data = request.get_json(silent=True) or {}
    for field in ("title", "start_date", "end_date", "notes"):
        if field in data and data[field] is not None:
            itinerary[field] = data[field]
    if data.get("status") in VALID_STATUSES:
        itinerary["status"] = data["status"]
    if itinerary["start_date"] > itinerary["end_date"]:
        return jsonify({"error": "start_date must be before end_date"}), 400

    itinerary["updated_at"] = datetime.datetime.utcnow().isoformat()
    save_db(db)
    return jsonify(_itinerary_with_destination(itinerary, db)), 200


@app.delete("/api/itineraries/<int:itinerary_id>")
@login_required
def delete_itinerary(itinerary_id):
    db = g.db
    itinerary = _find_owned_itinerary(db, itinerary_id, g.user["id"])
    if not itinerary:
        return jsonify({"error": "Itinerary not found"}), 404

    db["itineraries"] = [it for it in db["itineraries"] if it["id"] != itinerary_id]
    save_db(db)
    return jsonify({"message": "Itinerary deleted"}), 200


# ---------------------------------------------------------------------------
# Error handlers
# ---------------------------------------------------------------------------

@app.errorhandler(404)
def not_found(_e):
    return jsonify({"error": "Not found"}), 404


@app.errorhandler(405)
def method_not_allowed(_e):
    return jsonify({"error": "Method not allowed"}), 405


@app.errorhandler(500)
def server_error(_e):
    return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
