import { useEffect, useState } from "react";
import { Api, CATEGORY_LABELS } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import PlaceCard from "../components/PlaceCard";
import SkeletonGrid from "../components/SkeletonGrid";
import CategoryChips from "../components/CategoryChips";
import PlaceModal from "../components/PlaceModal";

export default function Attractions() {
  const [all, setAll] = useState(null);
  const [category, setCategory] = useState(null);
  const [openPlace, setOpenPlace] = useState(null);
  const { user, token, refreshUser } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    Api.attractions().then((d) => setAll(d.results));
  }, []);

  async function toggleSave(place) {
    if (!token) return showToast("Sign in to save places", "error");
    const saved = new Set(user?.saved_places || []);
    const { user: u } = saved.has(place.id)
      ? await Api.unsavePlace(place.id, token)
      : await Api.savePlace(place.id, token);
    refreshUser(u);
  }

  const categories = all ? [...new Set(all.map((p) => p.category))] : [];
  const filtered = all ? (category ? all.filter((p) => p.category === category) : all) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <span className="eyebrow">See & do</span>
      <h1 className="section-title mt-1 mb-6">Tourist attractions in Douala</h1>

      {all && (
        <div className="mb-6">
          <CategoryChips categories={categories} active={category} onChange={setCategory} labels={CATEGORY_LABELS} />
        </div>
      )}

      {filtered ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p) => (
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
        <SkeletonGrid count={6} />
      )}

      {openPlace && <PlaceModal place={openPlace} onClose={() => setOpenPlace(null)} />}
    </div>
  );
}
