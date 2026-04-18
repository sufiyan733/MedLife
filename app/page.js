"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession, signOut } from "@/lib/auth-client";
import { useHospitals, haversine } from "./useHospitals";
import { MapLocationPicker } from "./MapLocationPicker";
import { EmergencyModal } from "./EmergencyModal";
import { ChatWidget } from "@/components/Chatwidget";

const FILTERS = ["All", "Saved", "Cardiac", "Neuro", "Ortho", "Oncology", "Pediatrics"];

const FILTER_MAP = {
  Cardiac: ["cardio"],
  Neuro: ["neuro"],
  Ortho: ["ortho", "spine"],
  Oncology: ["onco"],
  Pediatrics: ["pediatr", "paediatr"],
};

/* ═══════════════════════════════════════════════
   CONFIRM BED MODAL
═══════════════════════════════════════════════ */
function ConfirmBedModal({ hospital, onClose }) {
  const [eta, setEta] = useState("");
  const [etaUnit, setEtaUnit] = useState("min");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 120);
  }, []);

  const handleConfirm = () => {
    if (!eta || isNaN(Number(eta)) || Number(eta) <= 0) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setConfirmed(true);
    }, 1400);
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-6"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full sm:max-w-md sm:rounded-[20px] bg-white overflow-hidden flex flex-col"
        style={{
          borderRadius: "24px 24px 0 0",
          maxHeight: "95vh",
          boxShadow: "0 -12px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.04)",
          animation: "bedModalIn 0.38s cubic-bezier(.16,1,.3,1) both",
        }}
      >
        <style>{`
          @keyframes bedModalIn {
            from { opacity:0; transform:translateY(40px) scale(0.97); }
            to   { opacity:1; transform:translateY(0)   scale(1); }
          }
          @keyframes checkPop {
            0%   { transform:scale(0) rotate(-20deg); opacity:0; }
            60%  { transform:scale(1.18) rotate(4deg); opacity:1; }
            100% { transform:scale(1) rotate(0); opacity:1; }
          }
          @keyframes confirmPulse {
            0%,100% { box-shadow: 0 0 0 0 rgba(22,163,74,.5); }
            50%      { box-shadow: 0 0 0 10px rgba(22,163,74,0); }
          }
          .bed-confirm-btn { animation: confirmPulse 2s ease-in-out infinite; }
          .check-icon { animation: checkPop 0.5s cubic-bezier(.16,1,.3,1) both; }
        `}</style>

        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden bg-white flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {confirmed ? (
          /* ── Success State ── */
          <div className="flex flex-col items-center justify-center p-8 text-center gap-4">
            <div
              className="check-icon w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}
            >
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-1" style={{ fontFamily: "'Sora',sans-serif" }}>
                Bed Reserved! 🎉
              </h3>
              <p className="text-slate-500 text-[13px] leading-relaxed">
                <strong className="text-slate-700">{hospital.name}</strong> has been notified.<br />
                They're expecting you in <strong className="text-emerald-600">{eta} {etaUnit}</strong>.
              </p>
            </div>
            <div
              className="w-full rounded-2xl p-4 flex flex-col gap-2"
              style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0" }}
            >
              {[
                { label: "Hospital", value: hospital.name },
                { label: "ETA", value: `${eta} ${etaUnit}` },
                { label: "Bed Type", value: "General Bed" },
                { label: "Status", value: "✅ Confirmed" },
              ].map((r) => (
                <div key={r.label} className="flex justify-between text-[12px]">
                  <span className="text-slate-400 font-medium">{r.label}</span>
                  <span className="text-slate-800 font-bold">{r.value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 w-full">
              <a
                href={`tel:${hospital.phone}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold border-2 border-slate-200 text-slate-700 hover:bg-slate-50 transition-all"
              >
                📞 Call Hospital
              </a>
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* ── Form State ── */
          <>
            {/* Header */}
            <div className="px-5 pt-5 pb-4 flex-shrink-0">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-[13px] flex-shrink-0 shadow-md"
                    style={{ background: hospital.accentHex }}
                  >
                    {hospital.shortName}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Confirm Bed At</p>
                    <h3 className="font-extrabold text-slate-900 text-[15px] leading-tight truncate" style={{ fontFamily: "'Sora',sans-serif" }}>
                      {hospital.name}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-all flex-shrink-0 text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Availability strip */}
              <div
                className="grid grid-cols-2 gap-3 p-3 rounded-2xl mb-1"
                style={{ background: `${hospital.accentHex}0d`, border: `1.5px solid ${hospital.accentHex}25` }}
              >
                {[
                  { label: "General Beds", avail: hospital.beds.available, total: hospital.beds.total },
                  { label: "ICU Beds", avail: hospital.icu.available, total: hospital.icu.total },
                ].map((b) => {
                  const pct = (b.avail / b.total) * 100;
                  const color = pct > 25 ? "#16a34a" : pct > 8 ? "#d97706" : "#ef4444";
                  return (
                    <div key={b.label} className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{b.label}</span>
                        <span className="text-[11px] font-extrabold" style={{ color }}>{b.avail} free</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.08)" }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(pct, 4)}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-100 mx-5 flex-shrink-0" />

            {/* Body */}
            <div className="px-5 py-4 flex flex-col gap-4 overflow-y-auto">
              <div>
                <p className="text-[13px] font-bold text-slate-700 mb-1">
                  When will you arrive? <span className="text-rose-500">*</span>
                </p>
                <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                  The hospital will prepare your bed and notify staff. Please be as accurate as possible.
                </p>

                <div className="flex gap-2">
                  <div
                    className="flex-1 flex items-center gap-2 rounded-2xl px-4 py-3 transition-all"
                    style={{
                      background: "#f8fafc",
                      border: `2px solid ${eta && !isNaN(Number(eta)) && Number(eta) > 0 ? hospital.accentHex : "#e2e8f0"}`,
                      boxShadow: eta ? `0 0 0 4px ${hospital.accentHex}14` : "none",
                    }}
                  >
                    <span className="text-lg">⏱</span>
                    <input
                      ref={inputRef}
                      type="number"
                      min="1"
                      max="999"
                      value={eta}
                      onChange={(e) => setEta(e.target.value)}
                      placeholder="e.g. 15"
                      onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                      className="flex-1 bg-transparent border-none outline-none text-[15px] font-bold text-slate-800 placeholder:text-slate-300"
                      style={{ fontFamily: "'Sora',sans-serif" }}
                    />
                  </div>
                  <div className="flex gap-1.5">
                    {["min", "hr"].map((u) => (
                      <button
                        key={u}
                        onClick={() => setEtaUnit(u)}
                        className="px-4 py-3 rounded-2xl text-[12px] font-bold transition-all"
                        style={
                          etaUnit === u
                            ? { background: hospital.accentHex, color: "#fff", boxShadow: `0 4px 14px ${hospital.accentHex}50` }
                            : { background: "#f1f5f9", color: "#64748b" }
                        }
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick picks */}
                <div className="flex gap-2 mt-2.5 flex-wrap">
                  {["5", "10", "15", "20", "30", "45"].map((v) => (
                    <button
                      key={v}
                      onClick={() => { setEta(v); setEtaUnit("min"); }}
                      className="text-[11px] font-bold px-3 py-1.5 rounded-full transition-all"
                      style={
                        eta === v && etaUnit === "min"
                          ? { background: `${hospital.accentHex}18`, color: hospital.accentHex, border: `1.5px solid ${hospital.accentHex}40` }
                          : { background: "#f8fafc", color: "#64748b", border: "1.5px solid #e2e8f0" }
                      }
                    >
                      {v} min
                    </button>
                  ))}
                </div>
              </div>

              {/* Info note */}
              <div className="flex gap-2.5 p-3 rounded-2xl" style={{ background: "#fefce8", border: "1.5px solid #fef08a" }}>
                <span className="text-base flex-shrink-0">💡</span>
                <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                  Confirming a bed notifies the hospital to prepare. Please call them if your plans change.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 pb-6 pt-3 flex gap-3 flex-shrink-0 border-t border-slate-100">
              <a
                href={`tel:${hospital.phone}`}
                className="flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-2xl text-[12px] font-bold border-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
              >
                📞 Call
              </a>
              <button
                onClick={handleConfirm}
                disabled={!eta || isNaN(Number(eta)) || Number(eta) <= 0 || loading}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[14px] font-extrabold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(135deg, ${hospital.accentHex}, ${hospital.accentHex}cc)`,
                  boxShadow: eta ? `0 6px 24px ${hospital.accentHex}45` : "none",
                }}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Reserving…
                  </>
                ) : (
                  <>🛏 Confirm Bed</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   AvailRing — Circular SVG progress ring
═══════════════════════════════════════════════ */
function AvailRing({ available, total, label, accent }) {
  const pct = (available / total) * 100;
  const s = pct > 25 ? "good" : pct > 8 ? "warn" : "crit";
  const c = {
    good: { stroke: "#14b8a6", text: "#0d9488", glow: "rgba(20,184,166,0.25)" },
    warn: { stroke: "#eab308", text: "#a16207", glow: "rgba(234,179,8,0.25)" },
    crit: { stroke: "#ef4444", text: "#dc2626", glow: "rgba(239,68,68,0.25)" },
  }[s];
  const r = 22, circ = 2 * Math.PI * r, dashOff = circ - (circ * Math.min(pct, 100)) / 100;
  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-xl" style={{ background: `${c.stroke}08`, border: `1px solid ${c.stroke}18` }}>
      <div className="relative flex-shrink-0" style={{ width: "50px", height: "50px" }}>
        <svg width="50" height="50" viewBox="0 0 50 50" className="transform -rotate-90">
          <circle cx="25" cy="25" r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="4.5" />
          <circle
            cx="25" cy="25" r={r} fill="none" stroke={c.stroke} strokeWidth="4.5"
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={dashOff}
            style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)", filter: `drop-shadow(0 0 4px ${c.glow})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] font-black" style={{ color: c.text }}>{available}</span>
        </div>
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</span>
        <span className="text-[11px] font-bold" style={{ color: c.text }}>{available}/{total} free</span>
        <span className={`text-[9px] font-semibold ${s === "crit" ? "text-rose-500" : s === "warn" ? "text-amber-600" : "text-emerald-600"}`}>
          {s === "crit" ? "⚠ Critical" : s === "warn" ? "⏳ Limited" : "✓ Available"}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   DirectionModal
═══════════════════════════════════════════════ */
function DirectionModal({ hospital, userLat, userLng, onClose }) {
  const googleUrl =
    userLat && userLng
      ? `https://www.google.com/maps/dir/${userLat},${userLng}/${hospital.lat},${hospital.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospital.name + " " + hospital.address)}`;
  const osmEmbedUrl =
    userLat && userLng
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${Math.min(hospital.lng, userLng) - 0.03},${Math.min(hospital.lat, userLat) - 0.02},${Math.max(hospital.lng, userLng) + 0.03},${Math.max(hospital.lat, userLat) + 0.02}&layer=mapnik&marker=${hospital.lat},${hospital.lng}`
      : `https://www.openstreetmap.org/export/embed.html?bbox=${hospital.lng - 0.025},${hospital.lat - 0.018},${hospital.lng + 0.025},${hospital.lat + 0.018}&layer=mapnik&marker=${hospital.lat},${hospital.lng}`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="bg-white w-full sm:max-w-xl overflow-hidden shadow-2xl flex flex-col"
        style={{ borderRadius: "20px 20px 0 0", maxHeight: "92vh" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="min-w-0 flex-1 mr-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Directions to</p>
            <h3 className="font-bold text-slate-900 text-[15px] leading-tight truncate" style={{ fontFamily: "'Sora',sans-serif" }}>
              {hospital.name}
            </h3>
            <p className="text-[12px] text-slate-400 mt-0.5 truncate">{hospital.address}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex-shrink-0 flex items-center justify-center text-slate-500 transition-all text-sm">✕</button>
        </div>
        <div className="relative flex-1 min-h-[280px]">
          <iframe src={osmEmbedUrl} className="w-full h-full border-0" title="Route map" loading="lazy" />
        </div>
        {hospital.distanceKm && (
          <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 flex-shrink-0">
            {[
              { label: "Distance", value: `${hospital.distanceKm.toFixed(1)} km` },
              { label: "Est. Wait", value: `~${hospital.waitTime} min` },
              { label: "Emergency", value: hospital.emergency ? "Available" : "No" },
            ].map((s) => (
              <div key={s.label} className="text-center py-3">
                <p className="font-bold text-slate-800 text-[13px]">{s.value}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}
        <div className="p-4 grid grid-cols-2 gap-3 border-t border-slate-100 flex-shrink-0">
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-3 rounded-xl text-[12px] font-bold text-white transition-all hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${hospital.accentHex}, ${hospital.accentHex}cc)` }}
          >
            🗺 Google Maps
          </a>
          <a
            href={`tel:${hospital.phone}`}
            className="flex items-center justify-center gap-1.5 py-3 rounded-xl text-[12px] font-bold bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-all"
          >
            📞 Call
          </a>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   HospitalCard — Premium Redesign
═══════════════════════════════════════════════ */
function HospitalCard({ h, onSelect, isSelected, userLat, userLng, isFav, onToggleFav, onBookAppointment, onGetDirections, onBookDirect }) {
  const waitColor =
    h.waitTime <= 15
      ? { bg: "rgba(20,184,166,0.08)", text: "#0d9488", label: "Short" }
      : h.waitTime <= 30
        ? { bg: "rgba(234,179,8,0.08)", text: "#a16207", label: "Moderate" }
        : { bg: "rgba(239,68,68,0.08)", text: "#dc2626", label: "Long" };

  const statusColor = h.beds.available > 10 ? "#16a34a" : h.beds.available > 3 ? "#d97706" : "#ef4444";
  const statusLabel = h.beds.available > 10 ? "Open" : h.beds.available > 3 ? "Busy" : "Critical";

  return (
    <div
      className="group relative rounded-[20px] overflow-hidden cursor-pointer flex flex-col"
      style={{
        background: "white",
        border: isSelected ? `2px solid ${h.accentHex}` : "1px solid rgba(0,0,0,0.06)",
        boxShadow: isSelected
          ? `0 0 0 4px ${h.accentHex}18, 0 20px 60px ${h.accentHex}18`
          : "0 4px 24px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)",
        transform: isSelected ? "translateY(-4px)" : undefined,
        transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
      }}
      onClick={() => onSelect(h)}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.transform = "translateY(-5px)";
        e.currentTarget.style.boxShadow = `0 24px 64px ${h.accentHex}20, 0 0 0 1px ${h.accentHex}15`;
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = isSelected
          ? `0 0 0 4px ${h.accentHex}18, 0 20px 60px ${h.accentHex}18`
          : "0 4px 24px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)";
      }}
    >
      {/* ── Glassmorphism accent header ── */}
      <div
        className="relative px-4 pt-4 pb-3"
        style={{
          background: `linear-gradient(135deg, ${h.accentHex}12, ${h.accentHex}06)`,
          borderBottom: `1px solid ${h.accentHex}12`,
        }}
      >
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(${h.accentHex} 1px, transparent 1px)`,
          backgroundSize: "16px 16px",
        }} />

        <div className="relative flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className="w-11 h-11 rounded-[14px] flex items-center justify-center text-white font-black text-[12px] flex-shrink-0 relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${h.accentHex}, ${h.accentHex}cc)`,
                boxShadow: `0 4px 14px ${h.accentHex}40`,
              }}
            >
              {h.shortName}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-slate-900 text-[14px] leading-tight truncate" style={{ fontFamily: "'Sora',sans-serif" }}>
                {h.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1">
                  <span className="w-[6px] h-[6px] rounded-full" style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}80` }} />
                  <span className="text-[10px] font-bold" style={{ color: statusColor }}>{statusLabel}</span>
                </span>
                <span className="text-[10px] text-slate-300">·</span>
                <span className="text-[10px] text-slate-400 font-medium">{h.type}</span>
              </div>
            </div>
          </div>

          {/* Favourite + Badge */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFav?.(h.id); }}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-90"
              style={{
                background: isFav ? "#fef2f2" : "rgba(255,255,255,0.7)",
                border: isFav ? "1.5px solid #fca5a5" : "1px solid rgba(0,0,0,0.06)",
                backdropFilter: "blur(8px)",
              }}
              title={isFav ? "Remove from saved" : "Save hospital"}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill={isFav ? "#ef4444" : "none"} stroke={isFav ? "#ef4444" : "#94a3b8"} strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <span
              className="text-[8px] font-black uppercase tracking-[0.08em] px-2 py-1 rounded-lg"
              style={{
                color: h.accentHex,
                background: `${h.accentHex}12`,
                border: `1px solid ${h.accentHex}20`,
                backdropFilter: "blur(8px)",
              }}
            >
              {h.badge}
            </span>
          </div>
        </div>
      </div>

      {/* ── Card body ── */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Stats row */}
        <div className="flex items-center flex-wrap gap-1.5">
          {/* Rating with stars */}
          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 px-2 py-0.5 rounded-lg" style={{ background: "rgba(245,158,11,0.06)" }}>
            <svg className="w-3.5 h-3.5 fill-amber-400" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {h.rating}
            <span className="text-[9px] text-amber-400 font-medium">({h.reviews})</span>
          </span>
          <span className="w-px h-3.5 bg-slate-200" />
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg" style={{ background: waitColor.bg, color: waitColor.text }}>
            ⏱ ~{h.waitTime}m
          </span>
          {h.emergency && (
            <>
              <span className="w-px h-3.5 bg-slate-200" />
              <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 px-1.5 py-0.5 rounded-lg" style={{ background: "rgba(239,68,68,0.06)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                ER
              </span>
            </>
          )}
          {h.distanceKm !== undefined && (
            <>
              <span className="w-px h-3.5 bg-slate-200" />
              <span className="text-[11px] font-semibold text-slate-500 px-2 py-0.5 rounded-lg" style={{ background: "rgba(0,0,0,0.02)" }}>
                📍 {h.distanceKm.toFixed(1)} km
              </span>
            </>
          )}
        </div>

        {/* Bed availability rings */}
        <div className="grid grid-cols-2 gap-2">
          <AvailRing available={h.beds.available} total={h.beds.total} label="Gen Beds" accent={h.accentHex} />
          <AvailRing available={h.icu.available} total={h.icu.total} label="ICU" accent={h.accentHex} />
        </div>

        {/* Specialty tags */}
        <div className="flex flex-wrap gap-1">
          {h.specialties.map((s) => (
            <span key={s} className="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors hover:bg-slate-100"
              style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569" }}>
              {s}
            </span>
          ))}
        </div>

        {/* Address */}
        <p className="text-[10px] text-slate-400 truncate leading-relaxed">{h.address}</p>

        {/* ── Quick action button ── */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={(e) => { e.stopPropagation(); onBookDirect?.(h); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-extrabold text-white transition-all hover:opacity-90 hover:shadow-lg active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${h.accentHex}, ${h.accentHex}cc)`,
              boxShadow: `0 4px 14px ${h.accentHex}30`,
            }}
          >
            🛏 Book
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MapPanel  — KEY CHANGES:
   • Mobile sheet maxHeight → 96vh (was 88vh)
   • Map iframe min-height → 320px mobile / 360px desktop
   • "Call Now" replaced with "Confirm Bed" + "📞 Call" side button
═══════════════════════════════════════════════ */
function MapPanel({ hospital, onClose, userLat, userLng, isMobileSheet, autoOpenBed, onBedModalHandled }) {
  const [bedModalOpen, setBedModalOpen] = useState(false);

  useEffect(() => {
    if (autoOpenBed) {
      setBedModalOpen(true);
      onBedModalHandled?.();
    }
  }, [autoOpenBed, onBedModalHandled]);

  if (!hospital) return null;

  const delta = 0.022;
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${hospital.lng - delta},${hospital.lat - delta * 0.7},${hospital.lng + delta},${hospital.lat + delta * 0.7}&layer=mapnik&marker=${hospital.lat},${hospital.lng}`;
  const pctBeds = Math.round((hospital.beds.available / hospital.beds.total) * 100);
  const pctIcu = Math.round((hospital.icu.available / hospital.icu.total) * 100);

  const inner = (
    <div className="flex flex-col h-full bg-white">
      {/* ── Coloured header ── */}
      <div className="p-4 sm:p-5 flex-shrink-0" style={{ background: hospital.accentHex }}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <p className="text-white/60 text-[9px] font-bold uppercase tracking-widest mb-1">Selected Hospital</p>
            <h3 className="text-white font-extrabold text-[16px] sm:text-[19px] leading-tight truncate" style={{ fontFamily: "'Sora',sans-serif" }}>
              {hospital.name}
            </h3>
            <p className="text-white/70 text-[11px] mt-1 truncate">{hospital.address}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/35 flex items-center justify-center text-white transition-all flex-shrink-0"
          >
            ✕
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Rating", value: `★ ${hospital.rating}` },
            { label: "Wait", value: `~${hospital.waitTime}m` },
            { label: "Distance", value: hospital.distanceKm !== undefined ? `${hospital.distanceKm.toFixed(1)}km` : "—" },
          ].map((s) => (
            <div key={s.label} className="bg-white/15 rounded-xl p-2 text-center">
              <p className="text-white font-extrabold text-[13px]">{s.value}</p>
              <p className="text-white/60 text-[9px] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── MAP — taller on mobile ── */}
      <div
        className="relative flex-1"
        style={{
          minHeight: isMobileSheet ? "320px" : "280px",
        }}
      >
        <iframe
          key={hospital.id}
          src={osmUrl}
          className="absolute inset-0 w-full h-full border-0"
          title={`Map – ${hospital.name}`}
          loading="lazy"
          allowFullScreen
        />
      </div>

      {/* ── Bed bars ── */}
      <div className="px-4 py-3 border-t border-slate-100 grid grid-cols-2 gap-3 bg-slate-50/60 flex-shrink-0">
        {[
          { label: "General Beds", avail: hospital.beds.available, total: hospital.beds.total, pct: pctBeds },
          { label: "ICU Beds", avail: hospital.icu.available, total: hospital.icu.total, pct: pctIcu },
        ].map((b) => (
          <div key={b.label} className="space-y-1.5">
            <div className="flex justify-between text-[10px]">
              <span className="font-semibold text-slate-400 uppercase tracking-wide">{b.label}</span>
              <span className="font-bold" style={{ color: b.pct > 25 ? "#0d9488" : b.pct > 8 ? "#d97706" : "#ef4444" }}>
                {b.avail} free
              </span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${Math.max(b.pct, 4)}%`, background: hospital.accentHex }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Action buttons — Confirm Bed + Call ── */}
      <div className="p-4 flex gap-3 border-t border-slate-100 flex-shrink-0">
        <a
          href={`tel:${hospital.phone}`}
          className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-[12px] font-bold bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-all flex-shrink-0"
        >
          📞 Call
        </a>
        <button
          onClick={() => setBedModalOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-extrabold text-white transition-all hover:opacity-90 active:scale-95"
          style={{
            background: `linear-gradient(135deg, ${hospital.accentHex}, ${hospital.accentHex}cc)`,
            boxShadow: `0 6px 20px ${hospital.accentHex}40`,
          }}
        >
          🛏 Confirm Bed
        </button>
      </div>

      {/* Bed modal rendered inside panel but portals to body via fixed */}
      {bedModalOpen && (
        <ConfirmBedModal hospital={hospital} onClose={() => setBedModalOpen(false)} />
      )}
    </div>
  );

  if (isMobileSheet) {
    return (
      <>
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={onClose}
          style={{ backdropFilter: "blur(2px)" }}
        />
        <div
          className="fixed inset-x-0 bottom-0 z-50 flex flex-col overflow-hidden"
          style={{
            borderRadius: "22px 22px 0 0",
            /* KEY FIX: was 88vh — now 96vh so map gets much more room */
            maxHeight: "96vh",
            boxShadow: "0 -8px 48px rgba(0,0,0,0.22)",
            animation: "sheetUp 0.32s cubic-bezier(.16,1,.3,1) both",
          }}
        >
          {/* Drag handle */}
          <div className="bg-white flex justify-center pt-3 pb-1 flex-shrink-0" style={{ borderRadius: "22px 22px 0 0" }}>
            <div className="w-10 h-1 rounded-full bg-slate-200" />
          </div>
          <div className="flex-1 overflow-y-auto">{inner}</div>
        </div>
      </>
    );
  }

  return <>{inner}</>;
}

/* ═══════════════════════════════════════════════
   ChatWidget is now imported from @/components/Chatwidget
═══════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════
   UserMenu
═══════════════════════════════════════════════ */
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
  const initials = user.name ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "U";
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-50 transition-all border border-slate-200">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white text-[11px] font-bold" style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>
          {user.image ? <img src={user.image} alt={user.name} className="w-full h-full object-cover rounded-lg" /> : initials}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-[12px] font-semibold text-slate-800 leading-tight">{user.name?.split(" ")[0]}</p>
          <p className="text-[10px] text-slate-400">My Account</p>
        </div>
        <svg className={`w-3 h-3 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50" style={{ animation: "fadeUp 0.15s ease both" }}>
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="font-semibold text-slate-800 text-[13px]">{user.name}</p>
            <p className="text-slate-400 text-[11px] truncate">{user.email}</p>
          </div>
          <div className="p-1.5">
            {[{ href: "/profile", label: "👤 My Profile" }, { href: "/appointments", label: "📋 Appointments" }, { href: "/my-bookings", label: "📖 My Bookings" }, { href: "/symptom-checker", label: "🩺 Symptom Checker" }, { href: "/hospital/dashboard", label: "🏥 Hospital Portal" }, { href: "/hospital", label: "➕ Register Hospital" }, { href: "/dashboard", label: "📊 Admin Panel" }].map((item) => (
              <Link key={item.href + item.label} href={item.href} onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all">{item.label}</Link>
            ))}
            <div className="h-px bg-slate-100 my-1" />
            <button onClick={async () => { setOpen(false); await signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/"; } } }); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] text-rose-500 hover:bg-rose-50 transition-all">Sign out</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════ */
export default function LandingPage() {
  const { data: session, isPending: sessionLoading } = useSession();
  const isLoggedIn = !!session?.user;

  const [userLocation, setUserLocation] = useState(null);
  const [userAddress, setUserAddress] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle");
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [autoOpenBed, setAutoOpenBed] = useState(false);
  const [filter, setFilter] = useState("All");
  const [radiusKm, setRadiusKm] = useState(5);
  const [highlightedIds, setHighlightedIds] = useState([]);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [directionModalHospital, setDirectionModalHospital] = useState(null);

  const [isOnline, setIsOnline] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Auto-scroll to hospitals after 1 second
  useEffect(() => {
    const timer = setTimeout(() => {
      document.getElementById("hospitals")?.scrollIntoView({ behavior: "smooth" });
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  /* Favourites — persisted to localStorage */
  const [favIds, setFavIds] = useState([]);
  useEffect(() => {
    try { const saved = localStorage.getItem("medi-favs"); if (saved) setFavIds(JSON.parse(saved)); } catch { }
  }, []);
  const toggleFav = useCallback((id) => {
    setFavIds((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      try { localStorage.setItem("medi-favs", JSON.stringify(next)); } catch { }
      return next;
    });
  }, []);

  const [viewportWidth, setViewportWidth] = useState(1024);
  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    onResize(); // set correct value immediately after hydration
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const isMobile = viewportWidth < 640;
  const isTablet = viewportWidth < 1024;

  /* Offline detection */
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    setIsOnline(navigator.onLine);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => { window.removeEventListener("online", goOnline); window.removeEventListener("offline", goOffline); };
  }, []);

  /* Back to top visibility */
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { hospitals, loading: hospitalsLoading, error: hospitalsError } = useHospitals(userLocation?.lat, userLocation?.lng, radiusKm);

  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const data = await res.json();
      if (data?.display_name) setUserAddress(data.display_name.split(",").slice(0, 3).join(",").trim());
    } catch { }
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) { setLocationStatus("denied"); return; }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => { const { latitude: lat, longitude: lng } = pos.coords; setUserLocation({ lat, lng }); setLocationStatus("granted"); reverseGeocode(lat, lng); },
      () => setLocationStatus("denied"),
      { timeout: 10000 },
    );
  }, [reverseGeocode]);

  useEffect(() => { requestLocation(); }, [requestLocation]);

  const handleManualLocation = useCallback(({ lat, lng, address }) => {
    setUserLocation({ lat, lng });
    setUserAddress(address);
    setLocationStatus("granted");
  }, []);

  const handleMapClick = useCallback((hospital) => {
    if (selectedHospital?.id === hospital.id && mapOpen) { setMapOpen(false); setSelectedHospital(null); }
    else { setSelectedHospital(hospital); setMapOpen(true); }
  }, [selectedHospital, mapOpen]);

  const handleBookDirect = useCallback((hospital) => {
    setSelectedHospital(hospital);
    setMapOpen(true);
    setAutoOpenBed(true);
  }, []);

  const handleHospitalSelectFromChat = useCallback((hospId) => {
    // Support both ID-based and index-based lookups
    let hosp = hospitals.find(h => String(h.id) === String(hospId));
    if (!hosp && typeof hospId === 'number') hosp = hospitals[hospId];
    if (hosp) { setSelectedHospital(hosp); setMapOpen(true); setHighlightedIds([hosp.id]); setTimeout(() => setHighlightedIds([]), 5000); setTimeout(() => document.getElementById("hospitals")?.scrollIntoView({ behavior: "smooth" }), 300); }
  }, [hospitals]);

  const validHospitals = hospitals.filter((h) => h.name && h.name.toLowerCase() !== "hospital" && h.name.trim() !== "" && h.address && h.address.toLowerCase() !== "address unavailable" && h.address.trim() !== "");
  const filtered = filter === "All" ? validHospitals : filter === "Saved" ? validHospitals.filter((h) => favIds.includes(h.id)) : validHospitals.filter((h) => { const keywords = FILTER_MAP[filter] || [filter.toLowerCase()]; return h.specialties.some((s) => keywords.some((kw) => s.toLowerCase().includes(kw))); });

  const mapAsSidePanel = mapOpen && !isTablet;
  const mapAsSheet = mapOpen && isTablet;
  const gridCols = mapAsSidePanel ? "grid-cols-1" : isMobile ? "grid-cols-1" : isTablet ? "grid-cols-2" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3";

  return (
    <div className="min-h-screen" style={{ background: "#f8faf9", fontFamily: "var(--f-body, 'DM Sans', sans-serif)" }}>
      <style>{`
        :root { --f-body: var(--font-dm-sans, 'DM Sans', system-ui, sans-serif); --f-display: var(--font-sora, 'Sora', system-ui, sans-serif); }
        .display{font-family:var(--f-display)}
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
        @keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes mobileMenuIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
        .mobile-menu-in{animation:mobileMenuIn 0.2s ease both}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:99px}
        ::-webkit-scrollbar-thumb:hover{background:#94a3b8}
        .filter-scroll{display:flex;overflow-x:auto;gap:8px;padding-bottom:4px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
        .filter-scroll::-webkit-scrollbar{display:none}
        .filter-scroll button,.filter-scroll select,.filter-scroll a{flex-shrink:0}
        html{scroll-behavior:smooth}
        @keyframes skeletonShimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .skeleton{background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 37%,#f1f5f9 63%);background-size:200% 100%;animation:skeletonShimmer 1.5s ease-in-out infinite;border-radius:12px}
        @keyframes offlinePulse{0%,100%{opacity:1}50%{opacity:.6}}
        @keyframes fadeInDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .offline-bar{animation:offlinePulse 2s ease-in-out infinite}
        .back-to-top{animation:fadeUp 0.3s ease both}
        @keyframes float{0%,100%{transform:translateY(0px)}50%{transform:translateY(-6px)}}
        @keyframes gradientShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes glowPulse{0%,100%{opacity:.5}50%{opacity:1}}
        .hero-glow{animation:glowPulse 4s ease-in-out infinite}
        .card-hover{transition:all 0.3s cubic-bezier(.16,1,.3,1)}
        .card-hover:hover{transform:translateY(-4px);box-shadow:0 20px 50px rgba(0,0,0,0.08),0 0 0 1px rgba(22,163,74,0.1)}
      `}</style>

      {/* ── OFFLINE INDICATOR ── */}
      {!isOnline && (
        <div className="offline-bar fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 py-2 px-4 text-white text-[12px] font-bold" style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)" }}>
          <span>⚠️</span> You're offline — some features may not work
        </div>
      )}

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 1px 20px rgba(0,0,0,0.03)" }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white font-black text-sm" style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>+</div>
            <span className="display text-[16px] sm:text-[17px] font-extrabold text-slate-900">Medi<span style={{ color: "#16a34a" }}>Life</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-[13px] font-medium text-slate-400">
            {[["#hospitals", "Hospitals"], ["#emergency", "Emergency"], ["/symptom-checker", "Symptom Checker"]].map(([href, label]) => (
              <a key={href} href={href} className="hover:text-slate-800 transition-colors">{label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={() => setEmergencyOpen(true)} className="pulse-ring flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[11px] sm:text-[12px] font-bold rounded-xl transition-all">
              <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
              <span className="hidden xs:inline">🚨</span>
              <span className="hidden sm:inline"> Emergency</span>
              <span className="sm:hidden">SOS</span>
            </button>
            {!sessionLoading && (isLoggedIn ? <UserMenu session={session} /> : (
              <>
                <Link href="/sign-in" className="hidden sm:flex px-3 py-1.5 text-[12px] font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Sign in</Link>
                <Link href="/sign-up" className="px-3 py-1.5 text-[12px] font-semibold text-white rounded-xl transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>Sign up</Link>
              </>
            ))}
            <button className="md:hidden w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 bg-white" onClick={() => setMobileMenuOpen((o) => !o)}>
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden mobile-menu-in bg-white border-t border-slate-100 px-4 py-3 flex flex-col gap-2">
            {[["#hospitals", "🏥 Hospitals"], ["#emergency", "🚨 Emergency"], ["/symptom-checker", "🩺 Symptom Checker"], ["/my-bookings", "📖 My Bookings"]].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMobileMenuOpen(false)} className="py-2.5 px-3 rounded-xl text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-all">{label}</a>
            ))}
            {!sessionLoading && !isLoggedIn && <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)} className="py-2.5 px-3 rounded-xl text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-all">Sign in</Link>}
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="relative bg-white overflow-hidden pt-14 sm:pt-20 pb-16 sm:pb-24">
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(22,163,74,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(22,163,74,0.03) 1px,transparent 1px)", backgroundSize: "36px 36px" }} />
        <div className="absolute -right-40 -top-32 w-[500px] sm:w-[700px] h-[500px] sm:h-[600px] rounded-full pointer-events-none hero-glow" style={{ background: "radial-gradient(ellipse at center,rgba(22,163,74,0.08) 0%,transparent 65%)" }} />
        <div className="absolute -left-24 top-1/2 w-[300px] sm:w-[400px] h-[400px] sm:h-[500px] rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse at center,rgba(5,150,105,0.05) 0%,transparent 70%)", animation: "float 8s ease-in-out infinite" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%,rgba(240,253,244,0.6) 0%,transparent 50%)" }} />
        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 text-center">
          <div className="fade-up inline-flex items-center gap-2 border text-[9px] sm:text-[10px] font-black px-3.5 py-1.5 rounded-full mb-6 uppercase tracking-[0.18em]" style={{ borderColor: "#bbf7d0", background: "#f0fdf4", color: "#16a34a" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#16a34a" }} />
            Real-time hospital intelligence
          </div>
          <h1 className="fade-up fade-up-1 display text-[32px] sm:text-5xl lg:text-[62px] font-extrabold text-slate-900 leading-[1.06] tracking-tight mb-4 sm:mb-5">
            The right hospital,<br />
            <span style={{ background: "linear-gradient(135deg,#16a34a,#059669)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>right now.</span>
          </h1>
          <p className="fade-up fade-up-2 text-slate-500 text-[14px] sm:text-[16px] max-w-lg mx-auto mb-7 sm:mb-9 leading-relaxed px-2">
            Tell Medi your symptoms — it matches you with the best hospital by severity, distance, and live bed availability.
          </p>
          <div className="fade-up fade-up-3 flex flex-col items-center gap-3 mb-10 sm:mb-14 px-4 sm:px-0">
            <button
              onClick={() => { document.getElementById("medi-chat-fab")?.click(); setTimeout(() => document.getElementById("hospitals")?.scrollIntoView({ behavior: "smooth" }), 300); }}
              className="w-full sm:w-auto px-7 py-3.5 text-white text-[14px] font-bold rounded-xl hover:opacity-90 transition-all"
              style={{ background: "linear-gradient(135deg,#16a34a,#059669)", boxShadow: "0 6px 20px rgba(22,163,74,0.3)" }}
            >
              Chat with Medi AI →
            </button>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={requestLocation}
                disabled={locationStatus === "loading"}
                className="flex-1 sm:flex-none sm:w-auto px-5 py-3 border-[1.5px] border-slate-200 text-slate-700 text-[13px] font-bold rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 disabled:opacity-60 bg-white"
              >
                {locationStatus === "loading" ? (<><span className="w-4 h-4 rounded-full border-2 border-green-400 border-t-transparent animate-spin" />Locating…</>) : locationStatus === "granted" ? (<><span className="w-2 h-2 rounded-full bg-emerald-500" />📍 {userAddress ? userAddress.split(",")[0] : "Active"}</>) : (<>📍 Use my location</>)}
              </button>
              <button onClick={() => setShowMapPicker(true)} title="Pick location on map" className="flex-shrink-0 px-3.5 py-3 border-[1.5px] border-slate-200 text-slate-600 text-[13px] font-bold rounded-xl hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-all bg-white flex items-center gap-1.5">
                🗺 <span className="hidden sm:inline text-[12px]">Map</span>
              </button>
            </div>
          </div>
          {locationStatus === "denied" && (
            <p className="mb-6 text-[12px] text-rose-500">Location denied — <button onClick={() => setShowMapPicker(true)} className="underline font-semibold">pick manually on map</button> instead.</p>
          )}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-sm mx-auto">
            {[{ v: "Live", l: "OSM Hospital Data", icon: "📡" }, { v: "<2 min", l: "Average match", icon: "⚡" }, { v: "98%", l: "Satisfaction", icon: "💚" }].map((s) => (
              <div key={s.l} className="text-center p-3 sm:p-4 rounded-2xl" style={{ background: "rgba(240,253,244,0.6)", border: "1px solid rgba(187,247,208,0.5)", backdropFilter: "blur(8px)" }}>
                <p className="text-lg mb-0.5">{s.icon}</p>
                <p className="display text-lg sm:text-xl font-extrabold text-slate-900">{s.v}</p>
                <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 leading-tight">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-10 sm:py-14 lg:py-16" style={{ background: "#f8faf9" }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-10">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-2 block">How It Works</span>
            <h2 className="display text-xl sm:text-2xl lg:text-[30px] font-extrabold text-slate-900 leading-tight">3 steps to the right care</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {[
              { step: "01", icon: "💬", title: "Tell Medi AI", desc: "Describe your symptoms in any language — Medi understands Hindi, Hinglish, and English.", color: "#16a34a" },
              { step: "02", icon: "🏥", title: "Get matched", desc: "AI finds the best hospital by specialty, distance, bed availability, and wait time.", color: "#0369a1" },
              { step: "03", icon: "🛏️", title: "Book & go", desc: "Reserve your bed in-chat, get directions, and arrive prepared — no calls needed.", color: "#7c3aed" },
            ].map((s) => (
              <div key={s.step} className="group relative bg-white rounded-2xl p-5 sm:p-6 lg:p-7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${s.color}, ${s.color}88)` }} />
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle, ${s.color}08, transparent 70%)`, transform: "translate(30%, -30%)" }} />
                <div className="flex items-start gap-4 mb-3">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-lg sm:text-xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ background: `${s.color}0c`, border: `1.5px solid ${s.color}18` }}>{s.icon}</div>
                  <div className="text-[11px] font-black text-slate-200 mt-1">{s.step}</div>
                </div>
                <h3 className="font-extrabold text-slate-900 text-[15px] sm:text-[16px] mb-1.5">{s.title}</h3>
                <p className="text-slate-500 text-[12px] sm:text-[13px] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOSPITALS ── */}
      <section id="hospitals" className="py-10 sm:py-14 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col gap-3 mb-5 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <h2 className="display text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900">
                  {locationStatus === "granted" ? `Hospitals near ${userAddress?.split(",")[0] || "you"}` : "Set your location to find hospitals"}
                </h2>
                <p className="text-slate-400 text-[12px] mt-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {locationStatus === "granted" ? `Live OSM data · ${hospitals.length} hospitals found` : "Use GPS or pick on map →"}
                </p>
              </div>
              <div className="filter-scroll">
                <button onClick={() => setShowMapPicker(true)} className="flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-full transition-all border" style={{ background: "#f0fdf4", borderColor: "#bbf7d0", color: "#16a34a" }}>🗺 Change area</button>
                {locationStatus === "granted" && (
                  <select value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} className="text-[12px] font-semibold px-3 py-1.5 rounded-full outline-none cursor-pointer" style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", color: "#16a34a" }}>
                    {[5, 10, 15, 25, 50].map((r) => <option key={r} value={r}>{r} km</option>)}
                  </select>
                )}
                {FILTERS.map((f) => (
                  <button key={f} onClick={() => setFilter(f)} className="px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all" style={filter === f ? { background: "linear-gradient(135deg,#16a34a,#059669)", color: "white" } : { background: "#f1f5f9", color: "#64748b" }}>{f}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4 lg:gap-5 items-start">
            <div className={`transition-all duration-300 ${mapAsSidePanel ? "w-1/2" : "w-full"}`}>
              {hospitalsLoading && (
                <div className={`grid gap-3 sm:gap-4 ${gridCols}`}>
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.05)", background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
                      <div className="h-[3px] skeleton" style={{ borderRadius: 0 }} />
                      <div className="skeleton" style={{ height: "10px", width: "60px", margin: "16px 16px 8px" }} />
                      <div className="skeleton" style={{ height: "18px", width: "70%", margin: "0 16px 6px" }} />
                      <div className="skeleton" style={{ height: "12px", width: "90%", margin: "0 16px 12px" }} />
                      <div style={{ display: "flex", gap: "6px", padding: "0 16px 12px" }}>
                        <div className="skeleton" style={{ height: "24px", width: "60px" }} />
                        <div className="skeleton" style={{ height: "24px", width: "50px" }} />
                        <div className="skeleton" style={{ height: "24px", width: "55px" }} />
                      </div>
                      <div style={{ display: "flex", gap: "6px", padding: "0 16px 16px" }}>
                        <div className="skeleton" style={{ height: "32px", flex: 1 }} />
                        <div className="skeleton" style={{ height: "32px", flex: 1 }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {hospitalsError && !hospitalsLoading && (
                <div className="text-center py-16 text-rose-400">
                  <p className="text-4xl mb-3">⚠️</p>
                  <p className="font-semibold">{hospitalsError}</p>
                </div>
              )}
              {!userLocation && !hospitalsLoading && (
                <div className="text-center py-16">
                  <p className="text-5xl mb-4">📍</p>
                  <p className="font-bold text-slate-700 text-[15px] mb-2">No location set</p>
                  <p className="text-slate-400 text-[13px] mb-6 max-w-xs mx-auto">Share your location or pick an area on the map to see nearby hospitals.</p>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <button onClick={requestLocation} className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-white" style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>📍 Use GPS</button>
                    <button onClick={() => setShowMapPicker(true)} className="px-5 py-2.5 rounded-xl text-[13px] font-bold border border-slate-200 text-slate-600 hover:bg-slate-50">🗺 Pick on map</button>
                  </div>
                </div>
              )}
              {!hospitalsLoading && !hospitalsError && userLocation && (
                filtered.length === 0 ? (
                  <div className="text-center py-16 text-slate-300">
                    <p className="text-5xl mb-3">🏥</p>
                    <p className="font-semibold text-slate-400">No hospitals match this filter in this area.</p>
                    <button onClick={() => setShowMapPicker(true)} className="mt-4 px-5 py-2 rounded-xl text-[12px] font-bold border border-slate-200 text-slate-500 hover:bg-slate-50">Try a different area</button>
                  </div>
                ) : (
                  <div className={`grid gap-3 sm:gap-4 ${gridCols}`}>
                    {filtered.map((h) => (
                      <div key={h.id} className={highlightedIds.includes(h.id) ? "highlighted" : ""}>
                        <HospitalCard
                          h={h}
                          onSelect={handleMapClick}
                          isSelected={mapOpen && selectedHospital?.id === h.id}
                          userLat={userLocation?.lat}
                          userLng={userLocation?.lng}
                          isFav={favIds.includes(h.id)}
                          onToggleFav={toggleFav}
                          onGetDirections={(hospital) => setDirectionModalHospital(hospital)}
                          onBookDirect={handleBookDirect}
                        />
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

            {mapAsSidePanel && selectedHospital && (
              <div className="w-1/2 sticky top-20 rounded-2xl overflow-hidden slide-right flex flex-col" style={{ height: "calc(100vh - 5.5rem)", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 16px 60px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.02)" }}>
                <MapPanel
                  hospital={selectedHospital}
                  onClose={() => { setMapOpen(false); setSelectedHospital(null); setAutoOpenBed(false); }}
                  userLat={userLocation?.lat}
                  userLng={userLocation?.lng}
                  isMobileSheet={false}
                  autoOpenBed={autoOpenBed}
                  onBedModalHandled={() => setAutoOpenBed(false)}
                />
              </div>
            )}
          </div>

          {mapAsSheet && selectedHospital && (
            <MapPanel
              hospital={selectedHospital}
              onClose={() => { setMapOpen(false); setSelectedHospital(null); setAutoOpenBed(false); }}
              userLat={userLocation?.lat}
              userLng={userLocation?.lng}
              isMobileSheet={true}
              autoOpenBed={autoOpenBed}
              onBedModalHandled={() => setAutoOpenBed(false)}
            />
          )}
        </div>
      </section>

      {/* ── HEALTH PROFILE PROMO ── */}
      <section className="py-10 sm:py-14" style={{ background: "#f8faf9" }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2" style={{ background: "linear-gradient(135deg,#f0fdf4 0%,#dcfce7 50%,#f0fdf4 100%)", border: "1px solid rgba(187,247,208,0.6)", boxShadow: "0 8px 40px rgba(22,163,74,0.06)" }}>
            <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-3">New Feature</span>
              <h2 className="display text-[22px] sm:text-2xl lg:text-[30px] font-extrabold text-slate-900 leading-tight mb-3">Your Digital<br />Health Profile</h2>
              <p className="text-slate-500 text-[13px] sm:text-[14px] leading-relaxed mb-5">Store your blood group, allergies, medications, and medical history. Shared instantly with hospitals in emergencies — saving critical minutes.</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {["Blood group", "Allergies", "Medications", "Medical history", "Insurance"].map((tag) => (
                  <span key={tag} className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-white border border-emerald-200 text-emerald-700">{tag}</span>
                ))}
              </div>
              <Link href={isLoggedIn ? "/profile" : "/sign-up"} className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-bold text-white rounded-xl transition-all hover:opacity-90 w-fit" style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>
                {isLoggedIn ? "Update Health Profile →" : "Create Profile →"}
              </Link>
            </div>
            <div className="hidden md:flex items-center justify-center p-8 lg:p-10">
              <div className="relative">
                <div className="bg-white rounded-2xl shadow-xl p-5 w-56 lg:w-64" style={{ border: "1.5px solid #e2e8f0" }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">A+</div>
                    <div>
                      <p className="font-bold text-slate-800 text-[12px]">Health Profile</p>
                      <p className="text-[10px] text-slate-400">Auto-shared in emergencies</p>
                    </div>
                  </div>
                  {[{ k: "Blood Group", v: "A+", c: "#dc2626" }, { k: "Allergies", v: "Penicillin, Dust", c: "#d97706" }, { k: "Insurance", v: "Star Health", c: "#0369a1" }].map((row) => (
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

      {/* ── FOR HOSPITALS CTA ── */}
      <section className="py-14 sm:py-20 px-4 sm:px-6" style={{ background: "linear-gradient(180deg, #f8faf9, #f0fdf4)" }}>
        <div className="max-w-[1200px] mx-auto text-center">
          <p className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.25em] mb-3">For Hospital Partners</p>
          <h2 className="display text-[24px] sm:text-3xl lg:text-[38px] font-extrabold text-slate-900 mb-3 leading-tight">Run your hospital on MediLife</h2>
          <p className="text-slate-400 text-[14px] sm:text-[15px] mb-10 max-w-lg mx-auto leading-relaxed">Register your hospital, manage beds in real-time, and let patients find you instantly through our AI-powered network.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-10">
            {[
              { icon: "🏥", title: "Register", desc: "5-min setup wizard with departments, beds, and location mapping", href: "/hospital" },
              { icon: "📊", title: "Dashboard", desc: "Real-time bed management, appointment tracking, and staff overview", href: "/hospital/dashboard" },
              { icon: "🤖", title: "AI Matching", desc: "Our AI auto-routes patients to your hospital based on specialty and availability", href: "/admin" },
            ].map(card => (
              <Link key={card.title} href={card.href}
                className="bg-white rounded-2xl p-6 text-left hover:-translate-y-1 hover:shadow-lg transition-all group"
                style={{ border: "1.5px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
                <span className="text-3xl block mb-3">{card.icon}</span>
                <h3 className="display font-extrabold text-slate-900 text-[15px] mb-1 group-hover:text-emerald-600 transition-colors">{card.title}</h3>
                <p className="text-slate-400 text-[12px] leading-relaxed">{card.desc}</p>
              </Link>
            ))}
          </div>
          <Link href="/hospital" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-[14px] font-bold text-white transition-all hover:-translate-y-1 hover:shadow-xl" style={{ background: "linear-gradient(135deg,#16a34a,#059669)", boxShadow: "0 8px 32px rgba(22,163,74,0.3)" }}>
            🏥 Register Your Hospital — Free
          </Link>
        </div>
      </section>

      {/* ── EMERGENCY BANNER ── */}
      <section id="emergency" className="py-14 sm:py-20 relative overflow-hidden" style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c,#991b1b)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.03) 0%, transparent 50%)" }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.25em] mb-4">Emergency Mode</p>
          <h2 className="display text-white text-[24px] sm:text-3xl lg:text-[42px] font-extrabold mb-5 leading-tight">Life-threatening situation?</h2>
          <p className="text-red-100/80 text-[13px] sm:text-[15px] mb-8 max-w-md mx-auto leading-relaxed">One tap finds your nearest equipped hospital and alerts them before you arrive.</p>
          <button onClick={() => setEmergencyOpen(true)} className="pulse-ring inline-flex items-center gap-2 sm:gap-3 px-8 sm:px-10 py-4 sm:py-5 bg-white text-rose-600 font-extrabold text-[14px] sm:text-[16px] rounded-2xl transition-all hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)] active:scale-95 w-full sm:w-auto justify-center">
            🚨 Activate Emergency Protocol
          </button>
          <p className="text-white/35 text-[11px] mt-6">Or call <strong className="text-white/60">112</strong> immediately for life-threatening emergencies</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#0f172a" }} className="py-10 sm:py-14 px-4 sm:px-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 mb-10">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-black" style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>+</div>
                <span className="display text-white font-extrabold text-[16px]">MediLife</span>
              </div>
              <p className="text-slate-500 text-[12px] leading-relaxed max-w-xs">AI-powered hospital intelligence. Find the right care, right now.</p>
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.15em] mb-3">Quick Links</p>
              <div className="flex flex-col gap-2">
                {[["#hospitals", "Find Hospitals"], ["#emergency", "Emergency SOS"], ["/profile", "Health Profile"], ["/symptom-checker", "Symptom Checker"], ["/appointments", "Appointments"]].map(([h, l]) => (
                  <a key={h} href={h} className="text-slate-500 text-[12px] hover:text-white transition-colors">{l}</a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.15em] mb-3">Features</p>
              <div className="flex flex-col gap-2">
                {["Medi AI Chat", "Voice Input", "Bed Booking", "Live Availability", "Appointments", "Symptom Checker"].map(f => (
                  <span key={f} className="text-slate-500 text-[12px]">{f}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.15em] mb-3">For Hospitals</p>
              <div className="flex flex-col gap-2">
                {[["/hospital", "Register Hospital"], ["/hospital/dashboard", "Hospital Portal"], ["/admin", "Admin Panel"]].map(([h, l]) => (
                  <a key={h} href={h} className="text-slate-500 text-[12px] hover:text-white transition-colors">{l}</a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.15em] mb-3">Emergency</p>
              <a href="tel:112" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold text-white mb-3" style={{ background: "linear-gradient(135deg,#dc2626,#991b1b)" }}>📞 Call 112</a>
              <p className="text-slate-600 text-[11px] leading-relaxed">For life-threatening emergencies, always call 112 first.</p>
            </div>
          </div>
          <div className="border-t border-slate-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <p className="text-slate-600 text-[11px]">© 2026 MediLife · Not a substitute for professional medical advice</p>
            <div className="flex gap-5 text-[12px] text-slate-500">
              {[["/privacy", "Privacy Policy"], ["/terms", "Terms of Service"], ["/about", "About Us"]].map(([href, l]) => <a key={l} href={href} className="hover:text-white transition-colors">{l}</a>)}
            </div>
          </div>
        </div>
      </footer>

      {/* ── FLOATING MOBILE EMERGENCY FAB ── */}
      {isMobile && (
        <button
          onClick={() => setEmergencyOpen(true)}
          style={{
            position: "fixed", bottom: "20px", left: "20px", zIndex: 49,
            width: "54px", height: "54px", borderRadius: "16px",
            background: "linear-gradient(135deg,#dc2626,#b91c1c)",
            boxShadow: "0 8px 32px rgba(220,38,38,0.5), 0 2px 8px rgba(0,0,0,0.2)",
            border: "2px solid rgba(255,255,255,0.15)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "22px", color: "#fff",
            animation: "pulseRing 2s ease-in-out infinite",
            transition: "transform 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.08)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          aria-label="Emergency SOS"
        >
          🚨
        </button>
      )}

      {/* ── WIDGETS ── */}
      <ChatWidget
        onHospitalSelect={handleHospitalSelectFromChat}
        onFilterChange={(f) => setFilter(f)}
        onEmergency={() => setEmergencyOpen(true)}
        userAddress={userAddress}
        userLat={userLocation?.lat}
        userLng={userLocation?.lng}
        hospitals={hospitals}
        activeFilter={filter}
        selectedHospital={selectedHospital}
        locationStatus={locationStatus}
      />
      <MapLocationPicker open={showMapPicker} onClose={() => setShowMapPicker(false)} onConfirm={handleManualLocation} initialLat={userLocation?.lat} initialLng={userLocation?.lng} />
      <EmergencyModal open={emergencyOpen} onClose={() => setEmergencyOpen(false)} hospitals={hospitals} />
      {directionModalHospital && (
        <DirectionModal hospital={directionModalHospital} userLat={userLocation?.lat} userLng={userLocation?.lng} onClose={() => setDirectionModalHospital(null)} />
      )}
      {/* ── BACK TO TOP ── */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="back-to-top group"
          aria-label="Back to top"
          style={{
            position: "fixed", bottom: isMobile ? "80px" : "100px", left: isMobile ? "20px" : "28px", zIndex: 45,
            width: "42px", height: "42px", borderRadius: "14px",
            background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
            border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "16px", color: "#64748b",
            transition: "all 0.25s cubic-bezier(0.16,1,0.3,1)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.12)"; e.currentTarget.style.color = "#16a34a"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)"; e.currentTarget.style.color = "#64748b"; }}
        >
          ↑
        </button>
      )}
    </div>
  );
}