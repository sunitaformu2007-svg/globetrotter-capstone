import { useEffect, useState } from "react";
import { Cloud, Droplets, Wind, CloudRain } from "lucide-react";
import { Api } from "../lib/api";

export default function WeatherWidget({ compact = false }) {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    Api.weather()
      .then(setWeather)
      .catch(() => setError(true));
  }, []);

  if (error) return null;

  if (!weather) {
    return (
      <div className={`card p-4 animate-pulse ${compact ? "" : "p-6"}`}>
        <div className="h-4 bg-cloud rounded w-1/2 mb-2" />
        <div className="h-8 bg-cloud rounded w-1/3" />
      </div>
    );
  }

  return (
    <div className={`card ${compact ? "p-4" : "p-6"} bg-gradient-to-br from-ocean to-palm text-white`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/70">Douala today</p>
          <p className="text-3xl font-display font-bold">{Math.round(weather.current?.temperature_c)}°C</p>
          <p className="text-xs text-white/70">
            H {Math.round(weather.today?.high_c)}° · L {Math.round(weather.today?.low_c)}°
          </p>
        </div>
        <Cloud size={compact ? 32 : 44} className="text-white/80" />
      </div>
      <div className="flex gap-4 mt-3 text-xs text-white/80">
        <span className="flex items-center gap-1"><Droplets size={13} /> {weather.current?.humidity_pct}%</span>
        <span className="flex items-center gap-1"><Wind size={13} /> {Math.round(weather.current?.wind_kmh)} km/h</span>
        <span className="flex items-center gap-1"><CloudRain size={13} /> {weather.today?.rain_chance_pct}%</span>
      </div>
      {weather.note && <p className="text-[11px] text-white/60 mt-2 italic">{weather.note}</p>}
    </div>
  );
}
