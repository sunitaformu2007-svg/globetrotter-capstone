import { useEffect, useState } from "react";
import { Phone, Navigation2, ShieldAlert } from "lucide-react";
import { Api } from "../lib/api";
import MapView, { DOUALA_CENTER } from "../components/MapView";

export default function Emergency() {
  const [places, setPlaces] = useState(null);

  useEffect(() => {
    Api.emergency().then((d) => setPlaces(d.results));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-2 mb-1">
        <ShieldAlert size={20} className="text-red-500" />
        <span className="eyebrow text-red-500">Emergency</span>
      </div>
      <h1 className="section-title mb-2">Emergency services in Douala</h1>
      <p className="text-ink/60 max-w-2xl mb-8">
        Police, fire, medical and consular contacts, always within reach. If you're in immediate
        danger, call the number directly rather than waiting on directions.
      </p>

      <div className="grid lg:grid-cols-[1fr_420px] gap-8">
        <div className="space-y-3">
          {places ? (
            places.map((p) => (
              <div key={p.id} className="card p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-display font-semibold text-ink">{p.name}</p>
                  <p className="text-xs text-ink/50">{p.area}</p>
                  <p className="text-sm text-ink/60 mt-1">{p.description}</p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {p.phone && (
                    <a href={`tel:${p.phone}`} className="btn-primary !bg-red-500 hover:!bg-red-600">
                      <Phone size={15} /> {p.phone}
                    </a>
                  )}
                  <a
                    href={`https://www.openstreetmap.org/directions?to=${p.lat}%2C${p.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost text-xs"
                  >
                    <Navigation2 size={13} /> Directions
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="card p-10 text-center text-ink/50">Loading…</div>
          )}
        </div>

        <div className="h-[420px] rounded-xl2 overflow-hidden shadow-card border border-cloud sticky top-24">
          <MapView places={places || []} center={DOUALA_CENTER} zoom={12} />
        </div>
      </div>
    </div>
  );
}
