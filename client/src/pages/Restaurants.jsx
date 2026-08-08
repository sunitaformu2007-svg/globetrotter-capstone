import { useEffect, useState } from "react";
import { Api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import PlaceCard from "../components/PlaceCard";
import SkeletonGrid from "../components/SkeletonGrid";
import PlaceModal from "../components/PlaceModal";

export default function Restaurants() {
  const [cuisine, setCuisine] = useState("");
  const [maxCost, setMaxCost] = useState("");
  const [minRating, setMinRating] = useState("");
  const [data, setData] = useState(null);
  const [openPlace, setOpenPlace] = useState(null);
  const { user, token, refreshUser } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    Api.restaurants({ cuisine, max_cost: maxCost, min_rating: minRating }).then((d) => setData(d.results));
  }, [cuisine, maxCost, minRating]);

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
      <span className="eyebrow">Eat</span>
      <h1 className="section-title mt-1 mb-6">Restaurants around Douala</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          value={cuisine}
          onChange={(e) => setCuisine(e.target.value)}
          placeholder="Cuisine — try 'seafood' or 'Italian'"
          className="input w-64"
        />
        <select value={maxCost} onChange={(e) => setMaxCost(e.target.value)} className="input w-auto">
          <option value="">Any budget</option>
          <option value="15">Under $15</option>
          <option value="25">Under $25</option>
        </select>
        <select value={minRating} onChange={(e) => setMinRating(e.target.value)} className="input w-auto">
          <option value="">Any rating</option>
          <option value="4">4.0+</option>
          <option value="4.4">4.4+</option>
        </select>
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
          <div className="card p-10 text-center text-ink/50">No restaurants match those filters.</div>
        )
      ) : (
        <SkeletonGrid count={6} />
      )}

      {openPlace && <PlaceModal place={openPlace} onClose={() => setOpenPlace(null)} />}
    </div>
  );
}
