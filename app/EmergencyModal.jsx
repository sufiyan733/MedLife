"use client";

import { parseElement, haversine } from "./useHospitals";
import { useState, useEffect, useRef, useCallback } from "react";
import { MapLocationPicker } from "./MapLocationPicker";

export function EmergencyModal({ open, onClose, hospitals = [] }) {
  // phases: locating → sos_countdown → confirm → dispatched → denied
  const [phase, setPhase] = useState("locating");
  const [nearest, setNearest] = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  const [sosCount, setSosCount] = useState(3);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const timerRef = useRef(null);

  const findNearest = useCallback((lat, lng, hospList) => {
    const candidates = hospList.map((h) => ({
      ...h,
      distanceKm: haversine(lat, lng, h.lat, h.lng),
    }));
    const maxDist = Math.max(...candidates.map((h) => h.distanceKm), 1);
    const maxBeds = Math.max(
      ...candidates.map((h) => (h.beds?.available || 0) + (h.icu?.available || 0)),
      1
    );
    const scored = candidates.map((h) => {
      const distScore = 1 - h.distanceKm / maxDist;
      const bedScore =
        ((h.beds?.available || 0) + (h.icu?.available || 0)) / maxBeds;
      return { ...h, score: distScore * 0.6 + bedScore * 0.4 };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored[0] || null;
  }, []);

  // Reset everything when modal opens
  useEffect(() => {
    if (!open) return;
    setPhase("locating");
    setNearest(null);
    setUserCoords(null);
    setSosCount(3);
    setShowMapPicker(false);
    clearInterval(timerRef.current);

    if (!navigator.geolocation) { setPhase("denied"); return; }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserCoords({ lat, lng });
        try {
          const elements = await fetchFromOverpass(lat, lng, 15000);
          const parsed = elements
            .map((el, i) => parseElement(el, i, lat, lng))
            .filter(Boolean);
          const list = parsed.length > 0 ? parsed : hospitals;
          const n = findNearest(lat, lng, list);
          setNearest(n);
          setPhase(n ? "sos_countdown" : "denied");
        } catch {
          const n = findNearest(lat, lng, hospitals);
          setNearest(n);
          setPhase(n ? "sos_countdown" : "denied");
        }
      },
      () => setPhase("denied"),
      { timeout: 8000 }
    );

    return () => clearInterval(timerRef.current);
  }, [open, hospitals, findNearest]);

  // 3s SOS countdown
  useEffect(() => {
    if (phase !== "sos_countdown") return;
    setSosCount(3);
    timerRef.current = setInterval(() => {
      setSosCount((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current);
          setPhase("confirm");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const cancelSOS = useCallback(() => {
    clearInterval(timerRef.current);
    onClose();
  }, [onClose]);

  const handleManualLocation = useCallback(
    async ({ lat, lng }) => {
      clearInterval(timerRef.current);
      setUserCoords({ lat, lng });
      setPhase("locating");
      try {
        const elements = await fetchFromOverpass(lat, lng, 15000);
        const parsed = elements
          .map((el, i) => parseElement(el, i, lat, lng))
          .filter(Boolean);
        const list = parsed.length > 0 ? parsed : hospitals;
        const n = findNearest(lat, lng, list);
        setNearest(n);
        setPhase(n ? "sos_countdown" : "denied");
      } catch {
        const n = findNearest(lat, lng, hospitals);
        setNearest(n);
        setPhase(n ? "sos_countdown" : "denied");
      }
    },
    [hospitals, findNearest]
  );

  if (!open) return null;

  const googleMapsUrl =
    nearest && userCoords
      ? `https://www.google.com/maps/dir/${userCoords.lat},${userCoords.lng}/${nearest.lat},${nearest.lng}`
      : nearest
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nearest.name)}`
      : "#";

  // Estimated ambulance ETA: distance / 40 km/h average in city traffic
  const etaMin = nearest?.distanceKm
    ? Math.max(3, Math.round((nearest.distanceKm / 40) * 60))
    : 8;

  return (
    <>
      {showMapPicker && (
        <MapLocationPicker
          open={showMapPicker}
          onClose={() => setShowMapPicker(false)}
          onConfirm={handleManualLocation}
          initialLat={userCoords?.lat}
          initialLng={userCoords?.lng}
        />
      )}

      <div
        style={{
          position: "fixed", inset: 0, zIndex: 9997,
          background: "rgba(0,0,0,0.78)", backdropFilter: "blur(10px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "16px", animation: "emergFadeIn 0.2s ease both",
        }}
        onClick={(e) => e.target === e.currentTarget && cancelSOS()}
      >
        <style>{`
          @keyframes emergFadeIn{from{opacity:0}to{opacity:1}}
          @keyframes emergSlideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
          @keyframes pulseRed{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.6)}60%{box-shadow:0 0 0 22px rgba(220,38,38,0)}}
          @keyframes spin{to{transform:rotate(360deg)}}
          @keyframes popIn{0%{transform:scale(0.7);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
          @keyframes ambulanceBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
          @keyframes countPulse{0%{transform:scale(1)}50%{transform:scale(1.15)}100%{transform:scale(1)}}
          .emerg-card{animation:emergSlideUp 0.28s cubic-bezier(.16,1,.3,1) both}
          .pulse-red{animation:pulseRed 1.4s ease-in-out infinite}
          .pop-in{animation:popIn 0.4s cubic-bezier(.16,1,.3,1) both}
          .ambulance-anim{animation:ambulanceBounce 1s ease-in-out infinite}
          .count-pulse{animation:countPulse 1s ease-in-out infinite}
        `}</style>

        <div className="emerg-card" style={{
          background: "#fff", borderRadius: "24px", width: "100%",
          maxWidth: "400px", overflow: "hidden",
          boxShadow: "0 40px 100px rgba(0,0,0,0.4)", maxHeight: "90vh", overflowY: "auto",
        }}>

          {/* ── HEADER (always shown) ── */}
          <div style={{
            background: "linear-gradient(135deg,#dc2626,#7f1d1d)",
            padding: "18px 20px 14px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="pulse-red" style={{
                  width: "38px", height: "38px", borderRadius: "11px",
                  background: "rgba(255,255,255,0.18)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px",
                }}>🚨</div>
                <div>
                  <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "9px", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", margin: 0 }}>Emergency Alert</p>
                  <p style={{ color: "#fff", fontWeight: 800, fontSize: "15px", margin: 0 }}>MediLife Emergency</p>
                </div>
              </div>
              <button onClick={cancelSOS} style={{
                width: "30px", height: "30px", borderRadius: "8px",
                background: "rgba(255,255,255,0.15)", border: "none",
                color: "#fff", fontSize: "14px", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>✕</button>
            </div>
          </div>

          {/* ── BODY ── */}
          <div style={{ padding: "24px 20px 20px" }}>

            {/* PHASE: locating */}
            {phase === "locating" && (
              <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
                <div style={{
                  width: "56px", height: "56px", borderRadius: "50%",
                  border: "3px solid #fee2e2", borderTopColor: "#dc2626",
                  margin: "0 auto 18px", animation: "spin 0.9s linear infinite",
                }} />
                <p style={{ fontWeight: 700, fontSize: "15px", color: "#111827", margin: "0 0 6px" }}>
                  Locating you…
                </p>
                <p style={{ fontSize: "12px", color: "#9ca3af", margin: "0 0 20px" }}>
                  Allow location access if prompted
                </p>
                <button onClick={() => setShowMapPicker(true)} style={{
                  padding: "11px 22px", borderRadius: "10px",
                  background: "#fff5f5", border: "1.5px solid #fecaca",
                  color: "#dc2626", fontWeight: 700, fontSize: "12px", cursor: "pointer",
                }}>📍 Set location manually</button>
              </div>
            )}

            {/* PHASE: sos_countdown */}
            {phase === "sos_countdown" && (
              <div style={{ textAlign: "center", padding: "8px 0" }}>
                <div className="count-pulse" style={{
                  width: "100px", height: "100px", borderRadius: "50%",
                  background: "linear-gradient(135deg,#dc2626,#991b1b)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 20px",
                  boxShadow: "0 0 0 12px rgba(220,38,38,0.15), 0 0 0 24px rgba(220,38,38,0.07)",
                }}>
                  <span style={{ fontSize: "42px", fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                    {sosCount}
                  </span>
                </div>

                <p style={{ fontWeight: 800, fontSize: "18px", color: "#111827", margin: "0 0 6px" }}>
                  Sending SOS in {sosCount}s
                </p>
                <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 6px" }}>
                  Nearest ER: <strong style={{ color: "#111" }}>{nearest?.name}</strong>
                </p>
                <p style={{ fontSize: "11px", color: "#9ca3af", margin: "0 0 24px" }}>
                  {nearest?.distanceKm?.toFixed(1)} km away · ~{nearest?.waitTime} min wait
                </p>

                <button
                  onClick={cancelSOS}
                  style={{
                    width: "100%", padding: "14px", borderRadius: "14px",
                    background: "#f9fafb", border: "2px solid #e5e7eb",
                    color: "#374151", fontWeight: 800, fontSize: "14px",
                    cursor: "pointer", marginBottom: "10px",
                  }}
                >
                  ✕ Cancel — Not an Emergency
                </button>
                <button
                  onClick={() => { clearInterval(timerRef.current); setPhase("confirm"); }}
                  style={{
                    width: "100%", padding: "14px", borderRadius: "14px",
                    background: "linear-gradient(135deg,#dc2626,#b91c1c)",
                    border: "none", color: "#fff", fontWeight: 800,
                    fontSize: "14px", cursor: "pointer",
                  }}
                >
                  🚨 Send SOS Now
                </button>
              </div>
            )}

            {/* PHASE: confirm */}
            {phase === "confirm" && (
              <div className="pop-in" style={{ textAlign: "center", padding: "8px 0" }}>
                <div style={{ fontSize: "52px", marginBottom: "16px" }}>🚑</div>
                <p style={{ fontWeight: 800, fontSize: "20px", color: "#111827", margin: "0 0 8px" }}>
                  Need an Ambulance?
                </p>
                <p style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 6px", lineHeight: 1.5 }}>
                  This will dispatch an ambulance from
                </p>
                <p style={{ fontWeight: 700, fontSize: "14px", color: "#dc2626", margin: "0 0 24px" }}>
                  {nearest?.name}
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                  <div style={{
                    background: "#f8faff", borderRadius: "12px",
                    padding: "12px 8px", border: "1.5px solid #e0e7ff",
                  }}>
                    <p style={{ fontWeight: 800, fontSize: "18px", color: "#3730a3", margin: "0 0 2px" }}>
                      ~{etaMin} min
                    </p>
                    <p style={{ fontSize: "10px", color: "#6b7280", margin: 0, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      ETA
                    </p>
                  </div>
                  <div style={{
                    background: "#fff5f5", borderRadius: "12px",
                    padding: "12px 8px", border: "1.5px solid #fecaca",
                  }}>
                    <p style={{ fontWeight: 800, fontSize: "18px", color: "#dc2626", margin: "0 0 2px" }}>
                      {nearest?.distanceKm?.toFixed(1)} km
                    </p>
                    <p style={{ fontSize: "10px", color: "#6b7280", margin: 0, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      Distance
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setPhase("dispatched")}
                  style={{
                    width: "100%", padding: "15px", borderRadius: "14px",
                    background: "linear-gradient(135deg,#dc2626,#b91c1c)",
                    border: "none", color: "#fff", fontWeight: 800,
                    fontSize: "15px", cursor: "pointer", marginBottom: "10px",
                  }}
                >
                  ✅ Yes, Send Ambulance
                </button>
                <button
                  onClick={cancelSOS}
                  style={{
                    width: "100%", padding: "13px", borderRadius: "14px",
                    background: "#f9fafb", border: "1.5px solid #e5e7eb",
                    color: "#6b7280", fontWeight: 700, fontSize: "13px", cursor: "pointer",
                  }}
                >
                  No, I'm okay
                </button>
              </div>
            )}

            {/* PHASE: dispatched */}
            {phase === "dispatched" && (
              <div className="pop-in" style={{ textAlign: "center", padding: "8px 0" }}>
                <div className="ambulance-anim" style={{ fontSize: "56px", marginBottom: "4px" }}>🚑</div>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  background: "#dcfce7", borderRadius: "20px",
                  padding: "4px 14px", marginBottom: "16px",
                }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#15803d" }}>Ambulance Dispatched</span>
                </div>

                <p style={{ fontWeight: 800, fontSize: "20px", color: "#111827", margin: "0 0 6px" }}>
                  Help is on the way!
                </p>
                <p style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 20px", lineHeight: 1.6 }}>
                  Ambulance from <strong style={{ color: "#111" }}>{nearest?.name}</strong><br />
                  will arrive in approximately <strong style={{ color: "#dc2626" }}>{etaMin} minutes</strong>
                </p>

                {/* ETA bar */}
                <div style={{
                  background: "#f1f5f9", borderRadius: "12px",
                  padding: "14px 16px", marginBottom: "16px",
                  border: "1.5px solid #e2e8f0", textAlign: "left",
                }}>
                  {[
                    { icon: "📍", label: "Your location", value: `${userCoords?.lat?.toFixed(4)}, ${userCoords?.lng?.toFixed(4)}` },
                    { icon: "🏥", label: "Dispatching from", value: nearest?.name },
                    { icon: "⏱", label: "Est. arrival", value: `~${etaMin} minutes` },
                    { icon: "📞", label: "ER direct line", value: nearest?.phone },
                  ].map((row) => (
                    <div key={row.label} style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      paddingBottom: "10px", marginBottom: "10px",
                      borderBottom: "1px solid #e2e8f0",
                    }}>
                      <span style={{ fontSize: "16px", flexShrink: 0 }}>{row.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "10px", color: "#9ca3af", margin: 0, textTransform: "uppercase", letterSpacing: "0.1em" }}>{row.label}</p>
                        <p style={{ fontSize: "12px", fontWeight: 700, color: "#111827", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.value}</p>
                      </div>
                    </div>
                  ))}
                  {/* last row no border */}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                  <a href={`tel:${nearest?.phone}`} style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: "6px", padding: "13px", borderRadius: "12px",
                    textDecoration: "none",
                    background: "linear-gradient(135deg,#dc2626,#b91c1c)",
                    color: "#fff", fontWeight: 800, fontSize: "13px",
                  }}>📞 Call ER</a>
                  <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: "6px", padding: "13px", borderRadius: "12px",
                    textDecoration: "none",
                    background: nearest?.accentHex || "#0369a1",
                    color: "#fff", fontWeight: 800, fontSize: "13px",
                  }}>🗺 Directions</a>
                </div>

                <button onClick={onClose} style={{
                  width: "100%", padding: "12px", borderRadius: "12px",
                  border: "1.5px solid #e5e7eb", background: "#f9fafb",
                  color: "#6b7280", fontWeight: 700, fontSize: "12px", cursor: "pointer",
                }}>Close</button>
              </div>
            )}

            {/* PHASE: denied */}
            {phase === "denied" && (
              <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
                <div style={{ fontSize: "44px", marginBottom: "14px" }}>📍</div>
                <p style={{ fontWeight: 700, fontSize: "15px", color: "#111827", margin: "0 0 8px" }}>
                  Location unavailable
                </p>
                <p style={{ fontSize: "12px", color: "#9ca3af", margin: "0 0 22px", lineHeight: 1.6 }}>
                  Set your location manually to find the nearest ER, or call 112 directly.
                </p>
                <button onClick={() => setShowMapPicker(true)} style={{
                  width: "100%", padding: "13px", borderRadius: "12px",
                  background: "linear-gradient(135deg,#16a34a,#059669)",
                  border: "none", color: "#fff", fontWeight: 800,
                  fontSize: "13px", cursor: "pointer", marginBottom: "10px",
                }}>📍 Set Location on Map</button>
                <a href="tel:112" style={{
                  display: "block", padding: "13px", borderRadius: "12px",
                  background: "linear-gradient(135deg,#dc2626,#b91c1c)",
                  color: "#fff", fontWeight: 800, fontSize: "13px",
                  textDecoration: "none", marginBottom: "10px",
                }}>📞 Call 112 Now</a>
                <button onClick={onClose} style={{
                  width: "100%", padding: "12px", borderRadius: "12px",
                  border: "1.5px solid #e5e7eb", background: "#f9fafb",
                  color: "#6b7280", fontWeight: 600, fontSize: "12px", cursor: "pointer",
                }}>Close</button>
              </div>
            )}
          </div>

          <div style={{ padding: "10px 20px 16px", borderTop: "1px solid #f3f4f6", textAlign: "center" }}>
            <p style={{ fontSize: "10px", color: "#d1d5db", margin: 0 }}>
              Always call <strong style={{ color: "#ef4444" }}>112</strong> for life-threatening emergencies · MediLife alert is supplementary
            </p>
          </div>
        </div>
      </div>
    </>
  );
}