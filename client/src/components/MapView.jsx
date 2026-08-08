import { useEffect, useRef } from "react";
import L from "leaflet";

// Leaflet's default marker icons reference image files that Vite doesn't
// resolve automatically — build our own lightweight colored pin instead.
function pinIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:26px;height:26px;border-radius:50% 50% 50% 0;
      background:${color};transform:rotate(-45deg);
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
      border:2px solid white;
    "></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -26],
  });
}

const CATEGORY_COLORS = {
  restaurant: "#F5A623",
  cafe: "#C08552",
  nightlife: "#8B5CF6",
  hotel: "#1657CC",
  culture: "#0E9F6E",
  market: "#DB2777",
  nature: "#16A34A",
  transportation: "#0EA5E9",
  emergency: "#DC2626",
};

const DOUALA_CENTER = [4.0511, 9.7679];

export default function MapView({
  places = [],
  center = DOUALA_CENTER,
  zoom = 13,
  userLocation = null,
  onMarkerClick,
  route = null,
  className = "",
}) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const markersRef = useRef([]);
  const routeLayerRef = useRef(null);
  const userMarkerRef = useRef(null);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    mapRef.current = L.map(containerRef.current, {
      center,
      zoom,
      scrollWheelZoom: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-center when `center`/`zoom` props change.
  useEffect(() => {
    if (mapRef.current) mapRef.current.setView(center, zoom);
  }, [center, zoom]);

  // Render place markers.
  useEffect(() => {
    if (!mapRef.current) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = places.map((p) => {
      const marker = L.marker([p.lat, p.lng], { icon: pinIcon(CATEGORY_COLORS[p.category] || "#1657CC") })
        .addTo(mapRef.current)
        .bindPopup(
          `<div style="font-family:Inter,sans-serif;min-width:160px">
             <strong style="font-family:Sora,sans-serif">${p.name}</strong><br/>
             <span style="color:#0009;font-size:12px">${p.area}</span><br/>
             <span style="font-size:12px">${p.category}${p.avg_cost_fcfa ? " · " + p.avg_cost_fcfa.toLocaleString() + " FCFA" : ""}</span>
           </div>`
        );
      marker.on("click", () => onMarkerClick?.(p));
      return marker;
    });
  }, [places, onMarkerClick]);

  // User location marker.
  useEffect(() => {
    if (!mapRef.current) return;
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
    if (userLocation) {
      userMarkerRef.current = L.circleMarker([userLocation.lat, userLocation.lng], {
        radius: 8,
        color: "#fff",
        weight: 2,
        fillColor: "#1657CC",
        fillOpacity: 1,
      })
        .addTo(mapRef.current)
        .bindPopup("You are here");
    }
  }, [userLocation]);

  // Route polyline (from /api/directions/route geometry).
  useEffect(() => {
    if (!mapRef.current) return;
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }
    if (route?.geometry) {
      routeLayerRef.current = L.geoJSON(route.geometry, {
        style: { color: "#1657CC", weight: 5, opacity: 0.8 },
      }).addTo(mapRef.current);
      mapRef.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [40, 40] });
    }
  }, [route]);

  return <div ref={containerRef} className={`w-full h-full rounded-xl2 ${className}`} />;
}

export { DOUALA_CENTER };
