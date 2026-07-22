# GlobeTrotter — Phase 1 Backend (Monolith)

Single Flask app: API layer, business logic, and a JSON-file data layer,
matching the Phase 1 brief (no database yet).

## Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
python app.py
```

Server runs at `http://127.0.0.1:5000`. Data is stored in `data/db.json`
(seeded with 16 destinations). Delete the `users`/`itineraries` arrays in
that file any time to reset to a clean state.

## Endpoints

| Method | Path                        | Auth | Description                          |
|--------|-----------------------------|------|---------------------------------------|
| POST   | /api/register               | -    | Create a user, returns JWT            |
| POST   | /api/login                  | -    | Authenticate, returns JWT             |
| GET    | /api/profile                | ✓    | Get current user                      |
| PUT    | /api/profile                | ✓    | Update name/preferences/home_base     |
| GET    | /api/destinations           | -    | Search (`search`, `category`, `max_cost`) |
| GET    | /api/destinations/<id>      | -    | Single destination                    |
| GET    | /api/recommendations        | ✓    | Personalized picks (`limit`)          |
| POST   | /api/itineraries            | ✓    | Create an itinerary                   |
| GET    | /api/itineraries            | ✓    | List current user's itineraries       |
| GET    | /api/itineraries/<id>       | ✓    | Get one itinerary                     |
| PUT    | /api/itineraries/<id>       | ✓    | Update an itinerary                   |
| DELETE | /api/itineraries/<id>       | ✓    | Delete an itinerary                   |

Send the JWT as `Authorization: Bearer <token>` on protected routes.

## Notes for the defense

- **Data Access**: `load_db()` / `save_db()` read and atomically rewrite `data/db.json` — this is the "no database yet" constraint from the brief, made explicit and swappable later (Phase 2 would replace these two functions with real DB calls without touching the routes).
- **Business Logic**: `recommendations()` scores destinations by overlap with the user's stored preference tags, falling back to overall rating when a user has none set.
- **Authentication**: simple JWT (HS256) issued on register/login, checked by the `login_required` decorator.
- Known Phase 1 limitations to mention live: single JSON file (no concurrent-write safety beyond an in-process lock), no horizontal scaling, no service boundaries yet — exactly the pain points Phase 2 (microservices) is designed to fix.
