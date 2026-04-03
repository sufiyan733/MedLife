"use client";
import { useEffect, useRef, useState } from "react";


const DEFAULT_LAT = 19.076;
const DEFAULT_LNG = 72.8777; // Mumbai

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    if (data?.display_name) {
      return data.display_name.split(",").slice(0, 3).join(",").trim();
    }
  } catch {}
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

function loadLeaflet() {
  return new Promise((resolve) => {
    if (window.L) { resolve(window.L); return; }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => resolve(window.L);
    document.head.appendChild(script);
  });
}

export function MapLocationPicker({ open, onClose, onConfirm, initialLat, initialLng }) {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markerRef = useRef(null);
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState({ lat: initialLat || DEFAULT_LAT, lng: initialLng || DEFAULT_LNG });
  const [loadingAddr, setLoadingAddr] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [searchQuery, setSQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const sugRef = useRef(null);

  /* ── Init map ── */
  useEffect(() => {
    if (!open) return;
    let destroyed = false;

    loadLeaflet().then((L) => {
      if (destroyed || !mapRef.current || leafletMap.current) return;

      const lat = initialLat || DEFAULT_LAT;
      const lng = initialLng || DEFAULT_LNG;

      const map = L.map(mapRef.current, { zoomControl: true }).setView([lat, lng], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      /* custom red pin icon */
      const icon = L.divIcon({
        html: `<div style="
          width:28px;height:28px;border-radius:50% 50% 50% 0;
          background:linear-gradient(135deg,#dc2626,#991b1b);
          transform:rotate(-45deg);border:3px solid #fff;
          box-shadow:0 4px 14px rgba(220,38,38,.55)">
        </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        className: "",
      });

      const marker = L.marker([lat, lng], { draggable: true, icon }).addTo(map);
      markerRef.current = marker;
      leafletMap.current = map;
      setMapReady(true);

      /* update coords on drag */
      marker.on("dragend", async (e) => {
        const { lat, lng } = e.target.getLatLng();
        setCoords({ lat, lng });
        setLoadingAddr(true);
        const addr = await reverseGeocode(lat, lng);
        setAddress(addr);
        setLoadingAddr(false);
      });

      /* click map to move marker */
      map.on("click", async (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setCoords({ lat, lng });
        setLoadingAddr(true);
        const addr = await reverseGeocode(lat, lng);
        setAddress(addr);
        setLoadingAddr(false);
      });

      /* initial address */
      reverseGeocode(lat, lng).then((addr) => { if (!destroyed) setAddress(addr); });
    });

    return () => {
      destroyed = true;
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
        markerRef.current = null;
        setMapReady(false);
      }
    };
  }, [open]);

  /* ── Search (Nominatim) ── */
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSuggestions([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      setSuggestions(data);
    } catch {}
    setSearching(false);
  };

  const pickSuggestion = (s) => {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    setSuggestions([]);
    setSQ("");
    setCoords({ lat, lng });
    setAddress(s.display_name.split(",").slice(0, 3).join(",").trim());
    if (leafletMap.current && markerRef.current) {
      leafletMap.current.setView([lat, lng], 14);
      markerRef.current.setLatLng([lat, lng]);
    }
  };

  const confirm = () => {
    onConfirm({ lat: coords.lat, lng: coords.lng, address });
    onClose();
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9998,
        background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
        animation: "mpFadeIn .2s ease both",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <style>{`
        @keyframes mpFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes mpSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .mp-card{animation:mpSlideUp .28s cubic-bezier(.16,1,.3,1) both}
        .mp-sug:hover{background:#f0fdf4}
        .leaflet-container{font-family:inherit}
      `}</style>

      <div className="mp-card" style={{
        background: "#fff", borderRadius: "20px", width: "100%",
        maxWidth: "560px", overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,.35)",
        display: "flex", flexDirection: "column", maxHeight: "90vh",
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: "18px 20px 14px",
          borderBottom: "1px solid #f1f5f9",
          background: "linear-gradient(135deg,#f0fdf4,#dcfce7)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "10px",
                background: "linear-gradient(135deg,#16a34a,#059669)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "18px",
              }}>📍</div>
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: "15px", color: "#111827", fontFamily: "'Sora',sans-serif" }}>
                  Pick your location
                </p>
                <p style={{ margin: 0, fontSize: "11px", color: "#6b7280" }}>
                  Click the map or drag the pin
                </p>
              </div>
            </div>
            <button onClick={onClose} style={{
              width: "30px", height: "30px", borderRadius: "8px",
              background: "rgba(0,0,0,0.06)", border: "none",
              cursor: "pointer", fontSize: "14px", display: "flex",
              alignItems: "center", justifyContent: "center", color: "#6b7280",
            }}>✕</button>
          </div>

          {/* Search bar */}
          <div style={{ position: "relative" }} ref={sugRef}>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                value={searchQuery}
                onChange={(e) => setSQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search area, city, landmark…"
                style={{
                  flex: 1, padding: "9px 14px", borderRadius: "10px",
                  border: "1.5px solid #bbf7d0", fontSize: "13px",
                  outline: "none", color: "#111827", background: "#fff",
                  fontFamily: "inherit",
                }}
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                style={{
                  padding: "9px 16px", borderRadius: "10px",
                  background: "linear-gradient(135deg,#16a34a,#059669)",
                  border: "none", color: "#fff", fontWeight: 700,
                  fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap",
                  opacity: searching ? 0.6 : 1,
                }}
              >
                {searching ? "…" : "Search"}
              </button>
            </div>

            {/* Suggestions dropdown */}
            {suggestions.length > 0 && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                background: "#fff", borderRadius: "12px", border: "1.5px solid #e2e8f0",
                boxShadow: "0 8px 24px rgba(0,0,0,.12)", zIndex: 10, overflow: "hidden",
              }}>
                {suggestions.map((s) => (
                  <button
                    key={s.place_id}
                    className="mp-sug"
                    onClick={() => pickSuggestion(s)}
                    style={{
                      width: "100%", textAlign: "left", padding: "10px 14px",
                      border: "none", background: "transparent", cursor: "pointer",
                      borderBottom: "1px solid #f1f5f9", fontSize: "12px", color: "#374151",
                      fontFamily: "inherit", lineHeight: 1.4,
                    }}
                  >
                    📍 {s.display_name.split(",").slice(0, 4).join(",")}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Map ── */}
        <div style={{ position: "relative", flex: 1, minHeight: "320px" }}>
          <div ref={mapRef} style={{ width: "100%", height: "100%", minHeight: "320px" }} />
          {!mapReady && (
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              alignItems: "center", justifyContent: "center",
              background: "#f8faf9",
            }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "50%",
                border: "3px solid #bbf7d0", borderTopColor: "#16a34a",
                animation: "mpFadeIn .3s, spin 0.9s linear infinite",
              }} />
            </div>
          )}
        </div>

        {/* ── Selected address + confirm ── */}
        <div style={{ padding: "14px 20px 18px", borderTop: "1px solid #f1f5f9" }}>
          <div style={{
            background: "#f8faf9", borderRadius: "10px",
            padding: "10px 14px", marginBottom: "12px",
            border: "1.5px solid #e2e8f0", minHeight: "40px",
            display: "flex", alignItems: "center", gap: "8px",
          }}>
            <span style={{ fontSize: "14px", flexShrink: 0 }}>📍</span>
            <p style={{
              margin: 0, fontSize: "12px", color: loadingAddr ? "#9ca3af" : "#374151",
              fontStyle: loadingAddr ? "italic" : "normal", lineHeight: 1.4,
            }}>
              {loadingAddr ? "Getting address…" : address || "Click the map to select a location"}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <button
              onClick={onClose}
              style={{
                padding: "12px", borderRadius: "12px",
                border: "1.5px solid #e2e8f0", background: "#f9fafb",
                color: "#6b7280", fontWeight: 700, fontSize: "13px", cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={confirm}
              style={{
                padding: "12px", borderRadius: "12px",
                background: "linear-gradient(135deg,#16a34a,#059669)",
                border: "none", color: "#fff", fontWeight: 800,
                fontSize: "13px", cursor: "pointer",
              }}
            >
              Find Hospitals Here →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}