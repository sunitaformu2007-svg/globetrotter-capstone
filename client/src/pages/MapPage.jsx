import { useEffect, useState } from "react";
import { Locate } from "lucide-react";
import { Api, CATEGORY_LABELS } from "../lib/api";
import MapView, { DOUALA_CENTER } from "../components/MapView";
import CategoryChips from "../components/CategoryChips";
import PlaceModal from "../components/PlaceModal";

export default function MapPage() {
  const [places, setPlaces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState(null);
  const [userLoc, setUserLoc] = useState(null);
  const [locating, setLocating] = useState(false);
  const [openPlace, setOpenPlace] = useState(null);

  useEffect(() => {
    Api.places({ category }).then((d) => {
      setPlaces(d.results);
      setCategories(d.categories);
    });
  }, [category]);

  function locateMe() {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 5000 }
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <span className="eyebrow">Interactive map</span>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-1 mb-5">
        <h1 className="section-title">Douala, mapped</h1>
        <button onClick={locateMe} className="btn-ghost self-start" disabled={locating}>
          <Locate size={16} /> {locating ? "Locating…" : "Use my location"}
        </button>
      </div>

      <CategoryChips categories={categories} active={category} onChange={setCategory} labels={CATEGORY_LABELS} />

      <div className="h-[65vh] mt-5 rounded-xl2 overflow-hidden shadow-card border border-cloud">
        <MapView
          places={places}
          center={userLoc ? [userLoc.lat, userLoc.lng] : DOUALA_CENTER}
          zoom={userLoc ? 14 : 12}
          userLocation={userLoc}
          onMarkerClick={setOpenPlace}
        />
      </div>

      <p className="text-xs text-ink/40 mt-3">
        Map data © OpenStreetMap contributors. Tap a pin for details, hours, and directions.
      </p>

      {openPlace && <PlaceModal place={openPlace} onClose={() => setOpenPlace(null)} />}
    </div>
  );
}
