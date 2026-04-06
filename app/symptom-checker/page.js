"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { haversine, parseElement, fetchHospitals } from "../useHospitals";

const REGIONS = [
  { id: "head", label: "Head", icon: "🧠", symptoms: ["Headache", "Migraine", "Dizziness", "Blurred vision", "Memory loss", "Fainting"] },
  { id: "chest", label: "Chest", icon: "🫀", symptoms: ["Chest pain", "Difficulty breathing", "Palpitations", "Cough", "Tightness"] },
  { id: "abdomen", label: "Abdomen", icon: "🫁", symptoms: ["Stomach pain", "Nausea", "Vomiting", "Bloating", "Acid reflux", "Diarrhea"] },
  { id: "arms", label: "Arms/Hands", icon: "💪", symptoms: ["Joint pain", "Numbness", "Weakness", "Swelling", "Tremors"] },
  { id: "legs", label: "Legs/Feet", icon: "🦵", symptoms: ["Knee pain", "Swelling", "Cramps", "Numbness", "Difficulty walking"] },
  { id: "back", label: "Back/Spine", icon: "🦴", symptoms: ["Lower back pain", "Neck pain", "Stiffness", "Sciatica", "Slip disc"] },
  { id: "skin", label: "Skin", icon: "🧴", symptoms: ["Rash", "Itching", "Swelling", "Redness", "Wounds", "Burns"] },
  { id: "general", label: "General", icon: "🤒", symptoms: ["Fever", "Fatigue", "Weight loss", "Night sweats", "Weakness", "Loss of appetite"] },
];

const SEV_LEVELS = [
  { id: "mild", label: "Mild", desc: "Manageable, no rush", color: "#16a34a", bg: "#f0fdf4" },
  { id: "moderate", label: "Moderate", desc: "Needs attention soon", color: "#d97706", bg: "#fffbeb" },
  { id: "severe", label: "Severe", desc: "Urgent, go today", color: "#ef4444", bg: "#fef2f2" },
  { id: "emergency", label: "Emergency", desc: "Call 112 NOW", color: "#991b1b", bg: "#fef2f2" },
];

/* Maps body region → specialty keywords to match against hospital specialties */
const SPECIALTY_MAP = {
  head: ["Neuro", "Neurology"],
  chest: ["Cardio", "Cardiology"],
  abdomen: ["Gastro", "Gastroenterology"],
  arms: ["Ortho", "Orthopedics"],
  legs: ["Ortho", "Orthopedics"],
  back: ["Ortho", "Orthopedics", "Spine"],
  skin: ["Dermatology"],
  general: [],
};

const DEPT_LABEL = {
  head: "Neurology", chest: "Cardiology", abdomen: "Gastroenterology",
  arms: "Orthopedics", legs: "Orthopedics", back: "Orthopedics / Spine",
  skin: "Dermatology", general: "General Medicine",
};

const DURATION_OPTIONS = ["Today", "1-3 days", "1 week", "2+ weeks", "1+ month"];

