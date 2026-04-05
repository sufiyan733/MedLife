"use client";

import { parseElement, haversine } from "./useHospitals";
import { useState, useEffect, useRef, useCallback } from "react";
import { MapLocationPicker } from "./MapLocationPicker";

/* ── Keyframes & global styles injected once ── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');

  @keyframes em-backdropIn  { from { opacity:0 } to { opacity:1 } }
  @keyframes em-cardIn      { from { opacity:0; transform:translateY(32px) scale(0.96) } to { opacity:1; transform:translateY(0) scale(1) } }
  @keyframes em-popIn       { from { opacity:0; transform:scale(0.72) } 60% { transform:scale(1.06) } to { opacity:1; transform:scale(1) } }
  @keyframes em-fadeUp      { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
  @keyframes em-spinRing    { to   { transform:rotate(360deg) } }
  @keyframes em-pulseGlow   { 0%,100% { box-shadow:0 0 0 0 rgba(220,38,38,.55) } 65% { box-shadow:0 0 0 20px rgba(220,38,38,0) } }
  @keyframes em-ambulance   { 0%,100% { transform:translateY(0) rotate(-2deg) } 50% { transform:translateY(-8px) rotate(2deg) } }
  @keyframes em-countBeat   { 0%,100% { transform:scale(1) } 45% { transform:scale(1.18) } }
  @keyframes em-shimmer     { 0% { background-position:-200% center } 100% { background-position:200% center } }
  @keyframes em-greenPulse  { 0%,100% { opacity:1 } 50% { opacity:.4 } }
  @keyframes em-rowSlide    { from { opacity:0; transform:translateX(-10px) } to { opacity:1; transform:translateX(0) } }

  .em-backdrop  { animation: em-backdropIn .22s ease both }
  .em-card      { animation: em-cardIn .34s cubic-bezier(.16,1,.3,1) both; font-family:'DM Sans',sans-serif }
  .em-pop       { animation: em-popIn  .42s cubic-bezier(.16,1,.3,1) both }
  .em-fadeup    { animation: em-fadeUp .32s cubic-bezier(.16,1,.3,1) both }
  .em-spin      { animation: em-spinRing 1s linear infinite }
  .em-pulseglow { animation: em-pulseGlow 1.6s ease-in-out infinite }
  .em-ambulance { animation: em-ambulance 1.1s ease-in-out infinite }
  .em-beat      { animation: em-countBeat 1s ease-in-out infinite }
  .em-greendot  { animation: em-greenPulse 1.4s ease-in-out infinite }

  .em-row { animation: em-rowSlide .28s cubic-bezier(.16,1,.3,1) both }
  .em-row:nth-child(1) { animation-delay:.04s }
  .em-row:nth-child(2) { animation-delay:.10s }
  .em-row:nth-child(3) { animation-delay:.16s }
  .em-row:nth-child(4) { animation-delay:.22s }

  .em-shimmer-text {
    background: linear-gradient(90deg,#fca5a5,#fff,#fca5a5,#fff,#fca5a5);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: em-shimmer 2.8s linear infinite;
  }

  .em-btn-primary {
    position:relative; overflow:hidden;
    background: linear-gradient(135deg,#dc2626,#991b1b);
    transition: transform .16s ease, box-shadow .16s ease;
  }
  .em-btn-primary::before {
    content:''; position:absolute; inset:0;
    background: linear-gradient(135deg,#ef4444,#dc2626);
    opacity:0; transition:opacity .2s;
  }
  .em-btn-primary:hover::before  { opacity:1 }
  .em-btn-primary:hover          { transform:translateY(-1px); box-shadow:0 8px 24px rgba(220,38,38,.4) }
  .em-btn-primary:active         { transform:scale(.97) }

  .em-btn-secondary {
    transition: transform .16s ease, background .16s ease, border-color .16s ease;
  }
  .em-btn-secondary:hover { background:#f1f5f9; border-color:#cbd5e1; transform:translateY(-1px) }
  .em-btn-secondary:active{ transform:scale(.97) }

  .em-btn-green {
    background: linear-gradient(135deg,#16a34a,#059669);
    transition: transform .16s ease, box-shadow .16s ease;
  }
  .em-btn-green:hover  { transform:translateY(-1px); box-shadow:0 8px 22px rgba(22,163,74,.38) }
  .em-btn-green:active { transform:scale(.97) }

  .em-link-green {
    background: linear-gradient(135deg,#16a34a,#059669);
    transition: transform .16s ease, box-shadow .16s ease;
  }
  .em-link-green:hover  { transform:translateY(-1px); box-shadow:0 8px 22px rgba(22,163,74,.38) }

  .em-link-red {
    background: linear-gradient(135deg,#dc2626,#991b1b);
    transition: transform .16s ease, box-shadow .16s ease;
  }
  .em-link-red:hover { transform:translateY(-1px); box-shadow:0 8px 22px rgba(220,38,38,.38) }
`;

/* ── Shared layout tokens ── */
const T = {
  pad: "clamp(16px, 4vw, 24px)",
  radius: "20px",
  fs: {
    xs:  "clamp(9px,  2vw, 11px)",
    sm:  "clamp(11px, 2.5vw, 13px)",
    md:  "clamp(13px, 3vw, 15px)",
    lg:  "clamp(16px, 4vw, 20px)",
    xl:  "clamp(20px, 5vw, 26px)",
    h:   "clamp(22px, 5.5vw, 30px)",
  },
};

