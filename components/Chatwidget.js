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

const CRITICAL_KEYWORDS = ["can't breathe","not breathing","unconscious","stroke","heart attack","chest pain","seizure","unresponsive","bleeding heavily","overdose","poisoning","saans nahi","dard chhati"];

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

/* ─── Voice Input Hook ─── */
function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-IN"; // supports English + Hindi
      recognitionRef.current = recognition;
    }
    return () => { try { recognitionRef.current?.stop(); } catch {} };
  }, []);

  const startListening = useCallback((onResult) => {
    const rec = recognitionRef.current;
    if (!rec) return;
    rec.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      onResult(transcript);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    setIsListening(true);
    try { rec.start(); } catch { setIsListening(false); }
  }, []);

  const stopListening = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch {}
    setIsListening(false);
  }, []);

  return { isListening, isSupported, startListening, stopListening };
}

/* ─── Typing indicator ─── */
function TypingDots() {
  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center", padding: "12px 14px" }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: "7px", height: "7px", borderRadius: "50%", background: "#16a34a", display: "inline-block",
          animation: "cw-dotDance 1.2s ease-in-out infinite",
          animationDelay: `${i * 160}ms`,
          opacity: 0.7,
        }} />
      ))}
    </div>
  );
}

/* ─── Hospital Action Card ─── */
function HospitalActionCard({ hospital, accentColor, onOpen, isBest }) {
  if (!hospital) return null;
  const pct = ((hospital.bedsAvailable || hospital.beds?.available || 0) / (hospital.bedsTotal || hospital.beds?.total || 1)) * 100;
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
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: "13px", color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{hospital.name}</p>
            <p style={{ margin: "2px 0 0", fontSize: "10px", color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{hospital.address}</p>
          </div>
          {hospital.distanceKm !== null && hospital.distanceKm !== undefined && (
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", flexShrink: 0, marginLeft: "8px" }}>
              📍 {hospital.distanceKm?.toFixed?.(1) ?? hospital.distanceKm} km
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "10px" }}>
          <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "99px", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
            ⏱ ~{hospital.waitTime} min
          </span>
          <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "99px", background: `${bedColor}11`, color: bedColor, border: `1px solid ${bedColor}33` }}>
            🛏 {hospital.bedsAvailable ?? hospital.beds?.available} free
          </span>
          {hospital.emergency && (
            <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "99px", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca" }}>
              🚨 ER
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

/* ─── Inline Bed Booking Widget (inside chat) ─── */
function InlineBedBooking({ hospital, onDone }) {
  const [eta, setEta] = useState("");
  const [etaUnit, setEtaUnit] = useState("min");
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    if (!eta || isNaN(Number(eta)) || Number(eta) <= 0) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setConfirmed(true); }, 1400);
  };

  if (confirmed) {
    return (
      <div style={{ background: "#f0fdf4", borderRadius: "16px", border: "1.5px solid #bbf7d0", padding: "14px", marginTop: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg,#16a34a,#059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>✓</div>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: "13px", color: "#15803d" }}>Bed Reserved! 🎉</p>
            <p style={{ margin: 0, fontSize: "10px", color: "#6b7280" }}>{hospital?.name} · ETA {eta} {etaUnit}</p>
          </div>
        </div>
        <button onClick={onDone} style={{ width: "100%", padding: "8px", borderRadius: "10px", background: "linear-gradient(135deg,#16a34a,#059669)", color: "white", fontWeight: 700, fontSize: "11px", border: "none", cursor: "pointer" }}>
          ✓ Done
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: "#f8fafc", borderRadius: "16px", border: "1.5px solid #e2e8f0", padding: "14px", marginTop: "6px" }}>
      <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: "12px", color: "#1e293b" }}>
        🛏 Book bed at <span style={{ color: "#16a34a" }}>{hospital?.name}</span>
      </p>
      <p style={{ margin: "0 0 10px", fontSize: "10px", color: "#94a3b8" }}>When will you arrive?</p>
      <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
        <input
          type="number" min="1" max="999" value={eta}
          onChange={e => setEta(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleConfirm()}
          placeholder="e.g. 15"
          style={{ flex: 1, padding: "8px 12px", borderRadius: "10px", border: "1.5px solid #e2e8f0", fontSize: "13px", fontWeight: 700, outline: "none", background: "#fff", fontFamily: "inherit" }}
        />
        {["min", "hr"].map(u => (
          <button key={u} onClick={() => setEtaUnit(u)} style={{
            padding: "8px 12px", borderRadius: "10px", fontSize: "11px", fontWeight: 700, cursor: "pointer", border: "none",
            background: etaUnit === u ? "#16a34a" : "#f1f5f9",
            color: etaUnit === u ? "#fff" : "#64748b",
          }}>{u}</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "10px" }}>
        {["5","10","15","20","30"].map(v => (
          <button key={v} onClick={() => { setEta(v); setEtaUnit("min"); }} style={{
            padding: "4px 10px", borderRadius: "99px", fontSize: "10px", fontWeight: 700, cursor: "pointer",
            background: eta === v && etaUnit === "min" ? "#dcfce7" : "#f8fafc",
            color: eta === v && etaUnit === "min" ? "#16a34a" : "#94a3b8",
            border: `1px solid ${eta === v && etaUnit === "min" ? "#bbf7d0" : "#e2e8f0"}`,
          }}>{v}m</button>
        ))}
      </div>
      <button onClick={handleConfirm} disabled={!eta || isNaN(Number(eta)) || Number(eta) <= 0 || loading} style={{
        width: "100%", padding: "10px", borderRadius: "10px", fontWeight: 800, fontSize: "12px", cursor: "pointer", border: "none",
        background: loading ? "#94a3b8" : "linear-gradient(135deg,#16a34a,#059669)", color: "#fff",
        opacity: !eta || isNaN(Number(eta)) || Number(eta) <= 0 ? 0.4 : 1,
        display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
      }}>
        {loading ? <><span style={{ width: "12px", height: "12px", borderRadius: "50%", border: "2px solid #fff", borderTopColor: "transparent", display: "inline-block", animation: "cw-spin 0.8s linear infinite" }} /> Reserving…</> : "🛏 Confirm Bed"}
      </button>
    </div>
  );
}

/* ─── Hospital Comparison Card ─── */
function CompareCard({ hospitals }) {
  if (!hospitals || hospitals.length < 2) return null;
  const [a, b] = hospitals;

  const Row = ({ label, aVal, bVal, better }) => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "8px", padding: "6px 0", borderBottom: "1px solid #f1f5f9", alignItems: "center" }}>
      <span style={{ fontSize: "11px", fontWeight: better === "a" ? 800 : 600, color: better === "a" ? "#16a34a" : "#64748b", textAlign: "right" }}>{aVal}</span>
      <span style={{ fontSize: "9px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center", minWidth: "60px" }}>{label}</span>
      <span style={{ fontSize: "11px", fontWeight: better === "b" ? 800 : 600, color: better === "b" ? "#16a34a" : "#64748b" }}>{bVal}</span>
    </div>
  );

  return (
    <div style={{ background: "#fff", borderRadius: "16px", border: "1.5px solid #e2e8f0", overflow: "hidden", marginTop: "6px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "#f8fafc" }}>
        <div style={{ padding: "10px 12px", borderRight: "1px solid #e2e8f0" }}>
          <p style={{ margin: 0, fontSize: "11px", fontWeight: 800, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</p>
          <p style={{ margin: "2px 0 0", fontSize: "9px", color: "#94a3b8" }}>{a.type || "Hospital"}</p>
        </div>
        <div style={{ padding: "10px 12px" }}>
          <p style={{ margin: 0, fontSize: "11px", fontWeight: 800, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</p>
          <p style={{ margin: "2px 0 0", fontSize: "9px", color: "#94a3b8" }}>{b.type || "Hospital"}</p>
        </div>
      </div>
      <div style={{ padding: "6px 12px" }}>
        <Row label="Distance" aVal={`${a.distanceKm?.toFixed?.(1) ?? "?"} km`} bVal={`${b.distanceKm?.toFixed?.(1) ?? "?"} km`} better={(a.distanceKm||99)<(b.distanceKm||99)?"a":"b"} />
        <Row label="Wait" aVal={`${a.waitTime}m`} bVal={`${b.waitTime}m`} better={a.waitTime<b.waitTime?"a":"b"} />
        <Row label="Rating" aVal={`★ ${a.rating}`} bVal={`★ ${b.rating}`} better={a.rating>b.rating?"a":"b"} />
        <Row label="Beds" aVal={`${a.bedsAvailable ?? a.beds?.available}/${a.bedsTotal ?? a.beds?.total}`} bVal={`${b.bedsAvailable ?? b.beds?.available}/${b.bedsTotal ?? b.beds?.total}`} better={(a.bedsAvailable??a.beds?.available??0)>(b.bedsAvailable??b.beds?.available??0)?"a":"b"} />
        <Row label="ER" aVal={a.emergency?"✅ Yes":"❌ No"} bVal={b.emergency?"✅ Yes":"❌ No"} better={a.emergency&&!b.emergency?"a":b.emergency&&!a.emergency?"b":""} />
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

/* ─── Emergency Inline Alert ─── */
function EmergencyAlert({ onActivate }) {
  return (
    <div style={{
      background: "linear-gradient(135deg,#fef2f2,#fee2e2)", borderRadius: "14px",
      border: "1.5px solid #fca5a5", padding: "12px 14px", marginTop: "6px",
      animation: "cw-urgentPulse 1.5s ease-in-out 3",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <span style={{ fontSize: "18px" }}>🚨</span>
        <p style={{ margin: 0, fontWeight: 900, fontSize: "12px", color: "#dc2626", letterSpacing: "0.04em" }}>EMERGENCY DETECTED</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
        <a href="tel:112" style={{
          padding: "10px", borderRadius: "10px", fontWeight: 800, fontSize: "12px",
          background: "linear-gradient(135deg,#dc2626,#991b1b)", color: "#fff",
          textDecoration: "none", textAlign: "center",
        }}>📞 Call 112</a>
        <button onClick={onActivate} style={{
          padding: "10px", borderRadius: "10px", fontWeight: 800, fontSize: "12px",
          background: "#fff", color: "#dc2626", border: "1.5px solid #fca5a5",
          cursor: "pointer",
        }}>🚑 Send SOS</button>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════
   MAIN CHATWIDGET
═══════════════════════════════════════════════════════════════ */
export function ChatWidget({
  onHospitalSelect, onFilterChange, onEmergency,
  userAddress, userLat, userLng,
  hospitals, activeFilter, selectedHospital, locationStatus,
}) {
  const INITIAL_MSG = {
    role: "assistant",
    content: "Hi, I'm Medi 👋\n\nTell me your symptoms — I'll find the right hospital instantly. No forms, no hassle.",
    chips: [
      { label: "🫀 Chest pain", text: "I have chest pain", urgent: true },
      { label: "🧠 Headache", text: "severe headache and dizziness", urgent: true },
      { label: "🦴 Bone injury", text: "I think I have a fracture", urgent: false },
      { label: "👶 Child sick", text: "my child has high fever", urgent: false },
      { label: "📍 Nearest hospital", text: "show me the nearest hospital", urgent: false },
    ]
  };

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MSG]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [unread, setUnread] = useState(0);
  const [lastRecommendedIdx, setLastRecommendedIdx] = useState(-1);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const { isListening, isSupported: voiceSupported, startListening, stopListening } = useVoiceInput();

  /* ── localStorage persistence ── */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("medi-chat-history");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 1) setMessages(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (messages.length > 1) {
      try {
        // Only persist text content (strip components like hospitalCards)
        const toSave = messages.map(m => ({ role: m.role, content: m.content, isCritical: m.isCritical }));
        localStorage.setItem("medi-chat-history", JSON.stringify(toSave));
      } catch {}
    }
  }, [messages]);

  const clearChat = useCallback(() => {
    setMessages([INITIAL_MSG]);
    setLastRecommendedIdx(-1);
    try { localStorage.removeItem("medi-chat-history"); } catch {}
  }, []);

  /* ── Responsive detection ── */
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (open) { setUnread(0); bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }
  }, [messages, open]);

  /* ── Filter setter for AI ── */
  useEffect(() => {
    window.mediSetFilter = (filter) => { if (onFilterChange) onFilterChange(filter); };
    return () => { delete window.mediSetFilter; };
  }, [onFilterChange]);

  /* ── Select best hospital by criteria ── */
  const selectBestHospital = useCallback((filter, severity, startIdx = 0) => {
    const list = hospitals || [];
    const keywords = {
      Cardiac: ["cardio"], Neuro: ["neuro"], Ortho: ["ortho", "spine"],
      Oncology: ["onco"], Pediatrics: ["pediatr", "paediatr"]
    }[filter] || [];

    let candidates = keywords.length > 0
      ? list.filter(h => h.specialties?.some(s => keywords.some(k => s.toLowerCase().includes(k))))
      : list;
    if (!candidates.length) candidates = list;

    if (severity === "critical") {
      const erCandidates = candidates.filter(h => h.emergency);
      if (erCandidates.length) candidates = erCandidates;
      candidates.sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99) || a.waitTime - b.waitTime);
    } else {
      candidates.sort((a, b) => b.rating - a.rating || a.waitTime - b.waitTime);
    }
    return candidates[startIdx] || candidates[0] || null;
  }, [hospitals]);

  /* ── Main send function ── */
  const send = useCallback(async (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    if (!open) setUnread(u => u + 1);

    // Client-side fast detection
    const detected = detectSymptom(text);
    const critical = isCritical(text);

    // Auto-set filter
    if (detected?.filter && onFilterChange) {
      onFilterChange(detected.filter);
    }

    // For critical, auto-open best hospital immediately
    let autoSelectedHospital = null;
    if (critical || detected?.severity === "critical") {
      autoSelectedHospital = selectBestHospital(detected?.filter || "All", "critical");
      if (autoSelectedHospital) {
        setLastRecommendedIdx(0);
        setTimeout(() => {
          onHospitalSelect(autoSelectedHospital.id);
          document.getElementById("hospitals")?.scrollIntoView({ behavior: "smooth" });
        }, 600);
      }
    }

    try {
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
            visibleHospitals: (hospitals || []).slice(0, 5).map(h => ({
              id: h.id, name: h.name, type: h.type,
              distanceKm: h.distanceKm ?? null,
              rating: h.rating, waitTime: h.waitTime,
              bedsAvailable: h.beds?.available ?? h.bedsAvailable,
              bedsTotal: h.beds?.total ?? h.bedsTotal,
              icuAvailable: h.icu?.available ?? h.icuAvailable,
              icuTotal: h.icu?.total ?? h.icuTotal,
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

      // ── Extract commands ──
      const filterMatch = reply.match(/\[SET_FILTER:([^\]]+)\]/);
      const mapMatches = [...reply.matchAll(/\[OPEN_MAP:([^\]]+)\]/g)];
      const bookMatch = reply.match(/\[BOOK_BED:([^\]]+)\]/);
      const compareMatch = reply.match(/\[COMPARE:([^\]]+)\]/);
      const nextMatch = reply.match(/\[NEXT_HOSPITAL\]/);
      const emergencyMatch = reply.match(/\[EMERGENCY\]/);

      // Clean commands from reply
      reply = reply
        .replace(/\[SET_FILTER:[^\]]+\]/g, "")
        .replace(/\[OPEN_MAP:[^\]]+\]/g, "")
        .replace(/\[BOOK_BED:[^\]]+\]/g, "")
        .replace(/\[COMPARE:[^\]]+\]/g, "")
        .replace(/\[NEXT_HOSPITAL\]/g, "")
        .replace(/\[EMERGENCY\]/g, "")
        .trim();

      // Execute filter command
      if (filterMatch && onFilterChange) {
        onFilterChange(filterMatch[1].trim());
      }

      // Build message object
      const newMsg = {
        role: "assistant",
        content: reply,
        isCritical: critical || detected?.severity === "critical",
      };

      // Hospital cards from OPEN_MAP
      const mentionedHospitals = mapMatches.map(m => {
        const id = m[1].trim();
        return (hospitals || []).find(h => String(h.id) === String(id));
      }).filter(Boolean);
      if (mentionedHospitals.length > 0) {
        newMsg.hospitalCards = mentionedHospitals.slice(0, 2);
      }

      // BOOK_BED command
      if (bookMatch) {
        const id = bookMatch[1].trim();
        const hosp = (hospitals || []).find(h => String(h.id) === String(id));
        if (hosp) newMsg.bookingHospital = hosp;
      }

      // COMPARE command
      if (compareMatch) {
        const ids = compareMatch[1].split(",").map(s => s.trim());
        const compareHospitals = ids.map(id => (hospitals || []).find(h => String(h.id) === String(id))).filter(Boolean);
        if (compareHospitals.length >= 2) newMsg.compareHospitals = compareHospitals;
      }

      // NEXT_HOSPITAL command
      if (nextMatch) {
        const nextIdx = lastRecommendedIdx + 1;
        const nextHosp = (hospitals || [])[nextIdx] || (hospitals || [])[0];
        if (nextHosp) {
          setLastRecommendedIdx(nextIdx);
          newMsg.hospitalCards = [nextHosp];
          setTimeout(() => {
            onHospitalSelect(nextHosp.id);
            document.getElementById("hospitals")?.scrollIntoView({ behavior: "smooth" });
          }, 600);
        }
      }

      // EMERGENCY command
      if (emergencyMatch) {
        newMsg.showEmergency = true;
        if (onEmergency) setTimeout(() => onEmergency(), 1500);
      }

      // Contextual chips
      if (mentionedHospitals.length > 0 || newMsg.hospitalCards?.length > 0) {
        newMsg.chips = [
          { label: "🛏 Book bed here", text: "book bed at this hospital", urgent: false },
          { label: "🔄 Show another", text: "show me another option", urgent: false },
          { label: "⚖️ Compare top 2", text: "compare the top 2 hospitals", urgent: false },
        ];
      } else if (!detected && !critical && messages.length <= 3) {
        newMsg.chips = [
          { label: "📍 Nearest hospital", text: "show me the nearest available hospital", urgent: false },
          { label: "🚨 It's urgent", text: "this is urgent, I need help fast", urgent: true },
          { label: "⏱ Shortest wait", text: "which hospital has shortest wait?", urgent: false },
        ];
      }

      setMessages(p => [...p, newMsg]);

      // Open first hospital from AI response
      if (mapMatches.length > 0 && !autoSelectedHospital) {
        const firstId = mapMatches[0][1].trim();
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
  }, [input, loading, messages, hospitals, userLat, userLng, userAddress, activeFilter, selectedHospital, locationStatus, onHospitalSelect, onFilterChange, onEmergency, selectBestHospital, open, lastRecommendedIdx]);

  const ACCENT = "#16a34a";

  /* ── Panel styles: mobile fullscreen vs desktop floating ── */
  const panelStyle = isMobile
    ? {
        position: "fixed", inset: 0, zIndex: 51,
        display: "flex", flexDirection: "column",
        background: "#fff",
      }
    : {
        position: "fixed", bottom: "104px", right: "28px", zIndex: 50,
        width: "min(420px, calc(100vw - 56px))",
        height: "min(600px, calc(100vh - 140px))",
        borderRadius: "24px", overflow: "hidden",
        display: "flex", flexDirection: "column",
        boxShadow: "0 40px 100px rgba(0,0,0,0.22),0 8px 32px rgba(0,0,0,0.12),inset 0 0 0 1px rgba(255,255,255,0.1)",
      };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&display=swap');
        @keyframes cw-floatUp { from{opacity:0;transform:translateY(18px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes cw-msgIn   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cw-dotDance{ 0%,80%,100%{transform:translateY(0);opacity:.35} 40%{transform:translateY(-5px);opacity:1} }
        @keyframes cw-orbPulse{ 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.15);opacity:1} }
        @keyframes cw-ringPop { 0%{transform:scale(0.85);opacity:0} 60%{transform:scale(1.05);opacity:1} 100%{transform:scale(1);opacity:1} }
        @keyframes cw-shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes cw-gradShift{ 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes cw-urgentPulse{ 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)} 50%{box-shadow:0 0 0 8px rgba(239,68,68,0)} }
        @keyframes cw-slideIn  { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
        @keyframes cw-spin     { to{transform:rotate(360deg)} }
        @keyframes cw-micPulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.5)} 50%{box-shadow:0 0 0 12px rgba(239,68,68,0)} }

        .cw-wrap    { animation:cw-floatUp 0.32s cubic-bezier(.16,1,.3,1) both; font-family:'Cabinet Grotesk',sans-serif; }
        .cw-msg     { animation:cw-msgIn 0.24s cubic-bezier(.16,1,.3,1) both; }
        .cw-fab     { animation:cw-ringPop 0.4s cubic-bezier(.16,1,.3,1) both; }
        .cw-card    { animation:cw-slideIn 0.3s cubic-bezier(.16,1,.3,1) both; }
        .cw-urgent  { animation:cw-urgentPulse 1.5s ease-in-out 3; }

        .cw-header-bg {
          background: linear-gradient(135deg,#052e16,#14532d,#166534,#052e16);
          background-size: 300% 300%;
          animation: cw-gradShift 6s ease infinite;
        }
        .cw-shimmer-text {
          background: linear-gradient(90deg,#86efac,#fff,#4ade80,#fff,#86efac);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: cw-shimmer 3s linear infinite;
        }
        .cw-user-bubble  { background:linear-gradient(135deg,#166534,#15803d,#16a34a); box-shadow:0 4px 16px rgba(22,163,74,.3); }
        .cw-ai-bubble    { background:#fff; box-shadow:0 2px 12px rgba(0,0,0,.06),inset 0 0 0 1px rgba(0,0,0,.06); }
        .cw-send {
          background:linear-gradient(135deg,#16a34a,#15803d);
          box-shadow:0 4px 14px rgba(22,163,74,.4);
          transition:all 0.18s cubic-bezier(.16,1,.3,1);
        }
        .cw-send:hover:not(:disabled) { transform:scale(1.08); }
        .cw-send:active:not(:disabled){ transform:scale(0.94); }
        .cw-send:disabled { opacity:0.4; }
        .cw-mic-active { animation: cw-micPulse 1s ease-in-out infinite; background: linear-gradient(135deg,#ef4444,#dc2626) !important; }
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

      {/* FAB — hide on mobile when chat is open (header ← handles close) */}
      {!(isMobile && open) && (
      <div className="cw-fab" style={{ position: "fixed", bottom: isMobile ? "20px" : "28px", right: isMobile ? "20px" : "28px", zIndex: 52 }}>
        <button
          id="medi-chat-fab"
          className="cw-fab-btn"
          onClick={() => setOpen(o => !o)}
          style={{
            width: isMobile ? "52px" : "60px", height: isMobile ? "52px" : "60px",
            borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
          }}>
          <span style={{ fontSize: isMobile ? "22px" : "26px", lineHeight: 1, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}>
            {open ? "✕" : "🩺"}
          </span>
          {!open && (
            <>
              <span style={{ position: "absolute", top: "-4px", right: "-4px", width: "14px", height: "14px", borderRadius: "50%", background: "#4ade80", border: "2.5px solid white", animation: "cw-orbPulse 2s ease-in-out infinite" }} />
              {unread > 0 && (
                <span style={{ position: "absolute", top: "-6px", left: "-6px", minWidth: "18px", height: "18px", borderRadius: "99px", background: "#ef4444", border: "2px solid white", color: "white", fontSize: "9px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                  {unread}
                </span>
              )}
            </>
          )}
        </button>
      </div>
      )}

      {/* PANEL */}
      {open && (
        <div className="cw-wrap" style={panelStyle}>

          {/* HEADER */}
          <div className="cw-header-bg" style={{ padding: isMobile ? "16px 16px 12px" : "14px 16px 12px", position: "relative", flexShrink: 0 }}>
            <div style={{ position: "absolute", inset: 0, opacity: 0.04, borderRadius: "inherit", pointerEvents: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

            {/* Mobile safe-area + back button */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", paddingTop: isMobile ? "env(safe-area-inset-top, 8px)" : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {isMobile && (
                  <button onClick={() => setOpen(false)} style={{
                    width: "32px", height: "32px", borderRadius: "10px",
                    background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)",
                    color: "#fff", fontSize: "16px", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>←</button>
                )}
                <div style={{ position: "relative" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", backdropFilter: "blur(8px)" }}>🩺</div>
                  <div style={{ position: "absolute", bottom: "-2px", right: "-2px", width: "10px", height: "10px", borderRadius: "50%", background: "#4ade80", border: "2px solid #052e16", animation: "cw-orbPulse 2.4s ease-in-out infinite" }} />
                </div>
                <div>
                  <p className="cw-shimmer-text" style={{ margin: 0, fontWeight: 900, fontSize: "15px", letterSpacing: "-0.3px", fontFamily: "'Cabinet Grotesk',sans-serif" }}>Medi AI</p>
                  <p style={{ margin: 0, fontSize: "9px", color: "rgba(255,255,255,0.45)", fontWeight: 600, letterSpacing: "0.1em" }}>SMART HOSPITAL ASSISTANT</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {activeFilter && activeFilter !== "All" && (
                  <div style={{ padding: "3px 9px", borderRadius: "8px", background: "rgba(74,222,128,0.2)", border: "1px solid rgba(74,222,128,0.3)", display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ fontSize: "9px", color: "#4ade80", fontWeight: 800, letterSpacing: "0.08em" }}>🎯 {activeFilter.toUpperCase()}</span>
                  </div>
                )}
                {messages.length > 1 && (
                  <button onClick={clearChat} title="Clear chat" style={{
                    width: "28px", height: "28px", borderRadius: "8px",
                    background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.6)", fontSize: "12px", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>🗑</button>
                )}
                {!isMobile && (
                  <button onClick={() => setOpen(false)} style={{
                    width: "28px", height: "28px", borderRadius: "8px",
                    background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.6)", fontSize: "12px", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>✕</button>
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
                  <div className={m.role === "user" ? "cw-user-bubble" : (m.isCritical ? "cw-urgent" : "cw-ai-bubble")}
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

                {/* Comparison card */}
                {m.compareHospitals && (
                  <div style={{ paddingLeft: "33px", marginTop: "4px" }}>
                    <CompareCard hospitals={m.compareHospitals} />
                  </div>
                )}

                {/* Inline bed booking */}
                {m.bookingHospital && (
                  <div style={{ paddingLeft: "33px", marginTop: "4px" }}>
                    <InlineBedBooking hospital={m.bookingHospital} onDone={() => {}} />
                  </div>
                )}

                {/* Emergency alert */}
                {m.showEmergency && (
                  <div style={{ paddingLeft: "33px", marginTop: "4px" }}>
                    <EmergencyAlert onActivate={() => { if (onEmergency) onEmergency(); }} />
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
          <div style={{
            padding: isMobile ? "10px 12px 6px" : "10px 12px 6px",
            display: "flex", gap: "8px", alignItems: "center", flexShrink: 0,
            background: "rgba(255,255,255,0.92)", backdropFilter: "blur(16px)",
            borderTop: "1px solid rgba(0,0,0,0.06)",
          }}>
            {/* Voice button */}
            {voiceSupported && (
              <button
                onClick={() => {
                  if (isListening) { stopListening(); }
                  else { startListening((transcript) => { setInput(transcript); setTimeout(() => send(transcript), 100); }); }
                }}
                className={isListening ? "cw-mic-active" : ""}
                style={{
                  width: "42px", height: "42px", borderRadius: "13px", border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", fontSize: "18px", flexShrink: 0,
                  background: isListening ? "linear-gradient(135deg,#ef4444,#dc2626)" : "#f1f5f9",
                  color: isListening ? "#fff" : "#64748b",
                  transition: "all 0.2s",
                }}>
                {isListening ? "⏹" : "🎙"}
              </button>
            )}

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
                placeholder={isListening ? "Listening..." : "Describe your symptoms…"}
                disabled={loading || isListening}
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

          <div style={{
            padding: isMobile ? "0 12px 12px" : "0 12px 10px",
            paddingBottom: isMobile ? "calc(env(safe-area-inset-bottom, 10px) + 10px)" : "10px",
            background: "rgba(255,255,255,0.92)", backdropFilter: "blur(16px)", textAlign: "center",
          }}>
            <p style={{ margin: 0, fontSize: "9px", color: "#94a3b8", fontWeight: 500, letterSpacing: "0.03em" }}>
              {voiceSupported && "🎙 Voice enabled · "}Not medical advice · Call <strong style={{ color: "#ef4444" }}>112</strong> in emergencies
            </p>
          </div>
        </div>
      )}
    </>
  );
}