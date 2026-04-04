// "use client";
// import { useState, useEffect, useCallback } from "react";

// /* ─── Haversine ─── */
// export function haversine(lat1, lng1, lat2, lng2) {
//   const R = 6371;
//   const dLat = ((lat2 - lat1) * Math.PI) / 180;
//   const dLng = ((lng2 - lng1) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((lat1 * Math.PI) / 180) *
//       Math.cos((lat2 * Math.PI) / 180) *
//       Math.sin(dLng / 2) ** 2;
//   return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// }

// /* ─── Accent colours cycling for dynamic hospitals ─── */
// const ACCENTS = [
//   "#0d9488","#0369a1","#7c3aed","#b45309",
//   "#be185d","#0891b2","#16a34a","#dc2626",
// ];
// const BADGES = [
//   "Verified","Emergency","24/7","Trauma Centre",
//   "Multi-Specialty","Super-Specialty","ICU Ready","Top Rated",
// ];

// /* ─── Parse raw Overpass element into our hospital shape ─── */
// export function parseElement(el, idx, userLat, userLng) {
//   const t = el.tags || {};
//   const lat = el.lat ?? el.center?.lat;
//   const lng = el.lon ?? el.center?.lon;
//   if (!lat || !lng) return null;

//   const name = t.name || t["name:en"] || "Hospital";
//   const shortName = name
//     .split(/\s+/)
//     .map((w) => w[0])
//     .join("")
//     .slice(0, 3)
//     .toUpperCase();

//   const phone = t.phone || t["contact:phone"] || t["contact:mobile"] || "+91 100";
//   const address = [t["addr:street"], t["addr:suburb"], t["addr:city"]]
//     .filter(Boolean)
//     .join(", ") || t["addr:full"] || "Address unavailable";

//   /* Fake-but-plausible bed counts — Overpass doesn't expose real-time beds */
//   const seed = (lat * 1000 + lng * 1000 + idx) | 0;
//   const totalBeds = 80 + (Math.abs(seed) % 400);
//   const availBeds = 5 + (Math.abs(seed * 3) % Math.floor(totalBeds * 0.4));
//   const totalIcu = 10 + (Math.abs(seed * 7) % 60);
//   const availIcu = 1 + (Math.abs(seed * 11) % Math.floor(totalIcu * 0.5));

//   const specialtyPool = [
//     "Cardiology","Orthopedics","Neurology","Oncology",
//     "Pediatrics","Gynecology","ENT","Dermatology",
//     "Nephrology","Gastro","Urology","Spine",
//   ];
//   const specStart = Math.abs(seed) % specialtyPool.length;
//   const specialties = [0, 1, 2, 3].map(
//     (i) => specialtyPool[(specStart + i) % specialtyPool.length]
//   );

//   const waitTime = 5 + (Math.abs(seed * 5) % 45);
//   const rating = (3.5 + ((Math.abs(seed) % 15) / 10)).toFixed(1);
//   const reviews = 100 + (Math.abs(seed * 13) % 5000);

//   return {
//     id: el.id,
//     name,
//     shortName,
//     type: t.healthcare === "hospital" ? (t.emergency === "yes" ? "Emergency Hospital" : "General Hospital") : "Medical Facility",
//     lat,
//     lng,
//     rating: parseFloat(rating),
//     reviews,
//     beds: { total: totalBeds, available: availBeds },
//     icu: { total: totalIcu, available: availIcu },
//     emergency: t.emergency === "yes" || true, // treat all as having ER unless tagged otherwise
//     specialties,
//     waitTime,
//     address,
//     phone,
//     badge: BADGES[Math.abs(seed) % BADGES.length],
//     accentHex: ACCENTS[idx % ACCENTS.length],
//     distanceKm: userLat && userLng ? haversine(userLat, userLng, lat, lng) : undefined,
//   };
// }

// /* ─── Overpass query ─── */
// export async function fetchFromOverpass(lat, lng, radiusM = 15000) {
//   const query = `
//     [out:json][timeout:20];
//     (
//       node["amenity"="hospital"](around:${radiusM},${lat},${lng});
//       way["amenity"="hospital"](around:${radiusM},${lat},${lng});
//       relation["amenity"="hospital"](around:${radiusM},${lat},${lng});
//     );
//     out center 40;
//   `;
//   const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
//   const res = await fetch(url, { signal: AbortSignal.timeout(18000) });
//   if (!res.ok) throw new Error("Overpass error");
//   const data = await res.json();
//   return data.elements || [];
// }

// /* ─── Main hook ─── */
// export function useHospitals(userLat, userLng, radiusKm = 15) {
//   const [hospitals, setHospitals] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [retryCount, setRetryCount] = useState(0);

//   const load = useCallback(async () => {
//     if (!userLat || !userLng) return;
//     setLoading(true);
//     setError(null);
//     try {
//       const elements = await fetchFromOverpass(userLat, userLng, radiusKm * 1000);
//       const parsed = elements
//         .map((el, i) => parseElement(el, i, userLat, userLng))
//         .filter(Boolean)
//         .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
      
//       // If we got 0 results, treat it as a soft error and retry
//       if (parsed.length === 0 && retryCount < 3) {
//         setRetryCount(r => r + 1);
//         return;
//       }

