import { Star, MapPin, Phone, Wifi, Car, Waves, Bus, Bookmark, BookmarkCheck } from "lucide-react";
import { fcfa } from "../lib/api";
import PlaceImage from "./PlaceImage";

export default function PlaceCard({ place, saved, onToggleSave, onOpen }) {
  return (
    <div className="card overflow-hidden flex flex-col group">
      <button
        className="relative h-40 w-full overflow-hidden text-left"
        onClick={() => onOpen?.(place)}
      >
        <PlaceImage
          place={place}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <span className="absolute top-3 left-3 chip bg-white/90 backdrop-blur text-ink font-semibold">
          {place.category}
        </span>
        {place.rating && (
          <span className="absolute top-3 right-3 chip bg-white/90 backdrop-blur">
            <Star size={12} className="fill-sun text-sun" /> {place.rating}
          </span>
        )}
      </button>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <button className="text-left" onClick={() => onOpen?.(place)}>
            <h3 className="font-display font-semibold text-ink leading-tight">{place.name}</h3>
          </button>
          {onToggleSave && (
            <button
              onClick={() => onToggleSave(place)}
              aria-label={saved ? "Remove from saved" : "Save place"}
              className="text-ocean shrink-0"
            >
              {saved ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
            </button>
          )}
        </div>

        <p className="text-xs text-ink/50 flex items-center gap-1">
          <MapPin size={12} /> {place.area}
        </p>

        <p className="text-sm text-ink/70 line-clamp-2">{place.description}</p>

        {place.category === "hotel" && place.amenities && (
          <div className="flex gap-2 text-ocean/70 mt-1">
            {place.amenities.wifi && <Wifi size={14} title="Wi-Fi" />}
            {place.amenities.parking && <Car size={14} title="Parking" />}
            {place.amenities.pool && <Waves size={14} title="Pool" />}
            {place.amenities.airport_shuttle && <Bus size={14} title="Airport shuttle" />}
          </div>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className="font-mono text-sm font-semibold text-ocean">{fcfa(place.avg_cost_fcfa)}</span>
          {place.phone ? (
            <a
              href={`tel:${place.phone}`}
              className="text-xs font-semibold text-palm flex items-center gap-1 hover:underline"
            >
              <Phone size={12} /> {place.phone}
            </a>
          ) : (
            <span className="text-xs text-ink/40">{place.opening_hours}</span>
          )}
        </div>
      </div>
    </div>
  );
}
