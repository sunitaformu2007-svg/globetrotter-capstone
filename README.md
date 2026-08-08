# Douala Travel Assistant

An AI-powered travel assistant for Douala, Cameroon — restaurants, hotels, attractions, transportation,
weather and emergency services in one app.

**Works fully out of the box with zero API keys.** Maps, routing, weather and the chat assistant all use
free services by default (OpenStreetMap/Leaflet, OSRM, Open-Meteo, and a rule-based assistant). Add your
own Google Maps or OpenAI keys later to upgrade specific pieces — see "Upgrading" below.

## Stack

- **Client:** React + Vite + Tailwind CSS, React Router, Leaflet (maps)
- **Server:** Node.js + Express, JWT auth, JSON file storage (swap for a real DB whenever you're ready)

## Project structure

```
douala-travel-assistant/
├─ server/            Express API
│  ├─ data/places.json   44 Douala places (restaurants, hotels, attractions, transport, emergency)
│  ├─ routes/             auth, places, planner, weather, directions, chat
│  └─ index.js
└─ client/            React app
   └─ src/
      ├─ pages/          Home, Explore, Map, Trip Planner, Hotels, Restaurants, Attractions, Emergency,
      │                  Login, Register, Dashboard
      ├─ components/     Navbar, Footer, PlaceCard, MapView, ChatWidget, WeatherWidget, etc.
      └─ context/        Auth + Toast notifications
```

## Running it locally

**1. Start the API server**

```bash
cd server
cp .env.example .env      # then edit .env if you want to add keys later
npm install
npm run dev                # http://localhost:4000
```

**2. Start the client** (in a second terminal)

```bash
cd client
cp .env.example .env.local
npm install
npm run dev                # http://localhost:5173
```

Open `http://localhost:5173` — the app is fully functional immediately.

## Upgrading with your own API keys

Nothing below is required to run the app — these are optional upgrades.

| Feature | Default (no key needed) | Upgrade with a key |
|---|---|---|
| Chat assistant | Rule-based matcher over `places.json` — handles the example queries in the spec (nearest hospital, hotels under a budget, restaurants by area, etc.) | Set `OPENAI_API_KEY` in `server/.env` and the chat route automatically calls OpenAI for richer natural-language answers, still grounded only in your real places data |
| Map | Leaflet + OpenStreetMap tiles, fully interactive (pins, popups, geolocation, routes) | Set `VITE_GOOGLE_MAPS_API_KEY` in `client/.env.local` and swap `MapView.jsx` to `@react-google-maps/api` if you want Google's styling, Street View, or live traffic layer |
| Directions & fare estimate | Free OSRM public routing server | Swap the fetch URL in `server/routes/directions.js` for the Google Directions API |
| Weather | Free Open-Meteo API, no key | Swap `server/routes/weather.js` to OpenWeatherMap if you prefer |
| Auth | Built-in JWT auth (bcrypt + JSON file storage) | Swap `server/routes/auth.js` and `client/src/context/AuthContext.jsx` for Firebase Authentication if you want social login, phone auth, etc. |

## Notes on the data

`server/data/places.json` is a curated starting set of 44 real Douala places across 9 categories
(restaurants, cafés, nightlife, hotels, culture, markets, nature, transportation, emergency), researched
from public sources. Coordinates are neighborhood-level approximations, not exact addresses — verify
before using this for anything safety-critical. Replace it with a live data source (e.g. Google Places
API) whenever you're ready to scale beyond the curated set.