/* ── Reusable primitives ── */
const StatChip = ({ icon, label, value, accent }) => (
  <div style={{
    background: "#fafafa",
    border: `1.5px solid ${accent}22`,
    borderRadius: "14px",
    padding: "clamp(10px,2.5vw,14px)",
    textAlign: "center",
    flex: 1,
  }}>
    <div style={{ fontSize: "clamp(16px,4vw,20px)", marginBottom: "4px" }}>{icon}</div>
    <p style={{ fontWeight:800, fontSize:T.fs.md, color: accent, margin:0, lineHeight:1.1 }}>{value}</p>
    <p style={{ fontSize:T.fs.xs, color:"#9ca3af", margin:"3px 0 0", textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:600 }}>{label}</p>
  </div>
);

const InfoRow = ({ icon, label, value, delay = 0 }) => (
  <div className="em-row" style={{
    display:"flex", alignItems:"center", gap:"12px",
    padding:"10px 0",
    borderBottom:"1px solid #f1f5f9",
    animationDelay:`${delay}s`,
  }}>
    <span style={{
      width:"32px", height:"32px", borderRadius:"9px",
      background:"#f8fafc", border:"1px solid #e2e8f0",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:"14px", flexShrink:0,
    }}>{icon}</span>
    <div style={{ flex:1, minWidth:0 }}>
      <p style={{ fontSize:T.fs.xs, color:"#9ca3af", margin:0, textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700 }}>{label}</p>
      <p style={{ fontSize:T.fs.sm, fontWeight:700, color:"#1e293b", margin:"2px 0 0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{value}</p>
    </div>
  </div>
);

/* ── Dismiss X button ── */
const CloseBtn = ({ onClick }) => (
  <button onClick={onClick} style={{
    width:"32px", height:"32px", borderRadius:"10px",
    background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.22)",
    color:"#fff", fontSize:"14px", cursor:"pointer",
    display:"flex", alignItems:"center", justifyContent:"center",
    transition:"background .18s",
    flexShrink: 0,
  }}
  onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.28)"}
  onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.15)"}
  >✕</button>
);

/* ── Phase: Locating ── */
const PhaseLocating = ({ onPickMap }) => (
  <div className="em-fadeup" style={{ textAlign:"center", padding:"clamp(8px,2vw,16px) 0" }}>
    <div style={{
      width:"52px", height:"52px", margin:"0 auto 20px",
      borderRadius:"50%",
      border:"3px solid #fee2e2",
      borderTopColor:"#dc2626",
    }} className="em-spin" />
    <p style={{ fontWeight:800, fontSize:T.fs.lg, color:"#1e293b", margin:"0 0 6px", fontFamily:"'Sora',sans-serif" }}>
      Locating you…
    </p>
    <p style={{ fontSize:T.fs.sm, color:"#94a3b8", margin:"0 0 22px", lineHeight:1.55 }}>
      Allow location access if prompted
    </p>
    <button onClick={onPickMap} className="em-btn-secondary" style={{
      padding:"11px 24px", borderRadius:"12px",
      background:"#fff5f5", border:"1.5px solid #fecaca",
      color:"#dc2626", fontWeight:700, fontSize:T.fs.sm, cursor:"pointer",
    }}>📍 Set location manually</button>
  </div>
);

