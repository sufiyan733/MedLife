"use client";
import { useState, useRef, useEffect, useCallback } from "react";

/* ─── Symptom → filter + severity mapping (client-side fast path) ─── */
const SYMPTOM_MAP = [
  { keywords: ["chest pain","heart attack","cardiac","palpitation","angina","myocardial","heart"],  filter: "Cardiac",    severity: "critical" },
  { keywords: ["stroke","brain","neuro","seizure","epilepsy","paralysis","unconscious","faint","blackout","migraine","head injury"], filter: "Neuro",     severity: "critical" },
  { keywords: ["fracture","bone","joint","spine","back pain","slip disc","ortho","knee","shoulder dislocation"], filter: "Ortho",     severity: "moderate" },
  { keywords: ["cancer","tumor","chemo","oncology","biopsy","lymphoma","leukemia"],               filter: "Oncology",   severity: "moderate" },
  { keywords: ["child","baby","infant","pediatric","newborn","kid","toddler"],                     filter: "Pediatrics", severity: "moderate" },
];

const CRITICAL_KEYWORDS = ["can't breathe","not breathing","unconscious","stroke","heart attack","chest pain","seizure","unresponsive","bleeding heavily","overdose","poisoning"];

function detectSymptom(text) {
  const lower = text.toLowerCase();
  for (const entry of SYMPTOM_MAP) {
    if (entry.keywords.some(k => lower.includes(k))) return entry;
  }
  return null;
}

function isCritical(text) {
  const lower = text.toLowerCase();
  return CRITICAL_KEYWORDS.some(k => lower.includes(k));
}

/* ─── Typing indicator ─── */
function TypingDots() {
  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center", padding: "12px 14px" }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: "7px", height: "7px", borderRadius: "50%", background: "#16a34a", display: "inline-block",
          animation: "dotDance 1.2s ease-in-out infinite",
          animationDelay: `${i * 160}ms`,
          opacity: 0.7,
        }} />
      ))}
    </div>
  );
}

