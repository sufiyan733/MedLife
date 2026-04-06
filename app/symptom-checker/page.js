"use client";
import { useState } from "react";
import Link from "next/link";

const REGIONS = [
  { id: "head", label: "Head", icon: "🧠", y: "5%", x: "50%", symptoms: ["Headache", "Migraine", "Dizziness", "Blurred vision", "Memory loss", "Fainting"] },
  { id: "chest", label: "Chest", icon: "🫀", y: "30%", x: "50%", symptoms: ["Chest pain", "Difficulty breathing", "Palpitations", "Cough", "Tightness"] },
  { id: "abdomen", label: "Abdomen", icon: "🫁", y: "45%", x: "50%", symptoms: ["Stomach pain", "Nausea", "Vomiting", "Bloating", "Acid reflux", "Diarrhea"] },
  { id: "arms", label: "Arms/Hands", icon: "💪", y: "38%", x: "20%", symptoms: ["Joint pain", "Numbness", "Weakness", "Swelling", "Tremors"] },
  { id: "legs", label: "Legs/Feet", icon: "🦵", y: "72%", x: "50%", symptoms: ["Knee pain", "Swelling", "Cramps", "Numbness", "Difficulty walking"] },
  { id: "back", label: "Back/Spine", icon: "🦴", y: "38%", x: "80%", symptoms: ["Lower back pain", "Neck pain", "Stiffness", "Sciatica", "Slip disc"] },
  { id: "skin", label: "Skin", icon: "🧴", y: "58%", x: "20%", symptoms: ["Rash", "Itching", "Swelling", "Redness", "Wounds", "Burns"] },
  { id: "general", label: "General", icon: "🤒", y: "58%", x: "80%", symptoms: ["Fever", "Fatigue", "Weight loss", "Night sweats", "Weakness", "Loss of appetite"] },
];

const SEV_LEVELS = [
  { id: "mild", label: "Mild", desc: "Manageable, no rush", color: "#16a34a", bg: "#f0fdf4" },
  { id: "moderate", label: "Moderate", desc: "Needs attention soon", color: "#d97706", bg: "#fffbeb" },
  { id: "severe", label: "Severe", desc: "Urgent, go today", color: "#ef4444", bg: "#fef2f2" },
  { id: "emergency", label: "Emergency", desc: "Call 112 NOW", color: "#991b1b", bg: "#fef2f2" },
];

const DEPT_MAP = {
  head: "Neuro", chest: "Cardiac", abdomen: "All", arms: "Ortho",
  legs: "Ortho", back: "Ortho", skin: "All", general: "All",
};

const DURATION_OPTIONS = ["Today", "1-3 days", "1 week", "2+ weeks", "1+ month"];

export default function SymptomCheckerPage() {
  const [step, setStep] = useState(1);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [severity, setSeverity] = useState("");
  const [duration, setDuration] = useState("");
  const [result, setResult] = useState(null);

  const region = REGIONS.find((r) => r.id === selectedRegion);

  const toggleSymptom = (s) => {
    setSelectedSymptoms((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const analyze = () => {
    const filter = DEPT_MAP[selectedRegion] || "All";
    const isEmergency = severity === "emergency" || severity === "severe";
    setResult({ filter, isEmergency, region: region?.label, symptoms: selectedSymptoms, severity, duration });
    setStep(5);
  };

  const canNext = () => {
    if (step === 1) return !!selectedRegion;
    if (step === 2) return selectedSymptoms.length > 0;
    if (step === 3) return !!severity;
    if (step === 4) return !!duration;
    return true;
  };

  return (
    <div className="min-h-screen" style={{ background: "#f8faf9", fontFamily: "var(--font-dm-sans)" }}>
      <style>{`.display{font-family:var(--font-sora)} @keyframes fu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}} .fu{animation:fu .4s ease both}`}</style>

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
          <p className="text-slate-400 text-[14px]">Tell us how you're feeling — we'll suggest the right care</p>
        </div>

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

            {/* Step 5: Results */}
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

                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-2.5">
                  {[
                    ["Region", result.region],
                    ["Symptoms", result.symptoms.join(", ")],
                    ["Severity", result.severity.charAt(0).toUpperCase() + result.severity.slice(1)],
                    ["Duration", result.duration],
                    ["Suggested Dept", result.filter === "All" ? "General Medicine" : result.filter],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-[12px] gap-3">
                      <span className="text-slate-400 font-semibold flex-shrink-0">{k}</span>
                      <span className="text-slate-700 font-bold text-right">{v}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Link href={`/?filter=${result.filter}`} className="flex-1 py-3 rounded-xl text-[13px] font-bold text-center text-white transition-all" style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>
                    🏥 Find Hospitals
                  </Link>
                  <button onClick={() => { setStep(1); setSelectedRegion(null); setSelectedSymptoms([]); setSeverity(""); setDuration(""); setResult(null); }}
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
                  style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>🩺 Analyze</button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
