"use client";
import { useEffect, useRef, useState } from "react";

const DEFAULT_LAT = 19.076;
const DEFAULT_LNG = 72.8777; // Mumbai

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { "Accept-Language": "en" } },
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
  const mapRef     = useRef(null);
  const leafletMap = useRef(null);
  const markerRef  = useRef(null);

  const [address, setAddress]         = useState("");
  const [coords, setCoords]           = useState({ lat: initialLat || DEFAULT_LAT, lng: initialLng || DEFAULT_LNG });
  const [loadingAddr, setLoadingAddr] = useState(false);
  const [mapReady, setMapReady]       = useState(false);

  const [pincode, setPincode]                       = useState("");
  const [pincodeError, setPincodeError]             = useState("");
  const [pincodeSearching, setPincodeSearching]     = useState(false);
  const [pincodeSuggestions, setPincodeSuggestions] = useState([]);

  /* ── Init / teardown map ── */
  useEffect(() => {
    if (!open) return;
    let destroyed = false;

    loadLeaflet().then((L) => {
      if (destroyed || !mapRef.current || leafletMap.current) return;

      const lat = initialLat || DEFAULT_LAT;
      const lng = initialLng || DEFAULT_LNG;

      const map = L.map(mapRef.current, { zoomControl: true }).setView([lat, lng], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap", maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        html: `
          <div style="position:relative;width:28px;height:36px;">
            <div class="mp-pin" style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:linear-gradient(135deg,#dc2626,#991b1b);transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 4px 14px rgba(220,38,38,.55);position:absolute;top:0;left:0;"></div>
            <div class="mp-shadow" style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:14px;height:5px;background:rgba(0,0,0,0.25);border-radius:50%;"></div>
          </div>`,
        iconSize: [28, 36], iconAnchor: [14, 36], className: "",
      });

      const marker = L.marker([lat, lng], { draggable: true, icon }).addTo(map);
      markerRef.current = marker;
      leafletMap.current = map;
      setMapReady(true);

      marker.on("dragstart", () => {
        const el = marker.getElement()?.querySelector(".mp-pin");
        if (el) { el.classList.remove("mp-pin", "mp-pin-settle"); el.classList.add("mp-pin-dragging"); }
      });

      marker.on("dragend", async (e) => {
        const el = marker.getElement()?.querySelector(".mp-pin-dragging");
        if (el) { el.classList.remove("mp-pin-dragging"); el.classList.add("mp-pin-settle"); }
        const { lat, lng } = e.target.getLatLng();
        setCoords({ lat, lng });
        setLoadingAddr(true);
        setAddress(await reverseGeocode(lat, lng));
        setLoadingAddr(false);
      });

      map.on("click", async (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        const el = marker.getElement()?.querySelector(".mp-pin,.mp-pin-settle");
        if (el) { el.classList.remove("mp-pin","mp-pin-settle"); void el.offsetWidth; el.classList.add("mp-pin-settle"); }
        setCoords({ lat, lng });
        setLoadingAddr(true);
        setAddress(await reverseGeocode(lat, lng));
        setLoadingAddr(false);
      });

      reverseGeocode(lat, lng).then((addr) => { if (!destroyed) setAddress(addr); });
    });

    return () => {
      destroyed = true;
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
        markerRef.current  = null;
        setMapReady(false);
      }
    };
  }, [open, initialLat, initialLng]);

  /* ── Fly map to coords ── */
  const flyToLocation = (lat, lng) => {
    if (leafletMap.current && markerRef.current) {
      leafletMap.current.setView([lat, lng], 14);
      markerRef.current.setLatLng([lat, lng]);
      const el = markerRef.current.getElement()?.querySelector(".mp-pin,.mp-pin-settle");
      if (el) { el.classList.remove("mp-pin","mp-pin-settle"); void el.offsetWidth; el.classList.add("mp-pin-settle"); }
    }
    setCoords({ lat, lng });
  };

  const pickSuggestion = (s) => {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    setPincodeSuggestions([]);
    setPincodeError("");
    setAddress(s.display_name.split(",").slice(0, 4).join(",").trim());
    flyToLocation(lat, lng);
  };

  /*
   * ── Core search — receives `value` directly so it never reads stale state.
   *    This is the root fix for the auto-search showing an error even though
   *    the pincode was valid: the old version called handlePincodeSearch()
   *    from inside setTimeout, where `pincode` state hadn't updated yet.
   */
  const runPincodeSearch = async (value) => {
    if (!/^\d{6}$/.test(value)) {
      setPincodeError("Please enter a valid 6-digit Indian pincode.");
      return;
    }

    setPincodeError("");
    setPincodeSuggestions([]);
    setPincodeSearching(true);

    try {
      // Primary: postalcode param (most accurate for Indian pincodes)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${value}&country=India&format=json&limit=8&addressdetails=1`,
        { headers: { "Accept-Language": "en", "User-Agent": "MediLifeApp/1.0" } }
      );
      const data = await res.json();

      if (data.length === 0) {
        // Fallback: plain text query
        const res2 = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${value}+India&format=json&limit=8&countrycodes=in`,
          { headers: { "Accept-Language": "en", "User-Agent": "MediLifeApp/1.0" } }
        );
        const data2 = await res2.json();
        if (data2.length === 0) {
          setPincodeError("Pincode not found. Try a nearby pincode or drag the pin manually.");
        } else if (data2.length === 1) {
          pickSuggestion(data2[0]);
        } else {
          setPincodeSuggestions(data2);
        }
      } else if (data.length === 1) {
        pickSuggestion(data[0]);
      } else {
        setPincodeSuggestions(data);
      }
    } catch {
      setPincodeError("Search failed. Check your connection.");
    }

    setPincodeSearching(false);
  };

  /* ── Input handler — passes fresh digit string directly to runPincodeSearch ── */
  const handlePincodeChange = (val) => {
    const digits = val.replace(/\D/g, "").slice(0, 6);
    setPincode(digits);
    setPincodeError("");
    setPincodeSuggestions([]);

    if (digits.length === 6) {
      clearTimeout(window._pincodeTimer);
      // Pass `digits` (not state) so the search always gets the current value
      window._pincodeTimer = setTimeout(() => runPincodeSearch(digits), 400);
    }
  };

  const confirm = () => { onConfirm({ lat: coords.lat, lng: coords.lng, address }); onClose(); };

  if (!open) return null;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", animation: "mpFadeIn .2s ease both" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <style>{`
        @keyframes mpFadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes mpSlideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes pinDrop   { 0%{transform:rotate(-45deg) translateY(-18px) scale(1.2);opacity:0} 60%{transform:rotate(-45deg) translateY(4px) scale(0.9)} 80%{transform:rotate(-45deg) translateY(-3px) scale(1.05)} 100%{transform:rotate(-45deg) translateY(0) scale(1);opacity:1} }
        @keyframes pinSettle { 0%{transform:rotate(-45deg) translateY(0) scale(1)} 30%{transform:rotate(-45deg) translateY(-6px) scale(1.1)} 60%{transform:rotate(-45deg) translateY(2px) scale(0.95)} 80%{transform:rotate(-45deg) translateY(-2px) scale(1.02)} 100%{transform:rotate(-45deg) translateY(0) scale(1)} }
        @keyframes shadowPulse { 0%,100%{transform:scale(1);opacity:0.5} 50%{transform:scale(1.4);opacity:0.2} }
        .mp-card         { animation:mpSlideUp .28s cubic-bezier(.16,1,.3,1) both }
        .mp-sug:hover    { background:#fff7ed }
        .mp-spin         { animation:spin 0.85s linear infinite }
        .mp-pin-input:focus { outline:none }
        .leaflet-container { font-family:inherit }
        .mp-pin          { animation:pinDrop 0.5s cubic-bezier(.16,1,.3,1) both }
        .mp-pin-settle   { animation:pinSettle 0.4s cubic-bezier(.16,1,.3,1) both }
        .mp-pin-dragging { transform:rotate(-45deg) scale(1.25) !important; filter:drop-shadow(0 8px 16px rgba(220,38,38,.6)); transition:transform 0.15s ease, filter 0.15s ease }
        .mp-shadow       { animation:shadowPulse 1.8s ease-in-out infinite }
      `}</style>

      <div className="mp-card" style={{ background: "#fff", borderRadius: "20px", width: "100%", maxWidth: "560px", overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,.35)", display: "flex", flexDirection: "column", maxHeight: "92vh" }}>

        {/* ── Header ── */}
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f1f5f9", background: "linear-gradient(135deg,#fff7ed,#ffedd5)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg,#ea580c,#f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🏷️</div>
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: "15px", color: "#111827", fontFamily: "'Sora',sans-serif" }}>Find by Pincode</p>
                <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>Enter pincode · or click / drag the map</p>
              </div>
            </div>
            <button onClick={onClose} style={{ width: "30px", height: "30px", borderRadius: "8px", background: "rgba(0,0,0,0.06)", border: "none", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>✕</button>
          </div>

          {/* ── Pincode input ── */}
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", background: "#fff", border: `1.5px solid ${pincodeError ? "#fca5a5" : "#fed7aa"}`, borderRadius: "12px", padding: "9px 14px", transition: "border-color 0.15s" }}>
                <span style={{ fontSize: "15px", flexShrink: 0 }}>📮</span>
                <input
                  className="mp-pin-input"
                  value={pincode}
                  onChange={(e) => handlePincodeChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runPincodeSearch(pincode)}
                  placeholder="6-digit pincode  e.g. 400001"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  style={{ flex: 1, border: "none", fontSize: "15px", fontWeight: 700, letterSpacing: "0.18em", color: "#111827", background: "transparent", fontFamily: "monospace", outline: "none", width: "100%" }}
                />
                {/* Progress dots */}
                <div style={{ display: "flex", gap: "3px", flexShrink: 0 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <span key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: i < pincode.length ? "#ea580c" : "#fed7aa", transition: "background 0.12s" }} />
                  ))}
                </div>
              </div>

              <button
                onClick={() => runPincodeSearch(pincode)}
                disabled={pincodeSearching || pincode.length !== 6}
                style={{ flexShrink: 0, padding: "10px 18px", borderRadius: "12px", background: "linear-gradient(135deg,#ea580c,#f97316)", border: "none", color: "#fff", fontWeight: 700, fontSize: "13px", cursor: pincode.length === 6 && !pincodeSearching ? "pointer" : "not-allowed", opacity: (pincodeSearching || pincode.length !== 6) ? 0.5 : 1, display: "flex", alignItems: "center", gap: "6px", transition: "opacity 0.15s" }}>
                {pincodeSearching
                  ? <span className="mp-spin" style={{ display: "inline-block", width: "14px", height: "14px", border: "2.5px solid rgba(255,255,255,0.35)", borderTopColor: "#fff", borderRadius: "50%" }} />
                  : "Go →"}
              </button>
            </div>

            {/* Error */}
            {pincodeError && (
              <p style={{ margin: "7px 0 0", fontSize: "11px", color: "#dc2626", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}>
                ⚠️ {pincodeError}
              </p>
            )}

            {/* Typing hint */}
            {!pincodeError && pincode.length < 6 && (
              <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#9ca3af" }}>
                {pincode.length === 0
                  ? "Try 400001 · 110001 · 600001 · 700001"
                  : `${6 - pincode.length} more digit${6 - pincode.length > 1 ? "s" : ""}…`}
              </p>
            )}

            {/* Suggestions dropdown */}
            {pincodeSuggestions.length > 0 && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 100, background: "#fff", border: "1.5px solid #fed7aa", borderRadius: "14px", overflow: "hidden", boxShadow: "0 10px 28px rgba(0,0,0,0.12)" }}>
                <div style={{ padding: "8px 14px 6px", background: "#fff7ed", borderBottom: "1px solid #ffedd5" }}>
                  <p style={{ margin: 0, fontSize: "10px", fontWeight: 800, color: "#ea580c", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {pincodeSuggestions.length} area{pincodeSuggestions.length > 1 ? "s" : ""} found for {pincode}
                  </p>
                </div>
                {pincodeSuggestions.map((s, i) => (
                  <button key={i} className="mp-sug" onClick={() => pickSuggestion(s)}
                    style={{ width: "100%", textAlign: "left", padding: "10px 14px", fontSize: "12px", background: "none", border: "none", borderBottom: i < pincodeSuggestions.length - 1 ? "1px solid #fff7ed" : "none", cursor: "pointer", color: "#374151", display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "14px", flexShrink: 0 }}>📍</span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ fontWeight: 700, display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.display_name.split(",")[0]}</span>
                      <span style={{ color: "#9ca3af", fontSize: "11px" }}>{s.display_name.split(",").slice(1, 3).join(",").trim()}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Map ── */}
        <div style={{ position: "relative", flex: 1, minHeight: "300px" }}>
          <div ref={mapRef} style={{ width: "100%", height: "100%", minHeight: "300px" }} />
          {!mapReady && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8faf9" }}>
              <div className="mp-spin" style={{ width: "36px", height: "36px", borderRadius: "50%", border: "3px solid #fed7aa", borderTopColor: "#ea580c" }} />
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: "14px 20px 18px", borderTop: "1px solid #f1f5f9", flexShrink: 0 }}>
          <div style={{ background: "#f8faf9", borderRadius: "10px", padding: "10px 14px", marginBottom: "12px", border: "1.5px solid #e2e8f0", minHeight: "40px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "14px", flexShrink: 0 }}>📍</span>
            <p style={{ margin: 0, fontSize: "12px", color: loadingAddr ? "#9ca3af" : "#374151", fontStyle: loadingAddr ? "italic" : "normal", lineHeight: 1.4 }}>
              {loadingAddr ? "Getting address…" : address || "Click the map to select a location"}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <button onClick={onClose} style={{ padding: "12px", borderRadius: "12px", border: "1.5px solid #e2e8f0", background: "#f9fafb", color: "#6b7280", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
              Cancel
            </button>
            <button onClick={confirm} style={{ padding: "12px", borderRadius: "12px", background: "linear-gradient(135deg,#16a34a,#059669)", border: "none", color: "#fff", fontWeight: 800, fontSize: "13px", cursor: "pointer" }}>
              Find Hospitals Here →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}