//       setHospitals(parsed);
//     } catch (e) {
//       if (retryCount < 3) {
//         // Auto-retry on failure
//         setTimeout(() => setRetryCount(r => r + 1), 2000);
//       } else {
//         setError("Could not load hospitals. Check your connection.");
//       }
//       setHospitals([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [userLat, userLng, radiusKm, retryCount]);

//   useEffect(() => { load(); }, [load]);

//   // Reset retryCount when location changes so fresh attempts start from 0
//   useEffect(() => { setRetryCount(0); }, [userLat, userLng]);

//   return { hospitals, loading, error, reload: load };
// }
"use client";
import { useState, useEffect, useCallback, useRef } from "react";

/* ─── Haversine ─── */
export function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ─── Constants ─── */
const ACCENTS = [
  "#0d9488", "#0369a1", "#7c3aed", "#b45309",
  "#be185d", "#0891b2", "#16a34a", "#dc2626",
];
const BADGES = [
  "Verified", "Emergency", "24/7", "Trauma Centre",
  "Multi-Specialty", "Super-Specialty", "ICU Ready", "Top Rated",
];
const SPECIALTY_POOL = [
  "Cardiology", "Orthopedics", "Neurology", "Oncology",
  "Pediatrics", "Gynecology", "ENT", "Dermatology",
  "Nephrology", "Gastro", "Urology", "Spine",
];

/* ─── Parse Geoapify feature into our hospital shape ─── */
export function parseElement(feature, idx, userLat, userLng) {
  const p = feature.properties;
  const lat = feature.geometry?.coordinates?.[1];
  const lng = feature.geometry?.coordinates?.[0];
  if (!lat || !lng) return null;

  const name = p.name || "Hospital";
  const shortName = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  const address = p.formatted || p.address_line1 || p.address_line2 || "Address unavailable";
  const phone = p.contact?.phone || p.datasource?.raw?.phone || p.datasource?.raw?.["contact:phone"] || "+91 100";

  const seed = (lat * 1000 + lng * 1000 + idx) | 0;
  const totalBeds = 80 + (Math.abs(seed) % 400);
  const availBeds = 5 + (Math.abs(seed * 3) % Math.floor(totalBeds * 0.4));
  const totalIcu = 10 + (Math.abs(seed * 7) % 60);
  const availIcu = 1 + (Math.abs(seed * 11) % Math.floor(totalIcu * 0.5));

  const specStart = Math.abs(seed) % SPECIALTY_POOL.length;
  const specialties = [0, 1, 2, 3].map(
    (i) => SPECIALTY_POOL[(specStart + i) % SPECIALTY_POOL.length]
  );

  return {
    id: p.place_id || `geo-${idx}`,
    name,
    shortName,
    type: "Hospital",
    lat,
    lng,
    rating: parseFloat((3.5 + ((Math.abs(seed) % 15) / 10)).toFixed(1)),
    reviews: 100 + (Math.abs(seed * 13) % 5000),
    beds: { total: totalBeds, available: availBeds },
    icu: { total: totalIcu, available: availIcu },
    emergency: true,
    specialties,
    waitTime: 5 + (Math.abs(seed * 5) % 45),
    address,
    phone,
    badge: BADGES[Math.abs(seed) % BADGES.length],
    accentHex: ACCENTS[idx % ACCENTS.length],
    distanceKm: userLat && userLng ? haversine(userLat, userLng, lat, lng) : undefined,
  };
}

/* ─── Fetch from Geoapify ─── */
export async function fetchHospitals(lat, lng, radiusM = 5000) {
  const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_KEY;
  if (!apiKey) throw new Error("Missing NEXT_PUBLIC_GEOAPIFY_KEY in .env.local");

  const url = `https://api.geoapify.com/v2/places?categories=healthcare.hospital&filter=circle:${lng},${lat},${radiusM}&limit=40&apiKey=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Geoapify error: ${res.status}`);
  const data = await res.json();
  return data.features || [];
}

/* ─── Main hook ─── */
export function useHospitals(userLat, userLng, radiusKm = 5) {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const prevLocationRef = useRef({ lat: null, lng: null });

  const load = useCallback(async () => {
    if (!userLat || !userLng) return;
    setLoading(true);
    setError(null);
    try {
      const features = await fetchHospitals(userLat, userLng, radiusKm * 1000);
      const parsed = features
        .map((f, i) => parseElement(f, i, userLat, userLng))
        .filter(Boolean)
        .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

      setHospitals(parsed);

      if (parsed.length === 0) {
        setError("No hospitals found in this area. Try increasing the radius.");
      }
    } catch (e) {
      setError("Could not load hospitals. Check your connection.");
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  }, [userLat, userLng, radiusKm]);

  useEffect(() => {
    load();
  }, [load]);

  // Only reset when location genuinely changes, not on every render
  useEffect(() => {
    const prev = prevLocationRef.current;
    if (prev.lat !== userLat || prev.lng !== userLng) {
      prevLocationRef.current = { lat: userLat, lng: userLng };
      setHospitals([]);
      setError(null);
    }
  }, [userLat, userLng]);

  return { hospitals, loading, error, reload: load };
}