"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession, signOut } from "@/lib/auth-client";
import { useHospitals, haversine } from "./useHospitals";
import { MapLocationPicker } from "./MapLocationPicker";
import { EmergencyModal } from "./EmergencyModal";

const FILTERS = ["All", "Cardiac", "Neuro", "Ortho", "Oncology", "Pediatrics"];

// Maps filter label → keywords to match against specialty strings
const FILTER_MAP = {
  Cardiac:    ["cardio"],
  Neuro:      ["neuro"],
  Ortho:      ["ortho", "spine"],
  Oncology:   ["onco"],
  Pediatrics: ["pediatr", "paediatr"],
};

/* ─────────────────────── AvailPill ──────────────────────────── */
function AvailPill({ available, total, label }) {
  const pct = (available / total) * 100;
  const s = pct > 25 ? "good" : pct > 8 ? "warn" : "crit";
  const c = {
    good: { bg: "rgba(20,184,166,0.08)", text: "#0d9488", bar: "#14b8a6", dot: "#14b8a6" },
    warn: { bg: "rgba(234,179,8,0.08)", text: "#a16207", bar: "#eab308", dot: "#eab308" },
    crit: { bg: "rgba(239,68,68,0.09)", text: "#dc2626", bar: "#ef4444", dot: "#ef4444" },
  }[s];
  return (
    <div style={{ background: c.bg }} className="rounded-xl p-3 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-black uppercase tracking-[0.15em]" style={{ color: "#64748b" }}>{label}</span>
        <span className="flex items-center gap-1 text-[11px] font-bold" style={{ color: c.text }}>
          <span className={`w-1.5 h-1.5 rounded-full ${s === "crit" ? "animate-pulse" : ""}`} style={{ background: c.dot }} />
          {available}/{total}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(pct, 4)}%`, background: c.bar }} />
      </div>
    </div>
  );
}

/* ─────────────────────── DirectionModal ────────────────────── */
function DirectionModal({ hospital, userLat, userLng, onClose }) {
  const googleUrl = userLat && userLng
    ? `https://www.google.com/maps/dir/${userLat},${userLng}/${hospital.lat},${hospital.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospital.name + " " + hospital.address)}`;
  const osmEmbedUrl = userLat && userLng
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${Math.min(hospital.lng, userLng) - 0.03},${Math.min(hospital.lat, userLat) - 0.02},${Math.max(hospital.lng, userLng) + 0.03},${Math.max(hospital.lat, userLat) + 0.02}&layer=mapnik&marker=${hospital.lat},${hospital.lng}`
    : `https://www.openstreetmap.org/export/embed.html?bbox=${hospital.lng - 0.025},${hospital.lat - 0.018},${hospital.lng + 0.025},${hospital.lat + 0.018}&layer=mapnik&marker=${hospital.lat},${hospital.lng}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}>
      <div className="bg-white rounded-2xl overflow-hidden w-full max-w-xl shadow-2xl flex flex-col" style={{ maxHeight: "85vh" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Directions to</p>
            <h3 className="font-bold text-slate-900 text-[16px] leading-tight" style={{ fontFamily: "'Sora',sans-serif" }}>{hospital.name}</h3>
            <p className="text-[12px] text-slate-400 mt-0.5">{hospital.address}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-all text-sm">✕</button>
        </div>
        <div className="relative flex-1 min-h-[280px]">
          <iframe src={osmEmbedUrl} className="w-full h-full border-0" title="Route map" loading="lazy" />
        </div>
        {hospital.distanceKm && (
          <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100">
            {[{ label: "Distance", value: `${hospital.distanceKm.toFixed(1)} km` }, { label: "Est. Wait", value: `~${hospital.waitTime} min` }, { label: "Emergency", value: hospital.emergency ? "Available" : "No" }].map(s => (
              <div key={s.label} className="text-center py-3">
                <p className="font-bold text-slate-800 text-[14px]">{s.value}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}
        <div className="p-4 grid grid-cols-2 gap-3 border-t border-slate-100">
          <a href={googleUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${hospital.accentHex}, ${hospital.accentHex}cc)` }}>
            🗺 Open in Google Maps
          </a>
          <a href={`tel:${hospital.phone}`}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-all">
            📞 Call Hospital
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── HospitalCard ──────────────────────── */
function HospitalCard({ h, onSelect, isSelected, userLat, userLng }) {
  const [showDir, setShowDir] = useState(false);
  const waitColor =
    h.waitTime <= 15 ? { bg: "rgba(20,184,166,0.08)", text: "#0d9488" } :
    h.waitTime <= 30 ? { bg: "rgba(234,179,8,0.08)", text: "#a16207" } :
                       { bg: "rgba(239,68,68,0.08)", text: "#dc2626" };
  return (
    <>
      {showDir && <DirectionModal hospital={h} userLat={userLat} userLng={userLng} onClose={() => setShowDir(false)} />}
      <div
        className="group relative bg-white rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer flex flex-col"
        style={{
          border: isSelected ? `2px solid ${h.accentHex}` : "1.5px solid #e8edf2",
          boxShadow: isSelected ? `0 0 0 4px ${h.accentHex}18, 0 12px 40px ${h.accentHex}14` : "0 2px 12px rgba(0,0,0,0.04)",
          transform: isSelected ? "translateY(-2px)" : undefined,
        }}
        onClick={() => onSelect(h)}
      >
        <div className="h-[3px] w-full" style={{ background: h.accentHex }} />
        <div className="p-5 flex flex-col gap-3 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-[12px] flex-shrink-0 shadow-sm" style={{ background: h.accentHex }}>
                {h.shortName}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-[13.5px] leading-tight" style={{ fontFamily: "'Sora',sans-serif" }}>{h.name}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{h.type}</p>
              </div>
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.12em] px-2.5 py-1 rounded-full flex-shrink-0"
              style={{ color: h.accentHex, background: `${h.accentHex}12`, border: `1px solid ${h.accentHex}25` }}>
              {h.badge}
            </span>
          </div>
          <div className="flex items-center flex-wrap gap-2">
            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600">
              <svg className="w-3 h-3 fill-amber-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              {h.rating}
            </span>
            <span className="w-px h-3.5 bg-slate-200" />
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: waitColor.bg, color: waitColor.text }}>⏱ ~{h.waitTime} min</span>
            {h.emergency && (<><span className="w-px h-3.5 bg-slate-200" /><span className="flex items-center gap-1 text-[10px] font-bold text-rose-500"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />ER</span></>)}
            {h.distanceKm !== undefined && (<><span className="w-px h-3.5 bg-slate-200" /><span className="text-[11px] font-semibold text-slate-400">📍 {h.distanceKm.toFixed(1)} km</span></>)}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <AvailPill available={h.beds.available} total={h.beds.total} label="Gen Beds" />
            <AvailPill available={h.icu.available} total={h.icu.total} label="ICU Beds" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {h.specialties.map(s => (
              <span key={s} className="text-[10.5px] font-medium px-2.5 py-1 rounded-full" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569" }}>{s}</span>
            ))}
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-50">
            <p className="text-[10.5px] text-slate-400 truncate max-w-[55%]">{h.address}</p>
            <div className="flex items-center gap-1.5">
              <a href={`tel:${h.phone}`} onClick={e => e.stopPropagation()} className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z" /></svg>
              </a>
              <button onClick={e => { e.stopPropagation(); setShowDir(true); }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white transition-all hover:opacity-90"
                style={{ background: h.accentHex }}>
                🗺 Directions
              </button>
              <button onClick={e => { e.stopPropagation(); onSelect(h); }}
                className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg transition-all"
                style={{ background: `${h.accentHex}12`, color: h.accentHex }}>
                Details →
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────── MapPanel ──────────────────────────── */
function MapPanel({ hospital, onClose, userLat, userLng }) {
  const [showDir, setShowDir] = useState(false);
  if (!hospital) return null;
  const delta = 0.022;
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${hospital.lng - delta},${hospital.lat - delta * 0.7},${hospital.lng + delta},${hospital.lat + delta * 0.7}&layer=mapnik&marker=${hospital.lat},${hospital.lng}`;
  const pctBeds = Math.round((hospital.beds.available / hospital.beds.total) * 100);
  const pctIcu = Math.round((hospital.icu.available / hospital.icu.total) * 100);
  return (
    <>
      {showDir && <DirectionModal hospital={hospital} userLat={userLat} userLng={userLng} onClose={() => setShowDir(false)} />}
      <div className="flex flex-col h-full bg-white">
        <div className="p-5" style={{ background: hospital.accentHex }}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-white/60 text-[9px] font-bold uppercase tracking-widest mb-1">Selected Hospital</p>
              <h3 className="text-white font-extrabold text-[19px] leading-tight" style={{ fontFamily: "'Sora',sans-serif" }}>{hospital.name}</h3>
              <p className="text-white/70 text-[11px] mt-1">{hospital.address}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/35 flex items-center justify-center text-white transition-all flex-shrink-0">✕</button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[{ label: "Rating", value: `★ ${hospital.rating}` }, { label: "Wait", value: `~${hospital.waitTime}m` }, { label: "Distance", value: hospital.distanceKm !== undefined ? `${hospital.distanceKm.toFixed(1)}km` : "—" }].map(s => (
              <div key={s.label} className="bg-white/15 rounded-xl p-2.5 text-center">
                <p className="text-white font-extrabold text-[14px]">{s.value}</p>
                <p className="text-white/60 text-[9px] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative flex-1 min-h-0">
          <iframe key={hospital.id} src={osmUrl} className="w-full h-full border-0" title={`Map – ${hospital.name}`} loading="lazy" allowFullScreen />
        </div>
        <div className="px-5 py-4 border-t border-slate-100 grid grid-cols-2 gap-4 bg-slate-50/60">
          {[{ label: "General Beds", avail: hospital.beds.available, total: hospital.beds.total, pct: pctBeds }, { label: "ICU Beds", avail: hospital.icu.available, total: hospital.icu.total, pct: pctIcu }].map(b => (
            <div key={b.label} className="space-y-1.5">
              <div className="flex justify-between text-[10px]">
                <span className="font-semibold text-slate-400 uppercase tracking-wide">{b.label}</span>
                <span className="font-bold" style={{ color: b.pct > 25 ? "#0d9488" : b.pct > 8 ? "#d97706" : "#ef4444" }}>{b.avail} free</span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.max(b.pct, 4)}%`, background: hospital.accentHex }} />
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 grid grid-cols-2 gap-3 border-t border-slate-100">
          <button onClick={() => setShowDir(true)} className="flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold text-white hover:opacity-90 transition-all" style={{ background: hospital.accentHex }}>🗺 Get Directions</button>
          <a href={`tel:${hospital.phone}`} className="flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all">📞 Call Now</a>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────── ChatWidget ────────────────────────── */
export function ChatWidget({ onHospitalSelect, userAddress, userLat, userLng, hospitals, activeFilter, selectedHospital, locationStatus }) {
  const [open, setOpen] = useState(true);
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "Hi, I'm Medi 👋\n\nDescribe your symptoms and I'll match you with the best hospital nearby."
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          userContext: {
            address: userAddress || null,
            lat: userLat || null,
            lng: userLng || null,
            locationGranted: locationStatus === "granted",
          },
          pageContext: {
            visibleHospitals: (hospitals || []).map(h => ({
              id: h.id,
              name: h.name,
              type: h.type,
              distanceKm: h.distanceKm ?? null,
              rating: h.rating,
              waitTime: h.waitTime,
              bedsAvailable: h.beds.available,
              bedsTotal: h.beds.total,
              icuAvailable: h.icu.available,
              icuTotal: h.icu.total,
              emergency: h.emergency,
              specialties: h.specialties,
              address: h.address,
              phone: h.phone,
              badge: h.badge,
            })),
            activeFilter,
            selectedHospital: selectedHospital ? { id: selectedHospital.id, name: selectedHospital.name } : null,
            totalHospitalsShown: (hospitals || []).length,
          },
        }),
      });
      const data = await res.json();
      let reply = data.reply || "Sorry, something went wrong.";
      const mapMatch = reply.match(/\[OPEN_MAP:(\d+)\]/);
      if (mapMatch) {
        const hospId = parseInt(mapMatch[1]);
        reply = reply.replace(/\[OPEN_MAP:\d+\]/g, "").trim();
        setMessages(p => [...p, { role: "assistant", content: reply }]);
        setTimeout(() => {
          onHospitalSelect(hospId);
          document.getElementById("hospitals")?.scrollIntoView({ behavior: "smooth" });
        }, 800);
      } else {
        setMessages(p => [...p, { role: "assistant", content: reply }]);
      }
    } catch {
      setMessages(p => [...p, { role: "assistant", content: "Connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&display=swap');

        @keyframes floatUp { from{opacity:0;transform:translateY(18px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes msgIn   { from{opacity:0;transform:translateY(8px)}            to{opacity:1;transform:translateY(0)} }
        @keyframes dotDance{ 0%,80%,100%{transform:translateY(0);opacity:.35} 40%{transform:translateY(-5px);opacity:1} }
        @keyframes orbPulse{ 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.15);opacity:1} }
        @keyframes ringPop { 0%{transform:scale(0.85);opacity:0} 60%{transform:scale(1.05);opacity:1} 100%{transform:scale(1);opacity:1} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes gradShift{ 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }

        .cw-wrap { animation:floatUp 0.32s cubic-bezier(.16,1,.3,1) both; font-family:'Cabinet Grotesk',sans-serif; }
        .cw-msg  { animation:msgIn 0.24s cubic-bezier(.16,1,.3,1) both; }
        .cw-dot  { animation:dotDance 1.2s ease-in-out infinite; }
        .cw-orb  { animation:orbPulse 2.4s ease-in-out infinite; }
        .cw-fab  { animation:ringPop 0.4s cubic-bezier(.16,1,.3,1) both; }

        .cw-header-bg {
          background: linear-gradient(135deg,#052e16,#14532d,#166534,#052e16);
          background-size: 300% 300%;
          animation: gradShift 6s ease infinite;
        }
        .cw-shimmer-text {
          background: linear-gradient(90deg,#86efac,#fff,#4ade80,#fff,#86efac);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
        .cw-user-bubble { background:linear-gradient(135deg,#166534,#15803d,#16a34a); box-shadow:0 4px 16px rgba(22,163,74,.3); }
        .cw-ai-bubble   { background:#fff; box-shadow:0 2px 12px rgba(0,0,0,.06),inset 0 0 0 1px rgba(0,0,0,.06); }
        .cw-input-wrap  { background:rgba(255,255,255,0.92); backdrop-filter:blur(16px); border-top:1px solid rgba(0,0,0,.06); }
        .cw-input       { font-family:'Cabinet Grotesk',sans-serif; }
        .cw-input:focus { outline:none; }
        .cw-send {
          background:linear-gradient(135deg,#16a34a,#15803d);
          box-shadow:0 4px 14px rgba(22,163,74,.4);
          transition:all 0.18s cubic-bezier(.16,1,.3,1);
        }
        .cw-send:hover:not(:disabled) { transform:scale(1.08); box-shadow:0 6px 20px rgba(22,163,74,.5); }
        .cw-send:active:not(:disabled){ transform:scale(0.94); }
        .cw-send:disabled { opacity:0.4; }
        .cw-fab-btn {
          font-family:'Cabinet Grotesk',sans-serif;
          background:linear-gradient(135deg,#14532d,#166534,#16a34a);
          box-shadow:0 8px 32px rgba(22,163,74,.5),0 2px 8px rgba(0,0,0,.15);
          transition:all 0.22s cubic-bezier(.16,1,.3,1);
          border:none; cursor:pointer;
        }
        .cw-fab-btn:hover  { transform:scale(1.1) rotate(-4deg); box-shadow:0 12px 40px rgba(22,163,74,.6); }
        .cw-fab-btn:active { transform:scale(0.94); }
        .cw-scroll::-webkit-scrollbar       { width:3px; }
        .cw-scroll::-webkit-scrollbar-track { background:transparent; }
        .cw-scroll::-webkit-scrollbar-thumb { background:#d1fae5; border-radius:99px; }
        .cw-location-badge { background:rgba(255,255,255,0.12); backdrop-filter:blur(8px); border:1px solid rgba(255,255,255,0.2); }
        .cw-noise {
          position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0.04;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }
      `}</style>

      {/* FAB */}
      <div className="cw-fab" style={{ position:"fixed", bottom:"28px", right:"28px", zIndex:50 }}>
        <button className="cw-fab-btn" onClick={() => setOpen(o => !o)}
          style={{ width:"60px", height:"60px", borderRadius:"18px", display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
          <span style={{ fontSize:"26px", lineHeight:1, filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}>
            {open ? "✕" : "🩺"}
          </span>
          {!open && (
            <span style={{ position:"absolute", top:"-4px", right:"-4px", width:"14px", height:"14px", borderRadius:"50%", background:"#4ade80", border:"2.5px solid white", animation:"orbPulse 2s ease-in-out infinite" }} />
          )}
        </button>
      </div>

      {/* PANEL */}
      {open && (
        <div className="cw-wrap" style={{
          position:"fixed", bottom:"104px", right:"28px", zIndex:50,
          width:"420px", height:"580px", borderRadius:"24px", overflow:"hidden",
          display:"flex", flexDirection:"column",
          boxShadow:"0 40px 100px rgba(0,0,0,0.22),0 8px 32px rgba(0,0,0,0.12),inset 0 0 0 1px rgba(255,255,255,0.1)",
        }}>

          {/* HEADER */}
          <div className="cw-header-bg" style={{ padding:"16px 18px 12px", position:"relative", flexShrink:0 }}>
            <div className="cw-noise" />
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"12px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                <div style={{ position:"relative" }}>
                  <div style={{ width:"42px", height:"42px", borderRadius:"13px", background:"rgba(255,255,255,0.15)", border:"1.5px solid rgba(255,255,255,0.25)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"21px", backdropFilter:"blur(8px)" }}>🩺</div>
                  <div className="cw-orb" style={{ position:"absolute", bottom:"-2px", right:"-2px", width:"11px", height:"11px", borderRadius:"50%", background:"#4ade80", border:"2px solid #052e16" }} />
                </div>
                <div>
                  <p className="cw-shimmer-text" style={{ margin:0, fontWeight:900, fontSize:"15px", letterSpacing:"-0.3px" }}>Medi AI</p>
                  <p style={{ margin:0, fontSize:"9px", color:"rgba(255,255,255,0.45)", fontWeight:600, letterSpacing:"0.08em" }}>HEALTH INTELLIGENCE ASSISTANT</p>
                </div>
              </div>
              {userAddress && (
                <div className="cw-location-badge" style={{ padding:"4px 9px", borderRadius:"9px", display:"flex", alignItems:"center", gap:"5px" }}>
                  <span style={{ width:"5px", height:"5px", borderRadius:"50%", background:"#4ade80", display:"inline-block", animation:"orbPulse 2s ease-in-out infinite" }} />
                  <span style={{ color:"rgba(255,255,255,0.8)", fontSize:"10px", fontWeight:700, maxWidth:"85px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{userAddress.split(",")[0]}</span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"7px" }}>
              {[
                { label:"Hospitals", value:(hospitals||[]).length || "—" },
                { label:"Avg Wait",  value:hospitals?.length ? `${Math.round(hospitals.reduce((a,h)=>a+h.waitTime,0)/hospitals.length)}m` : "—" },
                { label:"ERs Open",  value:hospitals?.filter(h=>h.emergency).length || "—" },
              ].map(s => (
                <div key={s.label} style={{ background:"rgba(255,255,255,0.08)", borderRadius:"9px", padding:"7px 10px", border:"1px solid rgba(255,255,255,0.1)" }}>
                  <p style={{ margin:0, fontWeight:800, fontSize:"14px", color:"#fff", letterSpacing:"-0.3px" }}>{s.value}</p>
                  <p style={{ margin:0, fontSize:"9px", color:"rgba(255,255,255,0.4)", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", marginTop:"1px" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MESSAGES */}
          <div className="cw-scroll" style={{ flex:1, overflowY:"auto", padding:"14px 14px 8px", display:"flex", flexDirection:"column", gap:"10px", background:"#f0fdf4" }}>
            {messages.map((m, i) => (
              <div key={i} className="cw-msg" style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start", alignItems:"flex-end", gap:"7px" }}>
                {m.role === "assistant" && (
                  <div style={{ width:"26px", height:"26px", borderRadius:"9px", background:"linear-gradient(135deg,#14532d,#16a34a)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"12px", flexShrink:0, marginBottom:"2px", boxShadow:"0 3px 8px rgba(22,163,74,.28)" }}>🩺</div>
                )}
                <div className={m.role==="user"?"cw-user-bubble":"cw-ai-bubble"} style={{
                  maxWidth:"78%", padding:"10px 13px",
                  borderRadius:m.role==="user"?"17px 17px 4px 17px":"17px 17px 17px 4px",
                  fontSize:"13px", lineHeight:1.55, fontWeight:500, whiteSpace:"pre-wrap",
                  color:m.role==="user"?"#fff":"#1a2e1a",
                  fontFamily:"'Cabinet Grotesk',sans-serif",
                }}>
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="cw-msg" style={{ display:"flex", alignItems:"flex-end", gap:"7px" }}>
                <div style={{ width:"26px", height:"26px", borderRadius:"9px", background:"linear-gradient(135deg,#14532d,#16a34a)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"12px", flexShrink:0, boxShadow:"0 3px 8px rgba(22,163,74,.28)" }}>🩺</div>
                <div className="cw-ai-bubble" style={{ padding:"13px 15px", borderRadius:"17px 17px 17px 4px", display:"flex", gap:"5px", alignItems:"center" }}>
                  {[0,160,320].map((d,i) => (
                    <span key={i} className="cw-dot" style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#16a34a", display:"inline-block", animationDelay:`${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* INPUT */}
          <div className="cw-input-wrap" style={{ padding:"10px 12px 12px", display:"flex", gap:"9px", alignItems:"center", flexShrink:0 }}>
            <div style={{
              flex:1, display:"flex", alignItems:"center",
              background: focused ? "#fff" : "#f8fffe",
              border:`1.5px solid ${focused?"#86efac":"#d1fae5"}`,
              borderRadius:"13px", padding:"9px 13px",
              transition:"all 0.2s",
              boxShadow: focused ? "0 0 0 3px rgba(134,239,172,0.2)" : "none",
            }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key==="Enter" && !e.shiftKey && send()}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Describe your symptoms…"
                disabled={loading}
                className="cw-input"
                style={{ flex:1, background:"transparent", border:"none", fontSize:"13px", fontWeight:500, color:"#1a2e1a", opacity:loading?0.5:1 }}
              />
            </div>
            <button onClick={send} disabled={loading || !input.trim()} className="cw-send"
              style={{ width:"42px", height:"42px", borderRadius:"13px", border:"none", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#fff", fontSize:"16px", flexShrink:0 }}>
              ➤
            </button>
          </div>

          <div style={{ padding:"0 12px 10px", background:"rgba(255,255,255,0.92)", backdropFilter:"blur(16px)", textAlign:"center" }}>
            <p style={{ margin:0, fontSize:"9px", color:"#94a3b8", fontWeight:500, letterSpacing:"0.03em" }}>
              Not a substitute for medical advice · Call <strong style={{ color:"#ef4444" }}>112</strong> in emergencies
            </p>
          </div>
        </div>
      )}
    </>
  );
}

/* ─────────────────────── UserMenu ──────────────────────────── */
function UserMenu({ session }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  if (!session?.user) return null;
  const user = session.user;
  const initials = user.name ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "U";
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-slate-50 transition-all border border-slate-200">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[12px] font-bold" style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>
          {user.image ? <img src={user.image} alt={user.name} className="w-full h-full object-cover rounded-lg" /> : initials}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-[12px] font-semibold text-slate-800 leading-tight">{user.name?.split(" ")[0]}</p>
          <p className="text-[10px] text-slate-400">My Account</p>
        </div>
        <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50" style={{ animation: "fadeUp 0.15s ease both" }}>
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="font-semibold text-slate-800 text-[13px]">{user.name}</p>
            <p className="text-slate-400 text-[11px] truncate">{user.email}</p>
          </div>
          <div className="p-1.5">
            {[{ href: "/profile", label: "My Profile" }, { href: "/dashboard", label: "Dashboard" }, { href: "/health-profile", label: "Health Profile" }].map(item => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all">{item.label}</Link>
            ))}
            <div className="h-px bg-slate-100 my-1" />
            <button onClick={async () => { setOpen(false); await signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/"; } } }); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] text-rose-500 hover:bg-rose-50 transition-all">Sign out</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── Page ───────────────────────────────── */
export default function LandingPage() {
  const { data: session, isPending: sessionLoading } = useSession();
  const isLoggedIn = !!session?.user;

  const [userLocation, setUserLocation]   = useState(null);
  const [userAddress, setUserAddress]     = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle");
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [mapOpen, setMapOpen]             = useState(false);
  const [filter, setFilter]               = useState("All");
  const [radiusKm, setRadiusKm]           = useState(10);
  const [highlightedIds, setHighlightedIds] = useState([]);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const { hospitals, loading: hospitalsLoading, error: hospitalsError } = useHospitals(
    userLocation?.lat, userLocation?.lng, radiusKm
  );

  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const data = await res.json();
      if (data?.display_name) setUserAddress(data.display_name.split(",").slice(0, 3).join(",").trim());
    } catch {}
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) { setLocationStatus("denied"); return; }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLocation({ lat, lng });
        setLocationStatus("granted");
        reverseGeocode(lat, lng);
      },
      () => setLocationStatus("denied"),
      { timeout: 10000 }
    );
  }, [reverseGeocode]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.permissions.query({ name: "geolocation" }).then((result) => {
      if (result.state !== "denied") requestLocation();
    });
  }, [requestLocation]);

  const handleManualLocation = useCallback(({ lat, lng, address }) => {
    setUserLocation({ lat, lng });
    setUserAddress(address);
    setLocationStatus("granted");
  }, []);

  const handleMapClick = useCallback((hospital) => {
    if (selectedHospital?.id === hospital.id && mapOpen) { setMapOpen(false); setSelectedHospital(null); }
    else { setSelectedHospital(hospital); setMapOpen(true); }
  }, [selectedHospital, mapOpen]);

  const handleHospitalSelectFromChat = useCallback((hospId) => {
    const hosp = hospitals.find(h => h.id === hospId);
    if (hosp) { setSelectedHospital(hosp); setMapOpen(true); setHighlightedIds([hospId]); setTimeout(() => setHighlightedIds([]), 5000); }
  }, [hospitals]);

  // Fixed filter logic — maps label to keyword array
const validHospitals = hospitals.filter(h =>
  h.name &&
  h.name.toLowerCase() !== "hospital" &&
  h.name.trim() !== "" &&
  h.address &&
  h.address.toLowerCase() !== "address unavailable" &&
  h.address.trim() !== ""
);

const filtered = filter === "All"
  ? validHospitals
  : validHospitals.filter(h => {
      const keywords = FILTER_MAP[filter] || [filter.toLowerCase()];
      return h.specialties.some(s =>
        keywords.some(kw => s.toLowerCase().includes(kw))
      );
    });

  return (
    <div className="min-h-screen" style={{ background: "#f8faf9", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');
        .display{font-family:'Sora',sans-serif}
        @keyframes pulseRing{0%{box-shadow:0 0 0 0 rgba(239,68,68,.5)}70%{box-shadow:0 0 0 14px rgba(239,68,68,0)}100%{box-shadow:0 0 0 0 rgba(239,68,68,0)}}
        .pulse-ring{animation:pulseRing 2s ease-in-out infinite}
        @keyframes slideRight{from{transform:translateX(50px);opacity:0}to{transform:translateX(0);opacity:1}}
        .slide-right{animation:slideRight 0.3s cubic-bezier(0.16,1,0.3,1) both}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .fade-up{animation:fadeUp 0.55s ease both}
        .fade-up-1{animation-delay:0.1s}.fade-up-2{animation-delay:0.22s}.fade-up-3{animation-delay:0.34s}
        @keyframes highlightPulse{0%,100%{box-shadow:0 0 0 0 rgba(22,163,74,.4)}50%{box-shadow:0 0 0 10px rgba(22,163,74,.1)}}
        .highlighted{animation:highlightPulse 1.5s ease-in-out 3}
        @keyframes spin{to{transform:rotate(360deg)}}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:99px}
      `}</style>

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md" style={{ borderBottom: "1px solid #edf0f2" }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm" style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>+</div>
            <span className="display text-[17px] font-extrabold text-slate-900">Medi<span style={{ color: "#16a34a" }}>Life</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-[13px] font-medium text-slate-400">
            {[["#hospitals", "Hospitals"], ["#emergency", "Emergency"]].map(([href, label]) => (
              <a key={href} href={href} className="hover:text-slate-800 transition-colors">{label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={() => setEmergencyOpen(true)}
              className="pulse-ring flex items-center gap-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-bold rounded-xl transition-all">
              <span className="w-1.5 h-1.5 rounded-full bg-white/80" />🚨 Emergency
            </button>
            {!sessionLoading && (
              isLoggedIn ? <UserMenu session={session} /> :
              <>
                <Link href="/sign-in" className="hidden sm:flex px-3.5 py-2 text-[12.5px] font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Sign in</Link>
                <Link href="/sign-up" className="px-3.5 py-2 text-[12.5px] font-semibold text-white rounded-xl transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>Sign up</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative bg-white overflow-hidden pt-16 pb-20">
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(#e8f5e9 1px,transparent 1px),linear-gradient(90deg,#e8f5e9 1px,transparent 1px)", backgroundSize: "40px 40px", opacity: 0.35 }} />
        <div className="absolute -right-40 -top-32 w-[700px] h-[600px] rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse at center,#dcfce7 0%,transparent 65%)", opacity: 0.7 }} />
        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 text-center">
          <div className="fade-up inline-flex items-center gap-2 border text-[10px] font-black px-4 py-1.5 rounded-full mb-7 uppercase tracking-[0.18em]"
            style={{ borderColor: "#bbf7d0", background: "#f0fdf4", color: "#16a34a" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#16a34a" }} />
            Real-time hospital intelligence
          </div>
          <h1 className="fade-up fade-up-1 display text-4xl sm:text-5xl lg:text-[62px] font-extrabold text-slate-900 leading-[1.06] tracking-tight mb-5">
            The right hospital,<br />
            <span style={{ background: "linear-gradient(135deg,#16a34a,#059669)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>right now.</span>
          </h1>
          <p className="fade-up fade-up-2 text-slate-500 text-[16px] max-w-lg mx-auto mb-9 leading-relaxed">
            Tell Medi your symptoms — it matches you with the best hospital by severity, distance, and live bed availability.
          </p>
          <div className="fade-up fade-up-3 flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
            <button className="w-full sm:w-auto px-8 py-3.5 text-white text-[14px] font-bold rounded-xl hover:opacity-90 hover:-translate-y-px hover:shadow-xl transition-all"
              style={{ background: "linear-gradient(135deg,#16a34a,#059669)", boxShadow: "0 6px 20px rgba(22,163,74,0.3)" }}>
              Chat with Medi AI →
            </button>
            <div className="flex items-center gap-2">
              <button onClick={requestLocation} disabled={locationStatus === "loading"}
                className="w-full sm:w-auto px-6 py-3.5 border-[1.5px] border-slate-200 text-slate-700 text-[14px] font-bold rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 disabled:opacity-60 bg-white">
                {locationStatus === "loading"
                  ? <><span className="w-4 h-4 rounded-full border-2 border-green-400 border-t-transparent animate-spin" />Locating…</>
                  : locationStatus === "granted"
                  ? <><span className="w-2 h-2 rounded-full bg-emerald-500" />📍 {userAddress ? userAddress.split(",")[0] : "Location active"}</>
                  : <>📍 Use my location</>}
              </button>
              <button onClick={() => setShowMapPicker(true)} title="Pick location on map"
                className="px-3.5 py-3.5 border-[1.5px] border-slate-200 text-slate-600 text-[14px] font-bold rounded-xl hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-all bg-white flex items-center gap-1.5">
                🗺 <span className="hidden sm:inline text-[12px]">Map</span>
              </button>
            </div>
          </div>

          {locationStatus === "denied" && (
            <p className="mb-8 text-[12px] text-rose-500">Location denied — <button onClick={() => setShowMapPicker(true)} className="underline font-semibold">pick manually on map</button> instead.</p>
          )}

          <div className="grid grid-cols-3 gap-6 max-w-xs mx-auto">
            {[{ v: "Live", l: "OSM Hospital Data" }, { v: "<2 min", l: "Average match" }, { v: "98%", l: "Satisfaction" }].map(s => (
              <div key={s.l} className="text-center">
                <p className="display text-2xl font-extrabold text-slate-900">{s.v}</p>
                <p className="text-[10.5px] text-slate-400 mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOSPITALS */}
      <section id="hospitals" className="py-14 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="display text-2xl sm:text-3xl font-extrabold text-slate-900">
                {locationStatus === "granted" ? `Hospitals near ${userAddress?.split(",")[0] || "you"}` : "Set your location to find hospitals"}
              </h2>
              <p className="text-slate-400 text-[12.5px] mt-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {locationStatus === "granted" ? `Live OSM data · ${hospitals.length} hospitals found` : "Use GPS or pick on map →"}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setShowMapPicker(true)}
                className="flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-full transition-all border"
                style={{ background: "#f0fdf4", borderColor: "#bbf7d0", color: "#16a34a" }}>
                🗺 Change area
              </button>
              {locationStatus === "granted" && (
                <select value={radiusKm} onChange={e => setRadiusKm(Number(e.target.value))}
                  className="text-[12px] font-semibold px-3 py-1.5 rounded-full outline-none cursor-pointer"
                  style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", color: "#16a34a" }}>
                  {[5, 10, 15, 25, 50].map(r => <option key={r} value={r}>{r} km radius</option>)}
                </select>
              )}
              {FILTERS.map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className="px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all"
                  style={filter === f
                    ? { background: "linear-gradient(135deg,#16a34a,#059669)", color: "white" }
                    : { background: "#f1f5f9", color: "#64748b" }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-5 items-start">
            <div className={`transition-all duration-300 ${mapOpen ? "w-1/2" : "w-full"}`}>
              {hospitalsLoading && (
                <div className="text-center py-20">
                  <div style={{ width:"40px", height:"40px", borderRadius:"50%", border:"3px solid #bbf7d0", borderTopColor:"#16a34a", margin:"0 auto 12px", animation:"spin 0.9s linear infinite" }} />
                  <p className="text-slate-400 font-semibold text-[13px]">Loading hospitals near you…</p>
                </div>
              )}
              {hospitalsError && !hospitalsLoading && (
                <div className="text-center py-20 text-rose-400">
                  <p className="text-4xl mb-3">⚠️</p>
                  <p className="font-semibold">{hospitalsError}</p>
                </div>
              )}
              {!userLocation && !hospitalsLoading && (
                <div className="text-center py-20">
                  <p className="text-5xl mb-4">📍</p>
                  <p className="font-bold text-slate-700 text-[15px] mb-2">No location set</p>
                  <p className="text-slate-400 text-[13px] mb-6">Share your location or pick an area on the map to see nearby hospitals.</p>
                  <div className="flex items-center justify-center gap-3">
                    <button onClick={requestLocation} className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-white" style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>📍 Use GPS</button>
                    <button onClick={() => setShowMapPicker(true)} className="px-5 py-2.5 rounded-xl text-[13px] font-bold border border-slate-200 text-slate-600 hover:bg-slate-50">🗺 Pick on map</button>
                  </div>
                </div>
              )}
              {!hospitalsLoading && !hospitalsError && userLocation && (
                filtered.length === 0 ? (
                  <div className="text-center py-20 text-slate-300">
                    <p className="text-5xl mb-3">🏥</p>
                    <p className="font-semibold text-slate-400">No hospitals match this filter in this area.</p>
                    <button onClick={() => setShowMapPicker(true)} className="mt-4 px-5 py-2 rounded-xl text-[12px] font-bold border border-slate-200 text-slate-500 hover:bg-slate-50">Try a different area</button>
                  </div>
                ) : (
                  <div className={`grid gap-4 ${mapOpen ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"}`}>
                    {filtered.map(h => (
                      <div key={h.id} className={highlightedIds.includes(h.id) ? "highlighted" : ""}>
                        <HospitalCard h={h} onSelect={handleMapClick} isSelected={mapOpen && selectedHospital?.id === h.id}
                          userLat={userLocation?.lat} userLng={userLocation?.lng} />
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

            {mapOpen && selectedHospital && (
              <div className="w-1/2 sticky top-20 rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.1)] slide-right flex flex-col"
                style={{ height: "calc(100vh - 5.5rem)", border: "1.5px solid #edf0f2" }}>
                <MapPanel hospital={selectedHospital} onClose={() => { setMapOpen(false); setSelectedHospital(null); }}
                  userLat={userLocation?.lat} userLng={userLocation?.lng} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* HEALTH PROFILE PROMO */}
      <section className="py-14" style={{ background: "#f8faf9" }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2" style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "1.5px solid #bbf7d0" }}>
            <div className="p-8 sm:p-10 flex flex-col justify-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-3">New Feature</span>
              <h2 className="display text-2xl sm:text-[30px] font-extrabold text-slate-900 leading-tight mb-3">Your Digital<br />Health Profile</h2>
              <p className="text-slate-500 text-[14px] leading-relaxed mb-6">Store your blood group, allergies, medications, and medical history. Shared instantly with hospitals in emergencies — saving critical minutes.</p>
              <div className="flex flex-wrap gap-2 mb-7">
                {["Blood group","Allergies","Medications","Medical history","Insurance"].map(tag => (
                  <span key={tag} className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-white border border-emerald-200 text-emerald-700">{tag}</span>
                ))}
              </div>
              <Link href={isLoggedIn ? "/health-profile" : "/sign-up"} className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-bold text-white rounded-xl transition-all hover:opacity-90 w-fit" style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>
                {isLoggedIn ? "Update Health Profile →" : "Create Profile →"}
              </Link>
            </div>
            <div className="hidden md:flex items-center justify-center p-10">
              <div className="relative">
                <div className="bg-white rounded-2xl shadow-xl p-5 w-64" style={{ border: "1.5px solid #e2e8f0" }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">A+</div>
                    <div>
                      <p className="font-bold text-slate-800 text-[13px]">Health Profile</p>
                      <p className="text-[11px] text-slate-400">Auto-shared in emergencies</p>
                    </div>
                  </div>
                  {[{ k:"Blood Group", v:"A+", c:"#dc2626" }, { k:"Allergies", v:"Penicillin, Dust", c:"#d97706" }, { k:"Insurance", v:"Star Health", c:"#0369a1" }].map(row => (
                    <div key={row.k} className="flex justify-between items-center py-2" style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <span className="text-[11px] text-slate-400">{row.k}</span>
                      <span className="text-[11px] font-semibold" style={{ color: row.c }}>{row.v}</span>
                    </div>
                  ))}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-emerald-600 font-semibold">Synced with MediLife</span>
                  </div>
                </div>
                <div className="absolute -top-3 -right-4 bg-rose-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg">🔴 Emergency Ready</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EMERGENCY BANNER */}
      <section id="emergency" className="py-16" style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Emergency Mode</p>
          <h2 className="display text-white text-2xl sm:text-[38px] font-extrabold mb-4 leading-tight">Life-threatening situation?</h2>
          <p className="text-red-100 text-[15px] mb-8 max-w-md mx-auto leading-relaxed">One tap finds your nearest equipped hospital and alerts them before you arrive.</p>
          <button onClick={() => setEmergencyOpen(true)}
            className="pulse-ring inline-flex items-center gap-3 px-8 py-4 bg-white text-rose-600 font-extrabold text-[15px] rounded-2xl hover:shadow-2xl transition-all hover:-translate-y-px active:scale-95">
            🚨 Activate Emergency Protocol
          </button>
          <p className="text-white/40 text-[11px] mt-5">Or call 112 immediately for life-threatening emergencies</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#0f172a" }} className="py-10 px-4 sm:px-8">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-black" style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>+</div>
            <span className="display text-white font-extrabold text-[16px]">MediLife</span>
          </div>
          <p className="text-slate-600 text-[11px] text-center">© 2025 MediLife · Not a substitute for professional medical advice · Always call 112 in a real emergency</p>
          <div className="flex gap-4 text-[12px] text-slate-500">
            {["Privacy","Terms","Contact"].map(l => <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>)}
          </div>
        </div>
      </footer>

      <ChatWidget onHospitalSelect={handleHospitalSelectFromChat} userAddress={userAddress}
        userLat={userLocation?.lat} userLng={userLocation?.lng}
        hospitals={hospitals} activeFilter={filter} selectedHospital={selectedHospital} locationStatus={locationStatus} />

      <MapLocationPicker open={showMapPicker} onClose={() => setShowMapPicker(false)}
        onConfirm={handleManualLocation} initialLat={userLocation?.lat} initialLng={userLocation?.lng} />

      <EmergencyModal open={emergencyOpen} onClose={() => setEmergencyOpen(false)} hospitals={hospitals} />
    </div>
  );
}