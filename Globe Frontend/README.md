# GlobeTrotter — Phase 1 Frontend

Static HTML/CSS/JS client for the Flask monolith. No build step, no framework.

## Setup

The backend must be running first at `http://127.0.0.1:5000` (see `backend/README.md`).

Then serve this folder with any static server — opening `index.html` directly
also works, but a local server avoids browser file:// quirks:

```bash
cd frontend
python -m http.server 8080
```

Visit `http://127.0.0.1:8080`.

If you run the backend on a different host/port, update `API_BASE` at the
top of `js/api.js`.

## Pages

- `index.html` — landing page
- `register.html` / `login.html` — auth, JWT stored in `localStorage`
- `dashboard.html` — personalized recommendations + itinerary preview
- `destinations.html` — search, category/budget filters, detail modal
- `itineraries.html` — create, edit, delete itineraries

## Design notes

Design system lives entirely in `css/style.css` as CSS variables. The visual
identity (ink-green / brass / passport-stamp red on aged paper, "boarding
pass" cards) is meant to read as a travel document rather than a generic
admin dashboard — a deliberate choice for the GlobeTrotter brief.
