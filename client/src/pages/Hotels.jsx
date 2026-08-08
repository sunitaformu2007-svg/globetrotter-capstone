import { useEffect, useState } from "react";
import { Wifi, Car, Waves, Bus } from "lucide-react";
import { Api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import PlaceCard from "../components/PlaceCard";
import SkeletonGrid from "../components/SkeletonGrid";
import PlaceModal from "../components/PlaceModal";

const AMENITIES = [
  { key: "wifi", label: "Wi-Fi", icon: Wifi },
  { key: "parking", label: "Parking", icon: Car },
  { key: "pool", label: "Pool", icon: Waves },
  { key: "airport_shuttle", label: "Airport shuttle", icon: Bus },
];

export default function Hotels() {
  const [filters, setFilters] = useState({});
  const [maxCost, setMaxCost] = useState("");
  const [minRating, setMinRating] = useState("");
  const [data, setData] = useState(null);
  const [openPlace, setOpenPlace] = useState(null);
  const { user, token, refreshUser } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    Api.hotels({ ...filters, max_cost: maxCost, min_rating: minRating }).then((d) => setData(d.results));
  }, [filters, maxCost, minRating]);

  function toggleAmenity(key) {
    setFilters((f) => ({ ...f, [key]: f[key] ? undefined : "true" }));
  }

  async function toggleSave(place) {
    if (!token) return showToast("Sign in to save places", "error");
    const saved = new Set(user?.saved_places || []);
    const { user: u } = saved.has(place.id)
      ? await Api.unsavePlace(place.id, token)
      : await Api.savePlace(place.id, token);
    refreshUser(u);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <span className="eyebrow">Stay</span>
      <h1 className="section-title mt-1 mb-6">Find a hotel in Douala</h1>

      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <select value={maxCost} onChange={(e) => setMaxCost(e.target.value)} className="input w-auto">
          <option value="">Any price</option>
          <option value="60">Under $60/night</option>
          <option value="100">Under $100/night</option>
          <option value="200">Under $200/night</option>
        </select>
        <select value={minRating} onChange={(e) => setMinRating(e.target.value)} className="input w-auto">
          <option value="">Any rating</option>
          <option value="4">4.0+</option>
          <option value="4.3">4.3+</option>
        </select>
        <div className="flex gap-2">
          {AMENITIES.map((a) => (
            <button
              key={a.key}
              onClick={() => toggleAmenity(a.key)}
              className={filters[a.key] ? "chip-active" : "chip hover:bg-cloud"}
              title={a.label}
            >
              <a.icon size={13} /> {a.label}
            </button>
          ))}
        </div>
      </div>

      {data ? (
        data.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.map((p) => (
              <PlaceCard
                key={p.id}
                place={p}
                saved={user?.saved_places?.includes(p.id)}
                onToggleSave={toggleSave}
                onOpen={setOpenPlace}
              />
            ))}
          </div>
        ) : (
          <div className="card p-10 text-center text-ink/50">No hotels match those filters.</div>
        )
      ) : (
        <SkeletonGrid count={6} />
      )}

      {openPlace && <PlaceModal place={openPlace} onClose={() => setOpenPlace(null)} />}
    </div>
  );
}
