import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, MapPin, ShieldCheck, Utensils, Building2, Landmark } from "lucide-react";
import { Api } from "../lib/api";
import MapView, { DOUALA_CENTER } from "../components/MapView";
import PlaceCard from "../components/PlaceCard";
import WeatherWidget from "../components/WeatherWidget";
import SkeletonGrid from "../components/SkeletonGrid";

const FEATURED_SPOTS = [
  { name: "Bonanjo", note: "Colonial architecture & the Wouri riverfront" },
  { name: "Akwa", note: "Business district, shops & the main boulevard" },
  { name: "Bonapriso", note: "Restaurants, lounges & leafy residential streets" },
  { name: "Deido", note: "Historic quarter with a lively market scene" },
];

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [restaurants, setRestaurants] = useState(null);
  const [hotels, setHotels] = useState(null);
  const [attractions, setAttractions] = useState(null);

  useEffect(() => {
    Api.restaurants({ min_rating: 4.3 }).then((d) => setRestaurants(d.results.slice(0, 3)));
    Api.hotels({ min_rating: 4.0 }).then((d) => setHotels(d.results.slice(0, 3)));
    Api.attractions().then((d) => setAttractions(d.results.slice(0, 3)));
  }, []);

  function onSearch(e) {
    e.preventDefault();
    navigate(`/explore?q=${encodeURIComponent(query)}`);
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-hero-gradient overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-white">
            <span className="eyebrow text-white/80">Douala, Cameroon</span>
            <h1 className="text-4xl md:text-5xl font-display font-extrabold mt-2 leading-tight">
              Your city, figured out — from your first taxi to your last meal.
            </h1>
            <p className="mt-4 text-white/85 text-lg max-w-lg">
              Restaurants, hotels, markets, nightlife, transport and emergency numbers for Cameroon's
              economic capital — plus an AI assistant that actually knows the city.
            </p>

            <form onSubmit={onSearch} className="mt-8 flex bg-white rounded-full shadow-card-hover p-1.5 max-w-lg">
              <div className="flex items-center pl-3 text-ink/40">
                <Search size={18} />
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Where do you want to go?"
                className="flex-1 px-3 py-2 text-sm text-ink outline-none bg-transparent"
              />
              <button type="submit" className="btn-primary">
                Search
              </button>
            </form>

            <div className="flex gap-6 mt-8 text-sm text-white/80">
              <span><strong className="text-white text-lg font-display">44+</strong> places listed</span>
              <span><strong className="text-white text-lg font-display">9</strong> categories</span>
              <span><strong className="text-white text-lg font-display">24/7</strong> emergency numbers</span>
            </div>
          </div>

          {/* Signature element: live mini-map of Douala's neighborhoods */}
          <div className="h-80 lg:h-[420px] rounded-xl2 overflow-hidden shadow-card-hover border-4 border-white/20">
            <MapView
              places={[
                ...(restaurants || []).slice(0, 2),
                ...(hotels || []).slice(0, 2),
                ...(attractions || []).slice(0, 2),
              ]}
              center={DOUALA_CENTER}
              zoom={12}
            />
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAction icon={<Utensils size={20} />} label="Restaurants" to="/restaurants" />
          <QuickAction icon={<Building2 size={20} />} label="Hotels" to="/hotels" />
          <QuickAction icon={<Landmark size={20} />} label="Attractions" to="/attractions" />
          <QuickAction icon={<ShieldCheck size={20} />} label="Emergency" to="/emergency" />
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-14">
          <FeaturedSection title="Popular restaurants" to="/restaurants" data={restaurants} />
          <FeaturedSection title="Hotels worth booking" to="/hotels" data={hotels} />
          <FeaturedSection title="Tourist attractions" to="/attractions" data={attractions} />
        </div>

        <aside className="space-y-6">
          <WeatherWidget />

          <div className="card p-5">
            <h3 className="font-display font-semibold text-ink mb-3">Neighborhoods to know</h3>
            <ul className="space-y-3">
              {FEATURED_SPOTS.map((s) => (
                <li key={s.name} className="flex items-start gap-2">
                  <MapPin size={16} className="text-ocean mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-ink">{s.name}</p>
                    <p className="text-xs text-ink/60">{s.note}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-5 bg-ink text-white">
            <h3 className="font-display font-semibold mb-1">Need help right now?</h3>
            <p className="text-sm text-white/70 mb-3">Police, fire, and hospital numbers, one tap away.</p>
            <Link to="/emergency" className="btn-white w-full">
              Emergency services
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}

function QuickAction({ icon, label, to }) {
  return (
    <Link to={to} className="card flex items-center gap-3 p-4 hover:-translate-y-0.5 transition-transform">
      <span className="w-10 h-10 rounded-full bg-mist text-ocean flex items-center justify-center">{icon}</span>
      <span className="font-semibold text-sm text-ink">{label}</span>
    </Link>
  );
}

function FeaturedSection({ title, to, data }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">{title}</h2>
        <Link to={to} className="text-sm font-semibold text-ocean hover:underline">
          View all
        </Link>
      </div>
      {data ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.map((p) => (
            <PlaceCard key={p.id} place={p} />
          ))}
        </div>
      ) : (
        <SkeletonGrid count={3} />
      )}
    </div>
  );
}