/* ─── Action Card (appears inline in chat for hospital recommendations) ─── */
function HospitalActionCard({ hospital, accentColor, onOpen, onCall, isBest }) {
  if (!hospital) return null;
  const pct = (hospital.bedsAvailable / hospital.bedsTotal) * 100;
  const bedColor = pct > 25 ? "#10b981" : pct > 8 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{
      background: "#fff",
      borderRadius: "16px",
      border: `1.5px solid ${isBest ? accentColor : "#e2e8f0"}`,
      overflow: "hidden",
      boxShadow: isBest ? `0 4px 20px ${accentColor}22` : "0 2px 8px rgba(0,0,0,0.06)",
      marginTop: "6px",
      fontFamily: "inherit",
    }}>
      {isBest && (
        <div style={{ background: accentColor, padding: "4px 12px", display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "10px", color: "white", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>⚡ Best Match</span>
        </div>
      )}
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: "13px", color: "#0f172a" }}>{hospital.name}</p>
            <p style={{ margin: "2px 0 0", fontSize: "10px", color: "#94a3b8" }}>{hospital.address}</p>
          </div>
          {hospital.distanceKm !== null && (
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", flexShrink: 0 }}>
              📍 {hospital.distanceKm?.toFixed(1)} km
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
          <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "99px", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
            ⏱ ~{hospital.waitTime} min wait
          </span>
          <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "99px", background: `${bedColor}11`, color: bedColor, border: `1px solid ${bedColor}33` }}>
            🛏 {hospital.bedsAvailable} beds free
          </span>
          {hospital.emergency && (
            <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "99px", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca" }}>
              🚨 ER Open
            </span>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
          <button onClick={onOpen} style={{
            padding: "8px", borderRadius: "10px", fontSize: "11px", fontWeight: 800,
            background: accentColor, color: "white", border: "none", cursor: "pointer",
            transition: "opacity 0.15s",
          }}
            onMouseEnter={e => e.target.style.opacity = "0.85"}
            onMouseLeave={e => e.target.style.opacity = "1"}>
            🗺 Open Details
          </button>
          <a href={`tel:${hospital.phone}`} style={{
            padding: "8px", borderRadius: "10px", fontSize: "11px", fontWeight: 800,
            background: "#f8fafc", color: "#334155", border: "1px solid #e2e8f0",
            textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            📞 Call Now
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── Quick action chips ─── */
function QuickChips({ chips, onSelect }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
      {chips.map((chip, i) => (
        <button key={i} onClick={() => onSelect(chip.text)} style={{
          padding: "6px 12px", borderRadius: "99px", fontSize: "11px", fontWeight: 700,
          background: chip.urgent ? "#fef2f2" : "#f0fdf4",
          color: chip.urgent ? "#ef4444" : "#16a34a",
          border: `1.5px solid ${chip.urgent ? "#fecaca" : "#bbf7d0"}`,
          cursor: "pointer", fontFamily: "inherit",
          transition: "all 0.15s",
        }}
          onMouseEnter={e => { e.target.style.transform = "scale(1.04)"; }}
          onMouseLeave={e => { e.target.style.transform = "scale(1)"; }}>
          {chip.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Main ChatWidget ─── */
export function ChatWidget({ onHospitalSelect, onFilterChange, userAddress, userLat, userLng, hospitals, activeFilter, selectedHospital, locationStatus }) {
  const [open, setOpen] = useState(true);
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "Hi, I'm Medi 👋\n\nTell me your symptoms — I'll instantly find the right hospital and set everything up for you. No extra steps.",
    chips: [
      { label: "🫀 Chest pain", text: "I have chest pain", urgent: true },
      { label: "🧠 Headache/stroke", text: "severe headache and dizziness", urgent: true },
      { label: "🦴 Bone injury", text: "I think I have a fracture", urgent: false },
      { label: "👶 Child is sick", text: "my child has high fever", urgent: false },
    ]
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) { setUnread(0); bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }
  }, [messages, open]);

  // Expose filter setter so AI can call it
  useEffect(() => {
    window.mediSetFilter = (filter) => { if (onFilterChange) onFilterChange(filter); };
    return () => { delete window.mediSetFilter; };
  }, [onFilterChange]);

  const selectBestHospital = useCallback((filter, severity, hospitalsData) => {
    const list = hospitalsData || hospitals || [];
    const keywords = {
      Cardiac: ["cardio"], Neuro: ["neuro"], Ortho: ["ortho", "spine"],
      Oncology: ["onco"], Pediatrics: ["pediatr", "paediatr"]
    }[filter] || [];

    let candidates = keywords.length > 0
      ? list.filter(h => h.specialties.some(s => keywords.some(k => s.toLowerCase().includes(k))))
      : list;
    if (!candidates.length) candidates = list;

    // For critical: prefer ER + closest; for moderate: prefer rating + wait
    if (severity === "critical") {
      candidates = candidates.filter(h => h.emergency).length > 0
        ? candidates.filter(h => h.emergency)
        : candidates;
      candidates.sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99) || a.waitTime - b.waitTime);
    } else {
      candidates.sort((a, b) => b.rating - a.rating || a.waitTime - b.waitTime);
    }
    return candidates[0] || null;
  }, [hospitals]);

  const send = useCallback(async (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    if (!open) setUnread(u => u + 1);

    // ── Client-side fast detection ──
    const detected = detectSymptom(text);
    const critical = isCritical(text);

    // Auto-set filter immediately
    if (detected?.filter && onFilterChange) {
      onFilterChange(detected.filter);
    }

    // For critical symptoms, auto-open best hospital immediately
    let autoSelectedHospital = null;
    if (critical || detected?.severity === "critical") {
      autoSelectedHospital = selectBestHospital(detected?.filter || "All", "critical", hospitals);
      if (autoSelectedHospital) {
        setTimeout(() => {
          onHospitalSelect(autoSelectedHospital.id);
          document.getElementById("hospitals")?.scrollIntoView({ behavior: "smooth" });
        }, 600);
      }
    }

    try {
      const systemPrompt = `You are Medi, an emergency-aware hospital assistant embedded in MediLife.

BEHAVIOR RULES:
1. When user describes symptoms, IMMEDIATELY decide the best hospital from the visible list.
2. For CRITICAL symptoms (chest pain, stroke, breathing issues, unconscious, seizures): respond in ≤3 sentences. Be direct. No fluff. Trigger hospital opening.
3. For moderate symptoms: brief triage, then recommend best 1-2 hospitals.
4. ALWAYS end your response with a special command if recommending a hospital:
   - To open a hospital's map panel: [OPEN_MAP:hospitalId]
   - To set the filter: [SET_FILTER:filterName] (valid: All, Cardiac, Neuro, Ortho, Oncology, Pediatrics)
5. After commands are extracted from your reply, they are REMOVED — so write your reply as if the commands aren't there.
6. Rank hospitals by: specialty match → ER availability (if critical) → distance → wait time → rating.
7. Never ask unnecessary questions. Act on available info.
8. If location is not set, tell user to enable location for best results.
9. Keep responses concise and action-oriented.

HOSPITAL DATA (visible to user):
${JSON.stringify((hospitals || []).map(h => ({
  id: h.id, name: h.name, specialties: h.specialties,
  distanceKm: h.distanceKm, waitTime: h.waitTime,
  bedsAvailable: h.bedsAvailable || h.beds?.available,
  bedsTotal: h.bedsTotal || h.beds?.total,
  emergency: h.emergency, rating: h.rating,
  address: h.address, phone: h.phone
})), null, 2)}

User location: ${userLat ? `${userLat}, ${userLng} (${userAddress || "set"})` : "NOT SET"}
Active filter: ${activeFilter}
${autoSelectedHospital ? `\nNOTE: Client already auto-opened hospital #${autoSelectedHospital.id} (${autoSelectedHospital.name}) for this critical symptom.` : ""}`;

      const res = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
    userContext: {
      address: userAddress || null,
      lat: userLat || null,
      lng: userLng || null,
      locationGranted: locationStatus === "granted",
    },
    pageContext: {
      visibleHospitals: (hospitals || []).map(h => ({
        id: h.id, name: h.name, type: h.type,
        distanceKm: h.distanceKm ?? null,
        rating: h.rating, waitTime: h.waitTime,
        bedsAvailable: h.bedsAvailable,
        bedsTotal: h.bedsTotal,
        icuAvailable: h.icuAvailable,
        icuTotal: h.icuTotal,
        emergency: h.emergency,
        specialties: h.specialties,
        address: h.address, phone: h.phone,
        badge: h.badge,
      })),
      activeFilter,
      selectedHospital: selectedHospital
        ? { id: selectedHospital.id, name: selectedHospital.name }
        : null,
      totalHospitalsShown: (hospitals || []).length,
    },
  }),
});

const data = await res.json();
let reply = data.reply || "Sorry, couldn't connect.";
      // Extract commands
      const filterMatch = reply.match(/\[SET_FILTER:([^\]]+)\]/);
      const mapMatches = [...reply.matchAll(/\[OPEN_MAP:(\d+)\]/g)];

      reply = reply.replace(/\[SET_FILTER:[^\]]+\]/g, "").replace(/\[OPEN_MAP:\d+\]/g, "").trim();

      // Execute filter command
      if (filterMatch && onFilterChange) {
        onFilterChange(filterMatch[1].trim());
      }

      // Build inline hospital cards for the message
      const mentionedHospitals = mapMatches.map(m => {
        const id = parseInt(m[1]);
        return (hospitals || []).find(h => h.id === id);
      }).filter(Boolean);

      // Determine suggested chips based on context
      let chips = null;
      if (!detected && !critical) {
        chips = [
          { label: "📍 Show nearest hospital", text: "show me the nearest available hospital", urgent: false },
          { label: "🚨 It's urgent", text: "this is urgent, I need help fast", urgent: true },
          { label: "⏱ Shortest wait", text: "which hospital has the shortest wait time?", urgent: false },
        ];
      }

      const newMsg = {
        role: "assistant",
        content: reply,
        hospitalCards: mentionedHospitals.slice(0, 2),
        chips,
        isCritical: critical || detected?.severity === "critical",
      };

      setMessages(p => [...p, newMsg]);

      // Open first hospital from AI response (if not already opened by client)
      if (mapMatches.length > 0 && !autoSelectedHospital) {
        const firstId = parseInt(mapMatches[0][1]);
        setTimeout(() => {
          onHospitalSelect(firstId);
          document.getElementById("hospitals")?.scrollIntoView({ behavior: "smooth" });
        }, 700);
      }
    } catch (err) {
      setMessages(p => [...p, { role: "assistant", content: "Connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, hospitals, userLat, userLng, userAddress, activeFilter, onHospitalSelect, onFilterChange, selectBestHospital, open]);

  const ACCENT = "#16a34a";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&display=swap');
        @keyframes floatUp { from{opacity:0;transform:translateY(18px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes msgIn   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes dotDance{ 0%,80%,100%{transform:translateY(0);opacity:.35} 40%{transform:translateY(-5px);opacity:1} }
        @keyframes orbPulse{ 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.15);opacity:1} }
        @keyframes ringPop { 0%{transform:scale(0.85);opacity:0} 60%{transform:scale(1.05);opacity:1} 100%{transform:scale(1);opacity:1} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes gradShift{ 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes urgentPulse{ 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)} 50%{box-shadow:0 0 0 8px rgba(239,68,68,0)} }
        @keyframes slideIn  { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }

        .cw-wrap    { animation:floatUp 0.32s cubic-bezier(.16,1,.3,1) both; font-family:'Cabinet Grotesk',sans-serif; }
        .cw-msg     { animation:msgIn 0.24s cubic-bezier(.16,1,.3,1) both; }
        .cw-fab     { animation:ringPop 0.4s cubic-bezier(.16,1,.3,1) both; }
        .cw-card    { animation:slideIn 0.3s cubic-bezier(.16,1,.3,1) both; }
        .cw-urgent  { animation:urgentPulse 1.5s ease-in-out 3; }

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
        .cw-user-bubble  { background:linear-gradient(135deg,#166534,#15803d,#16a34a); box-shadow:0 4px 16px rgba(22,163,74,.3); }
        .cw-ai-bubble    { background:#fff; box-shadow:0 2px 12px rgba(0,0,0,.06),inset 0 0 0 1px rgba(0,0,0,.06); }
        .cw-critical-bubble { background:linear-gradient(135deg,#fef2f2,#fff); box-shadow:0 2px 12px rgba(239,68,68,.1),inset 0 0 0 1.5px rgba(239,68,68,.2); }
        .cw-send {
          background:linear-gradient(135deg,#16a34a,#15803d);
          box-shadow:0 4px 14px rgba(22,163,74,.4);
          transition:all 0.18s cubic-bezier(.16,1,.3,1);
        }
        .cw-send:hover:not(:disabled) { transform:scale(1.08); }
        .cw-send:active:not(:disabled){ transform:scale(0.94); }
        .cw-send:disabled { opacity:0.4; }
        .cw-scroll::-webkit-scrollbar       { width:3px; }
        .cw-scroll::-webkit-scrollbar-thumb { background:#d1fae5; border-radius:99px; }
        .cw-fab-btn {
          font-family:'Cabinet Grotesk',sans-serif;
          background:linear-gradient(135deg,#14532d,#166534,#16a34a);
          box-shadow:0 8px 32px rgba(22,163,74,.5),0 2px 8px rgba(0,0,0,.15);
          transition:all 0.22s cubic-bezier(.16,1,.3,1);
          border:none; cursor:pointer;
        }
        .cw-fab-btn:hover  { transform:scale(1.1) rotate(-4deg); }
        .cw-fab-btn:active { transform:scale(0.94); }
      `}</style>

      {/* FAB */}
      <div className="cw-fab" style={{ position: "fixed", bottom: "28px", right: "28px", zIndex: 50 }}>
        <button className="cw-fab-btn" onClick={() => setOpen(o => !o)}
          style={{ width: "60px", height: "60px", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <span style={{ fontSize: "26px", lineHeight: 1, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}>
            {open ? "✕" : "🩺"}
          </span>
          {!open && (
            <>
              <span style={{ position: "absolute", top: "-4px", right: "-4px", width: "14px", height: "14px", borderRadius: "50%", background: "#4ade80", border: "2.5px solid white", animation: "orbPulse 2s ease-in-out infinite" }} />
              {unread > 0 && (
                <span style={{ position: "absolute", top: "-6px", left: "-6px", minWidth: "18px", height: "18px", borderRadius: "99px", background: "#ef4444", border: "2px solid white", color: "white", fontSize: "9px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                  {unread}
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* PANEL */}
      {open && (
        <div className="cw-wrap" style={{
          position: "fixed", bottom: "104px", right: "28px", zIndex: 50,
          width: "420px", height: "600px", borderRadius: "24px", overflow: "hidden",
          display: "flex", flexDirection: "column",
          boxShadow: "0 40px 100px rgba(0,0,0,0.22),0 8px 32px rgba(0,0,0,0.12),inset 0 0 0 1px rgba(255,255,255,0.1)",
        }}>

          {/* HEADER */}
          <div className="cw-header-bg" style={{ padding: "14px 16px 12px", position: "relative", flexShrink: 0 }}>
            <div style={{ position: "absolute", inset: 0, opacity: 0.04, borderRadius: "inherit", pointerEvents: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ position: "relative" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", backdropFilter: "blur(8px)" }}>🩺</div>
                  <div style={{ position: "absolute", bottom: "-2px", right: "-2px", width: "10px", height: "10px", borderRadius: "50%", background: "#4ade80", border: "2px solid #052e16", animation: "orbPulse 2.4s ease-in-out infinite" }} />
                </div>
                <div>
                  <p className="cw-shimmer-text" style={{ margin: 0, fontWeight: 900, fontSize: "15px", letterSpacing: "-0.3px", fontFamily: "'Cabinet Grotesk',sans-serif" }}>Medi AI</p>
                  <p style={{ margin: 0, fontSize: "9px", color: "rgba(255,255,255,0.45)", fontWeight: 600, letterSpacing: "0.1em" }}>SMART HOSPITAL ASSISTANT</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {activeFilter && activeFilter !== "All" && (
                  <div style={{ padding: "3px 9px", borderRadius: "8px", background: "rgba(74,222,128,0.2)", border: "1px solid rgba(74,222,128,0.3)", display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ fontSize: "9px", color: "#4ade80", fontWeight: 800, letterSpacing: "0.08em" }}>🎯 {activeFilter.toUpperCase()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Live stats bar */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
              {[
                { label: "Hospitals", value: (hospitals || []).length || "—" },
                { label: "Avg Wait", value: hospitals?.length ? `${Math.round(hospitals.reduce((a, h) => a + h.waitTime, 0) / hospitals.length)}m` : "—" },
                { label: "ERs Open", value: hospitals?.filter(h => h.emergency).length || "—" },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(255,255,255,0.08)", borderRadius: "8px", padding: "6px 9px", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: "13px", color: "#fff", letterSpacing: "-0.3px", fontFamily: "'Cabinet Grotesk',sans-serif" }}>{s.value}</p>
                  <p style={{ margin: 0, fontSize: "9px", color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: "1px" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MESSAGES */}
          <div className="cw-scroll" style={{ flex: 1, overflowY: "auto", padding: "12px 12px 6px", display: "flex", flexDirection: "column", gap: "10px", background: "#f0fdf4" }}>
            {messages.map((m, i) => (
              <div key={i} className="cw-msg">
                <div style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: "7px" }}>
                  {m.role === "assistant" && (
                    <div style={{ width: "26px", height: "26px", borderRadius: "9px", background: "linear-gradient(135deg,#14532d,#16a34a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0, marginBottom: "2px", boxShadow: "0 3px 8px rgba(22,163,74,.28)" }}>🩺</div>
                  )}
                  <div className={m.role === "user" ? "cw-user-bubble" : (m.isCritical ? "cw-critical cw-urgent" : "cw-ai-bubble")}
                    style={{
                      maxWidth: "82%",
                      padding: "10px 13px",
                      borderRadius: m.role === "user" ? "17px 17px 4px 17px" : "17px 17px 17px 4px",
                      fontSize: "13px", lineHeight: 1.55, fontWeight: 500, whiteSpace: "pre-wrap",
                      color: m.role === "user" ? "#fff" : (m.isCritical ? "#7f1d1d" : "#1a2e1a"),
                      fontFamily: "'Cabinet Grotesk',sans-serif",
                      ...(m.isCritical && m.role === "assistant" ? { background: "linear-gradient(135deg,#fef2f2,#fff)", boxShadow: "0 2px 12px rgba(239,68,68,.12),inset 0 0 0 1.5px rgba(239,68,68,.25)" } : {}),
                    }}>
                    {m.isCritical && m.role === "assistant" && (
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "6px" }}>
                        <span style={{ fontSize: "10px", fontWeight: 900, color: "#ef4444", letterSpacing: "0.08em", textTransform: "uppercase" }}>🚨 URGENT</span>
                      </div>
                    )}
                    {m.content}
                  </div>
                </div>

                {/* Hospital action cards */}
                {m.hospitalCards?.length > 0 && (
                  <div style={{ paddingLeft: "33px", display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                    {m.hospitalCards.map((h, ci) => (
                      <div key={ci} className="cw-card" style={{ animationDelay: `${ci * 80}ms` }}>
                        <HospitalActionCard
                          hospital={h}
                          accentColor={ACCENT}
                          isBest={ci === 0}
                          onOpen={() => {
                            onHospitalSelect(h.id);
                            document.getElementById("hospitals")?.scrollIntoView({ behavior: "smooth" });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick reply chips */}
                {m.chips && m.role === "assistant" && (
                  <div style={{ paddingLeft: "33px", marginTop: "6px" }}>
                    <QuickChips chips={m.chips} onSelect={(text) => send(text)} />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="cw-msg" style={{ display: "flex", alignItems: "flex-end", gap: "7px" }}>
                <div style={{ width: "26px", height: "26px", borderRadius: "9px", background: "linear-gradient(135deg,#14532d,#16a34a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0, boxShadow: "0 3px 8px rgba(22,163,74,.28)" }}>🩺</div>
                <div className="cw-ai-bubble" style={{ borderRadius: "17px 17px 17px 4px" }}>
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* INPUT */}
          <div style={{ padding: "10px 12px 6px", display: "flex", gap: "8px", alignItems: "center", flexShrink: 0, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(16px)", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{
              flex: 1, display: "flex", alignItems: "center",
              background: focused ? "#fff" : "#f8fffe",
              border: `1.5px solid ${focused ? "#86efac" : "#d1fae5"}`,
              borderRadius: "13px", padding: "9px 13px",
              transition: "all 0.2s",
              boxShadow: focused ? "0 0 0 3px rgba(134,239,172,0.2)" : "none",
            }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Describe your symptoms…"
                disabled={loading}
                style={{
                  flex: 1, background: "transparent", border: "none", fontSize: "13px",
                  fontWeight: 500, color: "#1a2e1a", outline: "none", opacity: loading ? 0.5 : 1,
                  fontFamily: "'Cabinet Grotesk',sans-serif",
                }}
              />
            </div>
            <button onClick={() => send()} disabled={loading || !input.trim()} className="cw-send"
              style={{ width: "42px", height: "42px", borderRadius: "13px", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: "16px", flexShrink: 0 }}>
              ➤
            </button>
          </div>

          <div style={{ padding: "0 12px 10px", background: "rgba(255,255,255,0.92)", backdropFilter: "blur(16px)", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "9px", color: "#94a3b8", fontWeight: 500, letterSpacing: "0.03em" }}>
              Not a substitute for medical advice · Call <strong style={{ color: "#ef4444" }}>112</strong> in emergencies
            </p>
          </div>
        </div>
      )}
    </>
  );
}