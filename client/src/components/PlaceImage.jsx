import { useState } from "react";

/**
 * How photos work (no code editing required):
 *
 * Drop a file into client/public/images/ named exactly after the place's
 * "image_seed" value (see server/data/places.json), e.g.:
 *
 *   client/public/images/le-paquebot-douala.jpg
 *
 * This component tries that file automatically. If it's not there, it falls
 * back to place.image (a manual URL override in places.json, if you set
 * one) and finally to a generic placeholder photo. You never have to touch
 * any .jsx or .json file just to add a picture.
 */
export default function PlaceImage({ place, className }) {
  const localCandidates = ["jpg", "jpeg", "png", "webp"].map(
    (ext) => `/images/${place.image_seed}.${ext}`
  );
  const fallback = place.image || `https://picsum.photos/seed/${encodeURIComponent(place.image_seed)}/480/320`;

  const [srcIndex, setSrcIndex] = useState(0);
  const sources = [...localCandidates, fallback];
  const src = sources[Math.min(srcIndex, sources.length - 1)];

  return (
    <img
      src={src}
      alt={place.name}
      loading="lazy"
      className={className}
      onError={() => {
        setSrcIndex((i) => (i < sources.length - 1 ? i + 1 : i));
      }}
    />
  );
}