export default function SymptomCheckerPage() {
  const [step, setStep] = useState(1);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [severity, setSeverity] = useState("");
  const [duration, setDuration] = useState("");
  const [result, setResult] = useState(null);

  /* Hospital fetching state */
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle"); // idle | loading | granted | denied
  const [hospitals, setHospitals] = useState([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [matchedHospitals, setMatchedHospitals] = useState([]);

  const region = REGIONS.find((r) => r.id === selectedRegion);

  /* ── Get user location on mount ── */
  useEffect(() => {
    if (!navigator.geolocation) { setLocationStatus("denied"); return; }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus("granted");
      },
      () => setLocationStatus("denied"),
      { timeout: 10000 },
    );
  }, []);

  /* ── Fetch hospitals when location is available ── */
  useEffect(() => {
    if (!userLocation) return;
    let cancelled = false;
    (async () => {
      setHospitalsLoading(true);
      try {
        const features = await fetchHospitals(userLocation.lat, userLocation.lng, 15000);
        if (cancelled) return;
        const parsed = features
          .map((f, i) => parseElement(f, i, userLocation.lat, userLocation.lng))
          .filter(Boolean)
          .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
        setHospitals(parsed);
      } catch {
        setHospitals([]);
      } finally {
        if (!cancelled) setHospitalsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userLocation]);

  const toggleSymptom = (s) => {
    setSelectedSymptoms((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  /* ── Analyze & match hospitals ── */
  const analyze = () => {
    const isEmergency = severity === "emergency" || severity === "severe";
    const regionKeywords = SPECIALTY_MAP[selectedRegion] || [];

    // Score hospitals: specialty match + distance + wait time + rating
    const scored = hospitals
      .filter((h) => h.name && h.name.toLowerCase() !== "hospital" && h.address && h.address.toLowerCase() !== "address unavailable")
      .map((h) => {
        let score = 0;

        // Specialty match bonus (biggest factor)
        if (regionKeywords.length === 0) {
          // General: all hospitals qualify equally
          score += 30;
        } else {
          const hasMatch = h.specialties.some((s) =>
            regionKeywords.some((kw) => s.toLowerCase().includes(kw.toLowerCase()))
          );
          score += hasMatch ? 50 : 10;
        }

        // Closer = better (max 25 pts for < 1km, goes down)
        if (h.distanceKm != null) {
          score += Math.max(0, 25 - h.distanceKm * 2);
        }

        // Shorter wait = better (max 15 pts)
        score += Math.max(0, 15 - (h.waitTime / 4));

        // Higher rating = better (max 10 pts)
        score += (h.rating - 3) * 5;

        // Bed availability bonus
        const bedPct = h.beds.available / h.beds.total;
        score += bedPct > 0.25 ? 10 : bedPct > 0.08 ? 5 : 0;

        // Emergency hospital bonus when severity is high
        if (isEmergency && h.emergency) score += 15;

        return { ...h, matchScore: Math.round(score) };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);

    setMatchedHospitals(scored);
    setResult({
      isEmergency,
      region: region?.label,
      symptoms: selectedSymptoms,
      severity,
      duration,
      department: DEPT_LABEL[selectedRegion] || "General Medicine",
    });
    setStep(5);
  };

  const canNext = () => {
    if (step === 1) return !!selectedRegion;
    if (step === 2) return selectedSymptoms.length > 0;
    if (step === 3) return !!severity;
    if (step === 4) return !!duration;
    return true;
  };

  const reset = () => {
    setStep(1); setSelectedRegion(null); setSelectedSymptoms([]);
    setSeverity(""); setDuration(""); setResult(null); setMatchedHospitals([]);
  };

  const sevMeta = SEV_LEVELS.find((s) => s.id === severity);

  return (
    <div className="min-h-screen" style={{ background: "#f8faf9", fontFamily: "var(--font-dm-sans)" }}>
      <style>{`
        .display{font-family:var(--font-sora)}
        @keyframes fu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fu .4s ease both}
        @keyframes cardIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .card-in{animation:cardIn .45s cubic-bezier(.16,1,.3,1) both}
      `}</style>

      <header className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm" style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>+</div>
            <span className="display text-[17px] font-extrabold text-slate-900">Medi<span style={{ color: "#16a34a" }}>Life</span></span>
          </Link>
          <span className="text-[12px] text-slate-400 font-medium">Symptom Checker</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 fu">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600 mb-2 block">🩺 AI Assessment</span>
          <h1 className="display text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">Symptom Checker</h1>
          <p className="text-slate-400 text-[14px]">Tell us how you're feeling — we'll find the right hospital for you</p>
        </div>

        {/* Location status indicator */}
        {locationStatus !== "granted" && step < 5 && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-xl text-[12px] font-semibold" style={{
            background: locationStatus === "loading" ? "#f0fdf4" : "#fef2f2",
            border: `1.5px solid ${locationStatus === "loading" ? "#bbf7d0" : "#fecaca"}`,
            color: locationStatus === "loading" ? "#16a34a" : "#dc2626",
          }}>
            {locationStatus === "loading" ? (
              <><span className="w-4 h-4 rounded-full border-2 border-green-400 border-t-transparent animate-spin" /> Detecting your location…</>
            ) : (
              <><span>📍</span> Location access denied — hospitals will be shown after you allow location or results may be limited.
                <button onClick={() => {
                  setLocationStatus("loading");
                  navigator.geolocation?.getCurrentPosition(
                    (pos) => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocationStatus("granted"); },
                    () => setLocationStatus("denied"),
                    { timeout: 10000 }
                  );
                }} className="underline ml-1 font-bold">Retry</button>
              </>
            )}
          </div>
        )}

        {/* Progress */}
        {step < 5 && (
          <div className="flex gap-1.5 mb-6">
            {[1,2,3,4].map((s) => (
              <div key={s} className="flex-1 h-1.5 rounded-full transition-all" style={{ background: s <= step ? "#16a34a" : "#e2e8f0" }} />
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
          <div className="p-6" key={step}>
            {/* Step 1: Body region */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="display text-lg font-extrabold text-slate-900">Where does it hurt?</h2>
                <p className="text-slate-400 text-[13px]">Select the area of your body that's affected</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {REGIONS.map((r) => (
                    <button key={r.id} onClick={() => setSelectedRegion(r.id)}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all border-[1.5px]"
                      style={selectedRegion === r.id
                        ? { background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", borderColor: "#16a34a", boxShadow: "0 4px 14px rgba(22,163,74,0.15)" }
                        : { background: "white", borderColor: "#e2e8f0" }}>
                      <span className="text-2xl">{r.icon}</span>
                      <span className="text-[11px] font-bold text-slate-700">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Symptoms */}
            {step === 2 && region && (
              <div className="space-y-4">
                <h2 className="display text-lg font-extrabold text-slate-900">What symptoms? <span className="text-emerald-600">{region.icon} {region.label}</span></h2>
                <p className="text-slate-400 text-[13px]">Select all that apply</p>
                <div className="flex flex-wrap gap-2">
                  {region.symptoms.map((s) => (
                    <button key={s} onClick={() => toggleSymptom(s)}
                      className="px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all border-[1.5px]"
                      style={selectedSymptoms.includes(s)
                        ? { background: "#16a34a", color: "white", borderColor: "#16a34a" }
                        : { background: "white", color: "#475569", borderColor: "#e2e8f0" }}>
                      {selectedSymptoms.includes(s) ? "✓ " : ""}{s}
                    </button>
                  ))}
                </div>
                {selectedSymptoms.length > 0 && (
                  <p className="text-[11px] text-emerald-600 font-bold">{selectedSymptoms.length} symptom(s) selected</p>
                )}
              </div>
            )}

            {/* Step 3: Severity */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="display text-lg font-extrabold text-slate-900">How severe?</h2>
                <p className="text-slate-400 text-[13px]">Rate the intensity of your symptoms</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SEV_LEVELS.map((s) => (
                    <button key={s.id} onClick={() => setSeverity(s.id)}
                      className="flex items-start gap-3 p-4 rounded-xl transition-all border-[1.5px] text-left"
                      style={severity === s.id
                        ? { background: s.bg, borderColor: s.color, boxShadow: `0 4px 14px ${s.color}20` }
                        : { background: "white", borderColor: "#e2e8f0" }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black flex-shrink-0" style={{ background: s.color }}>
                        {s.id === "mild" ? "1" : s.id === "moderate" ? "2" : s.id === "severe" ? "3" : "!"}
                      </div>
                      <div>
                        <p className="font-bold text-[13px] text-slate-800">{s.label}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{s.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Duration */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="display text-lg font-extrabold text-slate-900">How long?</h2>
                <p className="text-slate-400 text-[13px]">When did you first notice these symptoms?</p>
                <div className="flex flex-wrap gap-2">
                  {DURATION_OPTIONS.map((d) => (
                    <button key={d} onClick={() => setDuration(d)}
                      className="px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all border-[1.5px]"
                      style={duration === d
                        ? { background: "linear-gradient(135deg,#16a34a,#059669)", color: "white", borderColor: "#16a34a" }
                        : { background: "white", color: "#475569", borderColor: "#e2e8f0" }}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Results + Hospital Suggestions */}
            {step === 5 && result && (
              <div className="space-y-5">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl" style={{ background: result.isEmergency ? "linear-gradient(135deg,#ef4444,#dc2626)" : "linear-gradient(135deg,#16a34a,#059669)" }}>
                    {result.isEmergency ? "🚨" : "✓"}
                  </div>
                  <h2 className="display text-xl font-extrabold text-slate-900 mb-1">Assessment Complete</h2>
                </div>

                {result.isEmergency && (
                  <div className="bg-red-50 rounded-2xl p-4 border-[1.5px] border-red-200 text-center">
                    <p className="font-black text-red-700 text-[14px] mb-2">⚠ Seek immediate medical attention</p>
                    <p className="text-[12px] text-red-600 mb-3">Your symptoms may require urgent care</p>
                    <a href="tel:112" className="inline-flex px-6 py-3 rounded-xl text-[13px] font-bold text-white" style={{ background: "linear-gradient(135deg,#dc2626,#991b1b)" }}>📞 Call 112</a>
                  </div>
                )}

                {/* Summary card */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-2.5">
                  {[
                    ["Region", result.region],
                    ["Symptoms", result.symptoms.join(", ")],
                    ["Severity", result.severity.charAt(0).toUpperCase() + result.severity.slice(1)],
                    ["Duration", result.duration],
                    ["Suggested Dept", result.department],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-[12px] gap-3">
                      <span className="text-slate-400 font-semibold flex-shrink-0">{k}</span>
                      <span className="text-slate-700 font-bold text-right">{v}</span>
                    </div>
                  ))}
                </div>

                {/* ── Hospital Suggestions ── */}
                <div>
                  <h3 className="display text-[15px] font-extrabold text-slate-900 mb-1 flex items-center gap-2">
                    🏥 Recommended Hospitals
                    {hospitalsLoading && <span className="w-4 h-4 rounded-full border-2 border-green-400 border-t-transparent animate-spin" />}
                  </h3>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Based on your symptoms, location, and hospital specialties
                  </p>

                  {hospitalsLoading && matchedHospitals.length === 0 && (
                    <div className="space-y-3">
                      {[1,2,3].map(i => (
                        <div key={i} className="rounded-xl p-4 border border-slate-100" style={{ background: "#fafbfc" }}>
                          <div className="h-4 w-2/3 rounded-lg mb-2" style={{ background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 37%,#f1f5f9 63%)", backgroundSize: "200% 100%", animation: "skeletonShimmer 1.5s ease-in-out infinite" }} />
                          <div className="h-3 w-1/2 rounded-lg" style={{ background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 37%,#f1f5f9 63%)", backgroundSize: "200% 100%", animation: "skeletonShimmer 1.5s ease-in-out infinite" }} />
                        </div>
                      ))}
                    </div>
                  )}

                  {!hospitalsLoading && matchedHospitals.length === 0 && locationStatus !== "granted" && (
                    <div className="text-center py-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                      <p className="text-3xl mb-2">📍</p>
                      <p className="text-slate-500 text-[13px] font-semibold mb-1">Location needed to find hospitals</p>
                      <p className="text-slate-400 text-[11px] mb-3">Allow location access to get hospital suggestions near you</p>
                      <button onClick={() => {
                        setLocationStatus("loading");
                        navigator.geolocation?.getCurrentPosition(
                          (pos) => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocationStatus("granted"); },
                          () => setLocationStatus("denied"),
                          { timeout: 10000 }
                        );
                      }} className="px-5 py-2.5 rounded-xl text-[12px] font-bold text-white" style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>
                        📍 Allow Location
                      </button>
                    </div>
                  )}

                  {!hospitalsLoading && matchedHospitals.length === 0 && locationStatus === "granted" && (
                    <div className="text-center py-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                      <p className="text-3xl mb-2">🏥</p>
                      <p className="text-slate-500 text-[13px] font-semibold">No hospitals found nearby</p>
                      <p className="text-slate-400 text-[11px]">Try checking the main page for hospital listings</p>
                    </div>
                  )}

                  {matchedHospitals.length > 0 && (
                    <div className="space-y-3">
                      {matchedHospitals.map((h, idx) => {
                        const bedPct = Math.round((h.beds.available / h.beds.total) * 100);
                        const bedColor = bedPct > 25 ? "#16a34a" : bedPct > 8 ? "#d97706" : "#ef4444";
                        const regionKw = SPECIALTY_MAP[selectedRegion] || [];
                        const hasSpecialtyMatch = regionKw.length === 0 || h.specialties.some(s => regionKw.some(kw => s.toLowerCase().includes(kw.toLowerCase())));
                        const googleUrl = userLocation
                          ? `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${h.lat},${h.lng}`
                          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name + " " + h.address)}`;

                        return (
                          <div key={h.id} className="card-in rounded-xl border overflow-hidden transition-all hover:shadow-lg"
                            style={{
                              borderColor: idx === 0 ? `${h.accentHex}40` : "rgba(0,0,0,0.06)",
                              animationDelay: `${idx * 0.08}s`,
                              background: idx === 0 ? `linear-gradient(135deg, ${h.accentHex}06, white)` : "white",
                            }}>
                            {/* Top recommendation badge for #1 */}
                            {idx === 0 && (
                              <div className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white text-center"
                                style={{ background: `linear-gradient(135deg, ${h.accentHex}, ${h.accentHex}cc)` }}>
                                ⭐ Best Match for Your Symptoms
                              </div>
                            )}

                            <div className="p-4">
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-[11px] flex-shrink-0"
                                    style={{ background: `linear-gradient(135deg, ${h.accentHex}, ${h.accentHex}cc)`, boxShadow: `0 4px 12px ${h.accentHex}30` }}>
                                    {h.shortName}
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="font-extrabold text-slate-900 text-[13px] leading-tight truncate" style={{ fontFamily: "var(--font-sora)" }}>{h.name}</h4>
                                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{h.address}</p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ background: `${h.accentHex}10`, color: h.accentHex }}>{h.badge}</span>
                                  {hasSpecialtyMatch && regionKw.length > 0 && (
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">✓ Specialty Match</span>
                                  )}
                                </div>
                              </div>

                              {/* Stats row */}
                              <div className="flex items-center flex-wrap gap-1.5 mb-3">
                                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 px-2 py-0.5 rounded-lg" style={{ background: "rgba(245,158,11,0.06)" }}>
                                  ⭐ {h.rating} <span className="text-amber-400">({h.reviews})</span>
                                </span>
                                <span className="w-px h-3 bg-slate-200" />
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg" style={{ background: h.waitTime <= 15 ? "rgba(20,184,166,0.08)" : h.waitTime <= 30 ? "rgba(234,179,8,0.08)" : "rgba(239,68,68,0.08)", color: h.waitTime <= 15 ? "#0d9488" : h.waitTime <= 30 ? "#a16207" : "#dc2626" }}>
                                  ⏱ ~{h.waitTime}m wait
                                </span>
                                <span className="w-px h-3 bg-slate-200" />
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ background: `${bedColor}08`, color: bedColor }}>
                                  🛏 {h.beds.available} beds free
                                </span>
                                {h.distanceKm != null && (
                                  <>
                                    <span className="w-px h-3 bg-slate-200" />
                                    <span className="text-[10px] font-semibold text-slate-500 px-2 py-0.5 rounded-lg" style={{ background: "rgba(0,0,0,0.02)" }}>
                                      📍 {h.distanceKm.toFixed(1)} km
                                    </span>
                                  </>
                                )}
                                {h.emergency && (
                                  <>
                                    <span className="w-px h-3 bg-slate-200" />
                                    <span className="flex items-center gap-1 text-[9px] font-bold text-rose-500 px-1.5 py-0.5 rounded-lg" style={{ background: "rgba(239,68,68,0.06)" }}>
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> ER
                                    </span>
                                  </>
                                )}
                              </div>

                              {/* Specialties */}
                              <div className="flex flex-wrap gap-1 mb-3">
                                {h.specialties.map((s) => {
                                  const isMatch = regionKw.some(kw => s.toLowerCase().includes(kw.toLowerCase()));
                                  return (
                                    <span key={s} className="text-[9px] font-semibold px-2 py-1 rounded-lg"
                                      style={isMatch ? { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" } : { background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569" }}>
                                      {isMatch ? "✓ " : ""}{s}
                                    </span>
                                  );
                                })}
                              </div>

                              {/* Action buttons */}
                              <div className="flex gap-2">
                                <a href={googleUrl} target="_blank" rel="noopener noreferrer"
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold text-white transition-all hover:opacity-90"
                                  style={{ background: `linear-gradient(135deg, ${h.accentHex}, ${h.accentHex}cc)`, boxShadow: `0 4px 12px ${h.accentHex}30` }}>
                                  🗺 Get Directions
                                </a>
                                <a href={`tel:${h.phone}`}
                                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[11px] font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
                                  📞 Call
                                </a>
                                <Link href={`/?hospital=${h.id}`}
                                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[11px] font-bold border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all">
                                  🛏 Book
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Bottom actions */}
                <div className="flex gap-3">
                  <Link href="/" className="flex-1 py-3 rounded-xl text-[13px] font-bold text-center text-white transition-all" style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>
                    🏥 View All Hospitals
                  </Link>
                  <button onClick={reset}
                    className="flex-1 py-3 rounded-xl text-[13px] font-bold text-slate-600 bg-slate-100 border border-slate-200 transition-all">
                    🔄 Check Again
                  </button>
                </div>

                <p className="text-[10px] text-slate-400 text-center">⚕ This is not a medical diagnosis. Always consult a doctor for professional advice.</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          {step < 5 && (
            <div className="px-6 py-5 border-t border-slate-100 flex items-center justify-between gap-3">
              <button onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}
                className="px-5 py-2.5 text-[13px] font-bold text-slate-500 rounded-xl border-[1.5px] border-slate-200 transition-all disabled:opacity-30">← Back</button>
              {step < 4 ? (
                <button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}
                  className="px-6 py-2.5 text-[13px] font-bold text-white rounded-xl transition-all disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>Continue →</button>
              ) : (
                <button onClick={analyze} disabled={!canNext()}
                  className="px-6 py-2.5 text-[13px] font-bold text-white rounded-xl transition-all disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>🩺 Analyze & Find Hospitals</button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
