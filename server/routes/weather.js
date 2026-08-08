import { Router } from "express";

const router = Router();

// Douala's coordinates. Open-Meteo is free and needs no API key —
// if you'd rather use OpenWeatherMap, swap the fetch below and read
// process.env.OPENWEATHER_API_KEY.
const DOUALA_LAT = 4.0511;
const DOUALA_LNG = 9.7679;

router.get("/", async (req, res) => {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${DOUALA_LAT}&longitude=${DOUALA_LNG}` +
    `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation` +
    `&daily=precipitation_probability_max,temperature_2m_max,temperature_2m_min` +
    `&timezone=Africa%2FLagos`;

  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Open-Meteo responded ${r.status}`);
    const data = await r.json();

    res.json({
      source: "open-meteo",
      current: {
        temperature_c: data.current?.temperature_2m,
        humidity_pct: data.current?.relative_humidity_2m,
        wind_kmh: data.current?.wind_speed_10m,
        precipitation_mm: data.current?.precipitation,
      },
      today: {
        high_c: data.daily?.temperature_2m_max?.[0],
        low_c: data.daily?.temperature_2m_min?.[0],
        rain_chance_pct: data.daily?.precipitation_probability_max?.[0],
      },
    });
  } catch (err) {
    console.error("Weather fetch failed:", err.message);
    // Graceful fallback so the UI never breaks if the network/API is unreachable —
    // Douala is tropical, so these are reasonable seasonal defaults.
    res.status(200).json({
      source: "fallback",
      current: { temperature_c: 27, humidity_pct: 85, wind_kmh: 12, precipitation_mm: 0 },
      today: { high_c: 30, low_c: 24, rain_chance_pct: 40 },
      note: "Live weather unavailable right now — showing typical Douala conditions.",
    });
  }
});

export default router;