/* ── Phase: SOS Countdown ── */
const PhaseCountdown = ({ count, nearest, onCancel, onSendNow }) => (
  <div className="em-fadeup" style={{ textAlign:"center" }}>
    <div className="em-beat em-pulseglow" style={{
      width:"clamp(80px,18vw,100px)", height:"clamp(80px,18vw,100px)",
      borderRadius:"50%",
      background:"linear-gradient(135deg,#dc2626,#7f1d1d)",
      display:"flex", alignItems:"center", justifyContent:"center",
      margin:"0 auto clamp(14px,3vw,20px)",
    }}>
      <span style={{ fontSize:"clamp(32px,8vw,44px)", fontWeight:900, color:"#fff", fontFamily:"'Sora',sans-serif", lineHeight:1 }}>
        {count}
      </span>
    </div>

    <p style={{ fontWeight:800, fontSize:T.fs.lg, color:"#1e293b", margin:"0 0 4px", fontFamily:"'Sora',sans-serif" }}>
      Sending SOS in {count}s
    </p>
    {nearest && (
      <div style={{ margin:"0 0 clamp(14px,3vw,20px)" }}>
        <p style={{ fontSize:T.fs.sm, color:"#64748b", margin:"0 0 2px" }}>
          Nearest ER: <strong style={{ color:"#dc2626" }}>{nearest.name}</strong>
        </p>
        <p style={{ fontSize:T.fs.xs, color:"#94a3b8", margin:0 }}>
          {nearest.distanceKm?.toFixed(1)} km · ~{nearest.waitTime} min wait
        </p>
      </div>
    )}

    <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
      <button onClick={onSendNow} className="em-btn-primary" style={{
        width:"100%", padding:"clamp(12px,3vw,15px)",
        borderRadius:"14px", border:"none",
        color:"#fff", fontWeight:800, fontSize:T.fs.md, cursor:"pointer",
        display:"flex", alignItems:"center", justifyContent:"center", gap:"8px",
      }}>
        <span>🚨</span> Send SOS Now
      </button>
      <button onClick={onCancel} className="em-btn-secondary" style={{
        width:"100%", padding:"clamp(11px,2.5vw,13px)",
        borderRadius:"14px", background:"#f8fafc",
        border:"1.5px solid #e2e8f0", color:"#64748b",
        fontWeight:700, fontSize:T.fs.sm, cursor:"pointer",
      }}>
        ✕ Cancel — Not an Emergency
      </button>
    </div>
  </div>
);

/* ── Phase: Confirm ── */
const PhaseConfirm = ({ nearest, etaMin, onConfirm, onCancel }) => (
  <div className="em-pop" style={{ textAlign:"center" }}>
    <div style={{ fontSize:"clamp(40px,10vw,56px)", marginBottom:"clamp(10px,2vw,14px)" }}>🚑</div>
    <p style={{ fontWeight:800, fontSize:T.fs.h, color:"#1e293b", margin:"0 0 6px", fontFamily:"'Sora',sans-serif" }}>
      Need an Ambulance?
    </p>
    <p style={{ fontSize:T.fs.sm, color:"#64748b", margin:"0 0 4px", lineHeight:1.5 }}>
      Dispatching from
    </p>
    <p style={{ fontWeight:700, fontSize:T.fs.md, color:"#dc2626", margin:"0 0 clamp(16px,3vw,22px)" }}>
      {nearest?.name}
    </p>

    <div style={{ display:"flex", gap:"10px", marginBottom:"clamp(14px,3vw,18px)" }}>
      <StatChip icon="⏱" label="ETA" value={`~${etaMin} min`} accent="#3730a3" />
      <StatChip icon="📍" label="Distance" value={`${nearest?.distanceKm?.toFixed(1)} km`} accent="#dc2626" />
    </div>

    <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
      <button onClick={onConfirm} className="em-btn-primary" style={{
        width:"100%", padding:"clamp(12px,3vw,15px)", borderRadius:"14px",
        border:"none", color:"#fff", fontWeight:800, fontSize:T.fs.md, cursor:"pointer",
        display:"flex", alignItems:"center", justifyContent:"center", gap:"8px",
      }}>
        <span>✅</span> Yes, Send Ambulance
      </button>
      <button onClick={onCancel} className="em-btn-secondary" style={{
        width:"100%", padding:"clamp(11px,2.5vw,13px)", borderRadius:"14px",
        background:"#f8fafc", border:"1.5px solid #e2e8f0",
        color:"#64748b", fontWeight:700, fontSize:T.fs.sm, cursor:"pointer",
      }}>
        No, I'm okay
      </button>
    </div>
  </div>
);

