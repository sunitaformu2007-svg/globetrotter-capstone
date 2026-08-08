import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Api, CATEGORY_LABELS } from "../lib/api";
import PlaceCard from "../components/PlaceCard";
import SkeletonGrid from "../components/SkeletonGrid";
import PlaceModal from "../components/PlaceModal";
import WeatherWidget from "../components/WeatherWidget";

export default function Dashboard() {
  const { user, token, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [saved, setSaved] = useState(null);
  const [openPlace, setOpenPlace] = useState(null);

  useEffect(() => {
    if (!user?.saved_places?.length) {
      setSaved([]);
      return;
    }
    Api.places({}).then((d) => {
      setSaved(d.results.filter((p) => user.saved_places.includes(p.id)));
    });
  }, [user]);

  async function unsave(place) {
    const { user: u } = await Api.unsavePlace(place.id, token);
    refreshUser(u);
    showToast(`Removed ${place.name}`, "info");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <span className="eyebrow">Dashboard</span>
      <h1 className="section-title mt-1 mb-6">Hi {user?.name?.split(" ")[0]}, welcome back</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="font-display font-semibold text-lg mb-3">Saved places</h2>
            {saved === null ? (
              <SkeletonGrid count={3} />
            ) : saved.length ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {saved.map((p) => (
                  <PlaceCard key={p.id} place={p} saved onToggleSave={unsave} onOpen={setOpenPlace} />
                ))}
              </div>
            ) : (
              <div className="card p-8 text-center text-ink/50">
                Nothing saved yet — bookmark places from Explore to see them here.
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <WeatherWidget compact />

          <div className="card p-5">
            <h3 className="font-display font-semibold mb-3">Profile</h3>
            <dl className="text-sm space-y-2">
              <Row label="Name" value={user?.name} />
              <Row label="Email" value={user?.email} />
              <Row label="Based in" value={user?.location} />
            </dl>
          </div>

          <div className="card p-5">
            <h3 className="font-display font-semibold mb-3">Your interests</h3>
            <div className="flex flex-wrap gap-2">
              {user?.preferences?.length ? (
                user.preferences.map((p) => (
                  <span key={p} className="chip">{CATEGORY_LABELS[p] || p}</span>
                ))
              ) : (
                <p className="text-sm text-ink/50">No preferences set yet.</p>
              )}
            </div>
          </div>
        </aside>
      </div>

      {openPlace && <PlaceModal place={openPlace} onClose={() => setOpenPlace(null)} />}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink/50">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}
