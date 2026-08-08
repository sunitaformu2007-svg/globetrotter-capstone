import { useEffect, useState } from "react";
import { X, Star, Phone, MapPin, Navigation } from "lucide-react";
import { Api, fcfa } from "../lib/api";
import MapView from "./MapView";
import PlaceImage from "./PlaceImage";

export default function PlaceModal({ place, onClose }) {
  const [userLoc, setUserLoc] = useState(null);
  const [route, setRoute] = useState(null);
  const [routing, setRouting] = useState(false);
  const [routeError, setRouteError] = useState(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function getDirections() {
    setRouting(true);
    setRouteError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLoc(loc);
        try {
          const r = await Api.route({
            from_lat: loc.lat,
            from_lng: loc.lng,
            to_lat: place.lat,
            to_lng: place.lng,
            mode: "driving",
          });
          setRoute(r);
        } catch (err) {
          setRouteError(err.message);
        } finally {
          setRouting(false);
        }
      },
      () => {
        setRouteError("Couldn't get your location — check your browser's location permission.");
        setRouting(false);
      }
    );
  }

  return (
    <div
      className="fixed inset-0 z-[180] bg-ink/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl2 max-w-2xl w-full max-h-[88vh] overflow-y-auto shadow-card-hover"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-44 relative">
          <PlaceImage place={place} className="w-full h-full object-cover" />
          {place.image_credit && (
            <span className="absolute bottom-1.5 right-2 text-[10px] text-white/80 bg-black/40 px-1.5 py-0.5 rounded">
              {place.image_credit}
            </span>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white shadow-card flex items-center justify-center"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="chip mb-2">{place.category}</span>
              <h2 className="text-2xl font-display font-bold text-ink">{place.name}</h2>
              <p className="text-sm text-ink/50 flex items-center gap-1 mt-1">
                <MapPin size={14} /> {place.area}
              </p>
            </div>
            {place.rating && (
              <span className="chip shrink-0">
                <Star size={13} className="fill-sun text-sun" /> {place.rating}
              </span>
            )}
          </div>

          <p className="text-ink/70 mt-4">{place.description}</p>

          {place.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {place.tags.map((t) => (
                <span key={t} className="chip">{t}</span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
            <InfoRow label="Cost" value={fcfa(place.avg_cost_fcfa)} />
            <InfoRow label="Hours" value={place.opening_hours} />
            {place.phone && <InfoRow label="Phone" value={place.phone} />}
            {place.cuisine && <InfoRow label="Cuisine" value={place.cuisine} />}
            {place.entry_fee_fcfa !== undefined && <InfoRow label="Entry fee" value={fcfa(place.entry_fee_fcfa)} />}
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            {place.phone && (
              <a href={`tel:${place.phone}`} className="btn-secondary">
                <Phone size={16} /> Call
              </a>
            )}
            <button onClick={getDirections} className="btn-primary" disabled={routing}>
              <Navigation size={16} /> {routing ? "Finding route…" : "Directions from me"}
            </button>
          </div>

          {route && (
            <div className="mt-4 p-3 rounded-xl bg-mist border border-cloud text-sm flex flex-wrap gap-4">
              <span><strong>{route.distance_km} km</strong> away</span>
              <span>~<strong>{Math.round(route.duration_min)} min</strong> by car</span>
              {route.taxi_fare_estimate_fcfa && (
                <span>Taxi: ~<strong>{route.taxi_fare_estimate_fcfa.toLocaleString()} FCFA</strong></span>
              )}
            </div>
          )}
          {routeError && <p className="mt-3 text-sm text-red-500">{routeError}</p>}

          <div className="h-40 rounded-xl overflow-hidden border border-cloud mt-5">
            <MapView places={[place]} center={[place.lat, place.lng]} zoom={15} userLocation={userLoc} route={route} />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-ink/40 uppercase tracking-wide">{label}</p>
      <p className="font-medium text-ink">{value}</p>
    </div>
  );
}