/* ── Phase: Dispatched ── */
const PhaseDispatched = ({ nearest, etaMin, userCoords, googleMapsUrl, onClose }) => (
  <div className="em-pop" style={{ textAlign:"center" }}>
    <div className="em-ambulance" style={{ fontSize:"clamp(40px,10vw,52px)", marginBottom:"6px" }}>🚑</div>

    <div style={{
      display:"inline-flex", alignItems:"center", gap:"7px",
      background:"linear-gradient(135deg,#dcfce7,#bbf7d0)",
      border:"1.5px solid #86efac",
      borderRadius:"30px", padding:"5px 16px", marginBottom:"clamp(10px,2vw,14px)",
    }}>
      <span className="em-greendot" style={{ width:"7px", height:"7px", borderRadius:"50%", background:"#16a34a", display:"inline-block" }} />
      <span style={{ fontSize:T.fs.xs, fontWeight:700, color:"#15803d", letterSpacing:"0.06em" }}>Ambulance Dispatched</span>
    </div>

    <p style={{ fontWeight:900, fontSize:T.fs.h, color:"#1e293b", margin:"0 0 6px", fontFamily:"'Sora',sans-serif" }}>
      Help is on the way!
    </p>
    <p style={{ fontSize:T.fs.sm, color:"#64748b", margin:"0 0 clamp(14px,3vw,18px)", lineHeight:1.6 }}>
      Ambulance from <strong style={{ color:"#1e293b" }}>{nearest?.name}</strong><br/>
      arriving in approx.{" "}
      <strong style={{ color:"#dc2626" }}>{etaMin} minutes</strong>
    </p>

    {/* Info rows */}
    <div style={{
      background:"#f8fafc", borderRadius:"16px",
      border:"1.5px solid #e2e8f0",
      padding:"4px clamp(12px,3vw,16px) 0",
      marginBottom:"clamp(12px,3vw,16px)",
      textAlign:"left",
    }}>
      <InfoRow icon="📍" label="Your location"    value={`${userCoords?.lat?.toFixed(4)}, ${userCoords?.lng?.toFixed(4)}`} delay={0} />
      <InfoRow icon="🏥" label="Dispatching from" value={nearest?.name}  delay={0.06} />
      <InfoRow icon="⏱" label="Est. arrival"      value={`~${etaMin} minutes`} delay={0.12} />
      <InfoRow icon="📞" label="ER direct line"    value={nearest?.phone} delay={0.18} />
    </div>

    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"10px" }}>
      <a href={`tel:${nearest?.phone}`} className="em-link-red" style={{
        display:"flex", alignItems:"center", justifyContent:"center",
        gap:"6px", padding:"clamp(11px,2.5vw,13px)", borderRadius:"12px",
        textDecoration:"none", color:"#fff", fontWeight:800, fontSize:T.fs.sm,
      }}>📞 Call ER</a>
      <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="em-link-green" style={{
        display:"flex", alignItems:"center", justifyContent:"center",
        gap:"6px", padding:"clamp(11px,2.5vw,13px)", borderRadius:"12px",
        textDecoration:"none", color:"#fff", fontWeight:800, fontSize:T.fs.sm,
      }}>🗺 Directions</a>
    </div>

    <button onClick={onClose} className="em-btn-secondary" style={{
      width:"100%", padding:"clamp(10px,2vw,12px)", borderRadius:"12px",
      border:"1.5px solid #e2e8f0", background:"#f8fafc",
      color:"#64748b", fontWeight:700, fontSize:T.fs.sm, cursor:"pointer",
    }}>Close</button>
  </div>
);

