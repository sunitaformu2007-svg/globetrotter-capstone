import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { Api, CATEGORY_LABELS } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import PlaceCard from "../components/PlaceCard";
import SkeletonGrid from "../components/SkeletonGrid";
import CategoryChips from "../components/CategoryChips";
import PlaceModal from "../components/PlaceModal";

export default function Explore() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [category, setCategory] = useState(params.get("category") || null);
  const [maxCost, setMaxCost] = useState("");
  const [data, setData] = useState(null);
  const [openPlace, setOpenPlace] = useState(null);
  const { user, token, refreshUser } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    Api.places({ q, category, max_cost: maxCost }).then(setData);
  }, [q, category, maxCost]);

  function onSubmit(e) {
    e.preventDefault();
    setParams(q ? { q } : {});
  }

  async function toggleSave(place) {
    if (!token) {
      showToast("Sign in to save places", "error");
      return;
    }
    const saved = new Set(user?.saved_places || []);
    try {
      if (saved.has(place.id)) {
        const { user: u } = await Api.unsavePlace(place.id, token);
        refreshUser(u);
        showToast(`Removed ${place.name} from saved`, "info");
      } else {
        const { user: u } = await Api.savePlace(place.id, token);
        refreshUser(u);
        showToast(`Saved ${place.name}`, "success");
      }
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <span className="eyebrow">Explore</span>
      <h1 className="section-title mt-1 mb-6">Find your way around Douala</h1>

      <form onSubmit={onSubmit} className="flex gap-2 mb-5 max-w-xl">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, neighborhood or vibe…"
            className="input pl-10"
          />
        </div>
        <select value={maxCost} onChange={(e) => setMaxCost(e.target.value)} className="input w-40">
          <option value="">Any budget</option>
          <option value="15">Under $15</option>
          <option value="60">Under $60</option>
          <option value="200">Under $200</option>
        </select>
        <button className="btn-primary">Search</button>
      </form>

      {data && (
        <CategoryChips
          categories={data.categories}
          active={category}
          onChange={setCategory}
          labels={CATEGORY_LABELS}
        />
      )}

      <p className="text-sm text-ink/50 mt-5 mb-3">
        {data ? `${data.count} place${data.count === 1 ? "" : "s"} found` : "Loading…"}
      </p>

      {data ? (
        data.results.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.results.map((p) => (
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
          <div className="card p-10 text-center text-ink/50">
            No places match that search. Try a different term, category or budget.
          </div>
        )
      ) : (
        <SkeletonGrid count={9} />
      )}

      {openPlace && <PlaceModal place={openPlace} onClose={() => setOpenPlace(null)} />}
    </div>
  );
}