/* ── Phase: Denied ── */
const PhaseDenied = ({ onPickMap, onClose }) => (
  <div className="em-fadeup" style={{ textAlign:"center" }}>
    <div style={{
      width:"56px", height:"56px", borderRadius:"18px",
      background:"linear-gradient(135deg,#fef2f2,#fee2e2)",
      border:"1.5px solid #fecaca",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:"26px", margin:"0 auto clamp(12px,2.5vw,16px)",
    }}>📍</div>
    <p style={{ fontWeight:800, fontSize:T.fs.lg, color:"#1e293b", margin:"0 0 6px", fontFamily:"'Sora',sans-serif" }}>
      Location unavailable
    </p>
    <p style={{ fontSize:T.fs.sm, color:"#94a3b8", margin:"0 0 clamp(16px,3vw,22px)", lineHeight:1.6 }}>
      Set your location manually to find the nearest ER,<br/>or call 112 directly.
    </p>
    <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
      <button onClick={onPickMap} className="em-btn-green" style={{
        width:"100%", padding:"clamp(12px,3vw,14px)", borderRadius:"12px",
        border:"none", color:"#fff", fontWeight:800, fontSize:T.fs.md, cursor:"pointer",
      }}>📍 Set Location on Map</button>
      <a href="tel:112" className="em-link-red" style={{
        display:"block", padding:"clamp(12px,3vw,14px)", borderRadius:"12px",
        color:"#fff", fontWeight:800, fontSize:T.fs.md, textDecoration:"none",
      }}>📞 Call 112 Now</a>
      <button onClick={onClose} className="em-btn-secondary" style={{
        width:"100%", padding:"clamp(10px,2vw,12px)", borderRadius:"12px",
        border:"1.5px solid #e2e8f0", background:"#f8fafc",
        color:"#64748b", fontWeight:700, fontSize:T.fs.sm, cursor:"pointer",
      }}>Close</button>
    </div>
  </div>
);

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
export function EmergencyModal({ open, onClose, hospitals = [] }) {
  const [phase, setPhase]         = useState("locating");
  const [nearest, setNearest]     = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  const [sosCount, setSosCount]   = useState(3);
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
      const bedScore  = ((h.beds?.available || 0) + (h.icu?.available || 0)) / maxBeds;
      return { ...h, score: distScore * 0.6 + bedScore * 0.4 };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored[0] || null;
  }, []);

  /* Reset & locate on open */
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
          const parsed   = elements.map((el, i) => parseElement(el, i, lat, lng)).filter(Boolean);
          const list     = parsed.length > 0 ? parsed : hospitals;
          const n        = findNearest(lat, lng, list);
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

  /* Countdown tick */
  useEffect(() => {
    if (phase !== "sos_countdown") return;
    setSosCount(3);
    timerRef.current = setInterval(() => {
      setSosCount((c) => {
        if (c <= 1) { clearInterval(timerRef.current); setPhase("confirm"); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const cancelSOS = useCallback(() => {
    clearInterval(timerRef.current);
    onClose();
  }, [onClose]);

  const handleManualLocation = useCallback(async ({ lat, lng }) => {
    clearInterval(timerRef.current);
    setUserCoords({ lat, lng });
    setPhase("locating");
    try {
      const elements = await fetchFromOverpass(lat, lng, 15000);
      const parsed   = elements.map((el, i) => parseElement(el, i, lat, lng)).filter(Boolean);
      const list     = parsed.length > 0 ? parsed : hospitals;
      const n        = findNearest(lat, lng, list);
      setNearest(n);
      setPhase(n ? "sos_countdown" : "denied");
    } catch {
      const n = findNearest(lat, lng, hospitals);
      setNearest(n);
      setPhase(n ? "sos_countdown" : "denied");
    }
  }, [hospitals, findNearest]);

  if (!open) return null;

  const googleMapsUrl = nearest && userCoords
    ? `https://www.google.com/maps/dir/${userCoords.lat},${userCoords.lng}/${nearest.lat},${nearest.lng}`
    : nearest
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nearest.name)}`
    : "#";

  const etaMin = nearest?.distanceKm
    ? Math.max(3, Math.round((nearest.distanceKm / 40) * 60))
    : 8;

  return (
    <>
      <style>{STYLES}</style>

      {showMapPicker && (
        <MapLocationPicker
          open={showMapPicker}
          onClose={() => setShowMapPicker(false)}
          onConfirm={handleManualLocation}
          initialLat={userCoords?.lat}
          initialLng={userCoords?.lng}
        />
      )}

      {/* ── Backdrop ── */}
      <div
        className="em-backdrop"
        onClick={(e) => e.target === e.currentTarget && cancelSOS()}
        style={{
          position:"fixed", inset:0, zIndex:9997,
          background:"rgba(2,6,23,0.82)",
          backdropFilter:"blur(12px) saturate(1.4)",
          display:"flex", alignItems:"center", justifyContent:"center",
          padding:"clamp(12px,4vw,24px)",
        }}
      >
        {/* ── Card ── */}
        <div
          className="em-card"
          style={{
            background:"#fff",
            borderRadius:T.radius,
            width:"100%",
            maxWidth:"clamp(320px, 90vw, 420px)",
            maxHeight:"calc(100dvh - clamp(24px,8vw,48px))",
            display:"flex",
            flexDirection:"column",
            overflow:"hidden",
            boxShadow:"0 40px 120px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.07)",
          }}
        >
          {/* ── Header ── */}
          <div style={{
            background:"linear-gradient(135deg,#dc2626 0%,#7f1d1d 60%,#450a0a 100%)",
            padding:`clamp(14px,3vw,18px) ${T.pad}`,
            flexShrink:0,
            position:"relative",
            overflow:"hidden",
          }}>
            {/* subtle noise overlay */}
            <div style={{
              position:"absolute", inset:0, opacity:0.04,
              backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              pointerEvents:"none",
            }}/>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"clamp(8px,2vw,12px)" }}>
                <div className="em-pulseglow" style={{
                  width:"clamp(34px,8vw,42px)", height:"clamp(34px,8vw,42px)",
                  borderRadius:"12px",
                  background:"rgba(255,255,255,0.15)",
                  border:"1.5px solid rgba(255,255,255,0.22)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:"clamp(16px,4vw,20px)",
                  backdropFilter:"blur(8px)",
                }}>🚨</div>
                <div>
                  <p style={{
                    color:"rgba(255,255,255,0.5)",
                    fontSize:T.fs.xs, fontWeight:800,
                    letterSpacing:"0.18em", textTransform:"uppercase", margin:0,
                  }}>Emergency Alert</p>
                  <p className="em-shimmer-text" style={{
                    fontWeight:800, fontSize:T.fs.md,
                    margin:0, fontFamily:"'Sora',sans-serif",
                  }}>MediLife Emergency</p>
                </div>
              </div>
              <CloseBtn onClick={cancelSOS} />
            </div>
          </div>

          {/* ── Scrollable body ── */}
          <div style={{
            flex:1,
            overflowY:"auto",
            padding:`clamp(18px,4vw,24px) ${T.pad}`,
            scrollbarWidth:"thin",
            scrollbarColor:"#fee2e2 transparent",
          }}>
            {phase === "locating"      && <PhaseLocating  onPickMap={() => setShowMapPicker(true)} />}
            {phase === "sos_countdown" && <PhaseCountdown count={sosCount} nearest={nearest} onCancel={cancelSOS} onSendNow={() => { clearInterval(timerRef.current); setPhase("confirm"); }} />}
            {phase === "confirm"       && <PhaseConfirm   nearest={nearest} etaMin={etaMin} onConfirm={() => setPhase("dispatched")} onCancel={cancelSOS} />}
            {phase === "dispatched"    && <PhaseDispatched nearest={nearest} etaMin={etaMin} userCoords={userCoords} googleMapsUrl={googleMapsUrl} onClose={onClose} />}
            {phase === "denied"        && <PhaseDenied    onPickMap={() => setShowMapPicker(true)} onClose={onClose} />}
          </div>

          {/* ── Footer ── */}
          <div style={{
            borderTop:"1px solid #f1f5f9",
            padding:`clamp(8px,2vw,12px) ${T.pad}`,
            background:"#fafafa",
            flexShrink:0,
            textAlign:"center",
          }}>
            <p style={{ margin:0, fontSize:T.fs.xs, color:"#cbd5e1", fontWeight:500 }}>
              Always call{" "}
              <a href="tel:112" style={{ color:"#ef4444", fontWeight:800, textDecoration:"none" }}>112</a>
              {" "}for life-threatening emergencies · MediLife alert is supplementary
            </p>
          </div>
        </div>
      </div>
    </>
  );
}