"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const DEPARTMENTS = [
  "Cardiology", "Neurology", "Orthopedics", "Oncology", "Pediatrics",
  "Gynecology", "ENT", "Dermatology", "Gastroenterology", "Nephrology",
  "Urology", "Pulmonology", "Psychiatry", "Ophthalmology", "Radiology",
  "Transplant", "Trauma & Emergency", "Robotic Surgery", "Spine", "NICU",
  "Cath Lab", "Burn Unit", "Dental", "Physiotherapy", "Dialysis",
];

const STEPS = [
  { id: 1, label: "Basic Info",    icon: "🏥" },
  { id: 2, label: "Location",      icon: "📍" },
  { id: 3, label: "Capacity",      icon: "🛏" },
  { id: 4, label: "Departments",   icon: "🩺" },
  { id: 5, label: "Contact",       icon: "📞" },
];

const INPUT_CLS = `w-full px-4 py-3 rounded-xl text-[13.5px] text-slate-800 outline-none transition-all
  bg-white border-[1.5px] border-slate-200 placeholder-slate-300
  focus:border-slate-800 focus:shadow-[0_0_0_3px_rgba(15,23,42,0.06)]`;

const LABEL_CLS = `block text-[10.5px] font-black uppercase tracking-[0.14em] text-slate-400 mb-1.5`;

function Field({ label, error, children }) {
  return (
    <div>
      {label && <label className={LABEL_CLS}>{label}</label>}
      {children}
      {error && <p className="mt-1.5 text-[11px] text-rose-500 font-medium">{error}</p>}
    </div>
  );
}

function StepDot({ step, current }) {
  const done = current > step.id;
  const active = current === step.id;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[15px] transition-all duration-300 ${
        done   ? "bg-slate-900 shadow-[0_4px_12px_rgba(15,23,42,0.25)]" :
        active ? "bg-white border-2 border-slate-900 shadow-[0_4px_16px_rgba(15,23,42,0.12)]" :
                 "bg-slate-100 border-2 border-transparent"
      }`}>
        {done ? <span className="text-white text-[12px]">✓</span> : step.icon}
      </div>
      <span className={`text-[9.5px] font-bold uppercase tracking-wide hidden sm:block ${
        active ? "text-slate-900" : done ? "text-slate-500" : "text-slate-300"
      }`}>{step.label}</span>
    </div>
  );
}

export default function HospitalRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [locating, setLocating] = useState(false);

  const [form, setForm] = useState({
    // Step 1
    name: "",
    city: "",
    address: "",
    status: "open",
    // Step 2
    lat: "",
    lng: "",
    // Step 3
    total_beds: "",
    available_beds: "",
    icu_beds: "",
    icu_available: "",
    emergency_available: true,
    // Step 4
    departments: [],
    // Step 5
    contact_phone: "",
    contact_email: "",
    incharge_name: "",
    incharge_designation: "",
  });

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: undefined }));
  };

  const toggleDept = (dept) => {
    setForm(f => ({
      ...f,
      departments: f.departments.includes(dept)
        ? f.departments.filter(d => d !== dept)
        : [...f.departments, dept],
    }));
    setErrors(e => ({ ...e, departments: undefined }));
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        set("lat", pos.coords.latitude.toFixed(6));
        set("lng", pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  };

  const validate = () => {
    const e = {};
    if (step === 1) {
      if (!form.name.trim())    e.name    = "Hospital name is required";
      if (!form.city.trim())    e.city    = "City is required";
      if (!form.address.trim()) e.address = "Address is required";
    }
    if (step === 2) {
      if (!form.lat)  e.lat = "Latitude is required";
      if (!form.lng)  e.lng = "Longitude is required";
      if (form.lat && (isNaN(form.lat) || form.lat < -90  || form.lat > 90))  e.lat = "Invalid latitude (-90 to 90)";
      if (form.lng && (isNaN(form.lng) || form.lng < -180 || form.lng > 180)) e.lng = "Invalid longitude (-180 to 180)";
    }
    if (step === 3) {
      if (!form.total_beds)     e.total_beds     = "Total beds required";
      if (!form.available_beds) e.available_beds = "Available beds required";
      if (!form.icu_beds)       e.icu_beds       = "ICU beds required";
      if (!form.icu_available)  e.icu_available  = "ICU available required";
      if (Number(form.available_beds) > Number(form.total_beds))
        e.available_beds = "Cannot exceed total beds";
      if (Number(form.icu_available) > Number(form.icu_beds))
        e.icu_available = "Cannot exceed total ICU beds";
    }
    if (step === 4) {
      if (form.departments.length === 0) e.departments = "Select at least one department";
    }
    if (step === 5) {
      if (!form.contact_phone.trim())        e.contact_phone        = "Phone number required";
      if (!form.contact_email.trim())        e.contact_email        = "Email required";
      if (!form.incharge_name.trim())        e.incharge_name        = "Incharge name required";
      if (!form.incharge_designation.trim()) e.incharge_designation = "Designation required";
      if (form.contact_email && !/\S+@\S+\.\S+/.test(form.contact_email))
        e.contact_email = "Enter a valid email";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep(s => Math.min(s + 1, 5)); };
  const back = () => setStep(s => Math.max(s - 1, 1));

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/hospitals/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:               form.name.trim(),
          address:            form.address.trim(),
          city:               form.city.trim(),
          lat:                parseFloat(form.lat),
          lng:                parseFloat(form.lng),
          total_beds:         parseInt(form.total_beds),
          available_beds:     parseInt(form.available_beds),
          icu_beds:           parseInt(form.icu_beds),
          icu_available:      parseInt(form.icu_available),
          emergency_available: form.emergency_available,
          departments:        form.departments,
          contact_phone:      form.contact_phone.trim(),
          contact_email:      form.contact_email.trim(),
          status:             form.status,
          incharge_name:      form.incharge_name.trim(),
          incharge_designation: form.incharge_designation.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setSubmitted(true);
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setLoading(false);
    }
  };

  /* ── Success screen ── */
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#f8faf9", fontFamily: "'DM Sans', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap'); .display{font-family:'Sora',sans-serif;}`}</style>
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-[0_8px_48px_rgba(0,0,0,0.08)] border border-slate-100">
          <div className="w-20 h-20 rounded-2xl bg-slate-900 flex items-center justify-center text-4xl mx-auto mb-6 shadow-[0_8px_24px_rgba(15,23,42,0.2)]">
            🏥
          </div>
          <h2 className="display text-[26px] font-extrabold text-slate-900 mb-3">Registration submitted!</h2>
          <p className="text-slate-400 text-[14px] leading-relaxed mb-8">
            <strong className="text-slate-700">{form.name}</strong> has been submitted for review.
            Our team will verify your details and activate your listing within 24–48 hours.
          </p>
          <div className="bg-slate-50 rounded-2xl p-4 text-left mb-8 space-y-2">
            {[
              ["Hospital",   form.name],
              ["City",       form.city],
              ["Beds",       `${form.total_beds} total · ${form.available_beds} available`],
              ["ICU",        `${form.icu_beds} total · ${form.icu_available} available`],
              ["Departments",form.departments.length + " selected"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-[12px]">
                <span className="text-slate-400 font-semibold">{k}</span>
                <span className="text-slate-700 font-bold">{v}</span>
              </div>
            ))}
          </div>
          <Link href="/"
            className="block w-full py-3.5 bg-slate-900 hover:bg-slate-700 text-white font-bold text-[13px] rounded-xl transition-all text-center">
            Back to MediLife →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#f8faf9", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        .display { font-family: 'Sora', sans-serif; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.4s ease both; }
        @keyframes slideIn { from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)} }
        .slide-in { animation: slideIn 0.35s cubic-bezier(0.16,1,0.3,1) both; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
      `}</style>

      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm bg-slate-900">+</div>
            <span className="display text-[17px] font-extrabold text-slate-900">Medi<span className="text-emerald-600">Life</span></span>
          </Link>
          <div className="text-[12px] text-slate-400 font-medium">Hospital Partner Registration</div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

        {/* Page title */}
        <div className="mb-10 fade-up">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600 mb-2">For Hospital Incharges</p>
          <h1 className="display text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-3">
            Register your hospital
          </h1>
          <p className="text-slate-400 text-[14px] max-w-lg">
            List your facility on MediLife so patients can find you in real time. Fill in your details across 5 quick steps.
          </p>
        </div>

        {/* Step progress */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-8 fade-up">
          <div className="flex items-center justify-between relative">
            {/* connector line */}
            <div className="absolute left-0 right-0 top-[18px] h-px bg-slate-100 z-0 mx-5" />
            <div
              className="absolute left-5 top-[18px] h-px bg-slate-900 z-0 transition-all duration-500"
              style={{ width: `calc(${((step - 1) / 4) * 100}% - ${((step - 1) / 4) * 10}px)` }}
            />
            {STEPS.map(s => (
              <div key={s.id} className="relative z-10">
                <StepDot step={s} current={step} />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between text-[11px]">
            <span className="text-slate-400">Step {step} of 5</span>
            <span className="font-bold text-slate-700">{STEPS[step - 1].label}</span>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <div className="px-6 pt-6 pb-2 border-b border-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-xl">
                {STEPS[step - 1].icon}
              </div>
              <div>
                <h2 className="display font-extrabold text-slate-900 text-[18px]">{STEPS[step - 1].label}</h2>
                <p className="text-slate-400 text-[12px]">
                  {step === 1 && "Tell us about your hospital"}
                  {step === 2 && "Set your hospital's exact map position"}
                  {step === 3 && "Current bed and ICU availability"}
                  {step === 4 && "Which departments do you offer?"}
                  {step === 5 && "How patients and MediLife can reach you"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 slide-in" key={step}>

            {/* ── STEP 1: Basic Info ── */}
            {step === 1 && (
              <div className="space-y-5">
                <Field label="Hospital name *" error={errors.name}>
                  <input type="text" value={form.name} onChange={e => set("name", e.target.value)}
                    placeholder="e.g. Lilavati Hospital & Research Centre"
                    className={INPUT_CLS} />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="City *" error={errors.city}>
                    <input type="text" value={form.city} onChange={e => set("city", e.target.value)}
                      placeholder="e.g. Mumbai" className={INPUT_CLS} />
                  </Field>
                  <Field label="Operational status *" error={errors.status}>
                    <select value={form.status} onChange={e => set("status", e.target.value)} className={INPUT_CLS}>
                      <option value="open">Open</option>
                      <option value="full">Full / No beds</option>
                      <option value="closed">Temporarily closed</option>
                    </select>
                  </Field>
                </div>
                <Field label="Full address *" error={errors.address}>
                  <textarea value={form.address} onChange={e => set("address", e.target.value)}
                    placeholder="Building, street, landmark, area, city, PIN"
                    rows={3} className={INPUT_CLS + " resize-none"} />
                </Field>
              </div>
            )}

            {/* ── STEP 2: Location ── */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-start gap-3">
                  <span className="text-2xl mt-0.5">📍</span>
                  <div>
                    <p className="font-semibold text-slate-700 text-[13px] mb-1">Why we need this</p>
                    <p className="text-slate-400 text-[12px] leading-relaxed">
                      Coordinates let MediLife calculate real-time distance for patients and sort your hospital accurately on the map.
                      Use the button below or find your coordinates on Google Maps (right-click your building → "What's here?").
                    </p>
                  </div>
                </div>

                <button type="button" onClick={detectLocation} disabled={locating}
                  className="flex items-center gap-2.5 px-5 py-3 rounded-xl text-[13px] font-bold border-2 border-dashed border-slate-200 hover:border-slate-900 text-slate-500 hover:text-slate-900 transition-all disabled:opacity-50 w-full justify-center">
                  {locating
                    ? <><span className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />Detecting…</>
                    : <>📍 Auto-detect my location</>}
                </button>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Latitude *" error={errors.lat}>
                    <input type="number" step="any" value={form.lat} onChange={e => set("lat", e.target.value)}
                      placeholder="e.g. 19.0516" className={INPUT_CLS} />
                  </Field>
                  <Field label="Longitude *" error={errors.lng}>
                    <input type="number" step="any" value={form.lng} onChange={e => set("lng", e.target.value)}
                      placeholder="e.g. 72.8306" className={INPUT_CLS} />
                  </Field>
                </div>

                {form.lat && form.lng && !errors.lat && !errors.lng && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 h-48">
                    <iframe
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(form.lng)-0.015},${parseFloat(form.lat)-0.01},${parseFloat(form.lng)+0.015},${parseFloat(form.lat)+0.01}&layer=mapnik&marker=${form.lat},${form.lng}`}
                      className="w-full h-full border-0" title="Location preview" loading="lazy"
                    />
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 3: Capacity ── */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <p className={LABEL_CLS}>General beds</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Total beds *" error={errors.total_beds}>
                      <input type="number" min="0" value={form.total_beds} onChange={e => set("total_beds", e.target.value)}
                        placeholder="e.g. 320" className={INPUT_CLS} />
                    </Field>
                    <Field label="Available now *" error={errors.available_beds}>
                      <input type="number" min="0" value={form.available_beds} onChange={e => set("available_beds", e.target.value)}
                        placeholder="e.g. 67" className={INPUT_CLS} />
                    </Field>
                  </div>
                  {form.total_beds && form.available_beds && !errors.available_beds && (
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Bed occupancy</span>
                        <span className="font-bold text-slate-600">
                          {Math.round(((form.total_beds - form.available_beds) / form.total_beds) * 100)}% occupied
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-slate-800 transition-all duration-500"
                          style={{ width: `${Math.round(((form.total_beds - form.available_beds) / form.total_beds) * 100)}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <p className={LABEL_CLS}>ICU beds</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Total ICU beds *" error={errors.icu_beds}>
                      <input type="number" min="0" value={form.icu_beds} onChange={e => set("icu_beds", e.target.value)}
                        placeholder="e.g. 38" className={INPUT_CLS} />
                    </Field>
                    <Field label="ICU available now *" error={errors.icu_available}>
                      <input type="number" min="0" value={form.icu_available} onChange={e => set("icu_available", e.target.value)}
                        placeholder="e.g. 12" className={INPUT_CLS} />
                    </Field>
                  </div>
                  {form.icu_beds && form.icu_available && !errors.icu_available && (
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>ICU occupancy</span>
                        <span className="font-bold text-slate-600">
                          {Math.round(((form.icu_beds - form.icu_available) / form.icu_beds) * 100)}% occupied
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-rose-500 transition-all duration-500"
                          style={{ width: `${Math.round(((form.icu_beds - form.icu_available) / form.icu_beds) * 100)}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border-[1.5px] cursor-pointer transition-all"
                  style={form.emergency_available
                    ? { borderColor: "#16a34a", background: "#f0fdf4" }
                    : { borderColor: "#e2e8f0", background: "#f8fafc" }}
                  onClick={() => set("emergency_available", !form.emergency_available)}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🚨</span>
                    <div>
                      <p className="font-bold text-slate-800 text-[13px]">Emergency department available</p>
                      <p className="text-slate-400 text-[11.5px]">Patients needing urgent care will be routed here</p>
                    </div>
                  </div>
                  <div className={`w-11 h-6 rounded-full transition-all duration-300 relative flex-shrink-0 ${form.emergency_available ? "bg-emerald-500" : "bg-slate-200"}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${form.emergency_available ? "left-6" : "left-1"}`} />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 4: Departments ── */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] text-slate-400">Select all that apply</p>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-900 text-white">
                    {form.departments.length} selected
                  </span>
                </div>
                {errors.departments && (
                  <p className="text-[11px] text-rose-500 font-medium">{errors.departments}</p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {DEPARTMENTS.map(dept => {
                    const active = form.departments.includes(dept);
                    return (
                      <button key={dept} type="button" onClick={() => toggleDept(dept)}
                        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[12px] font-semibold text-left transition-all border-[1.5px]"
                        style={active
                          ? { background: "#0f172a", color: "white", borderColor: "#0f172a" }
                          : { background: "white", color: "#475569", borderColor: "#e2e8f0" }}>
                        <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-[10px] transition-all ${active ? "bg-white/20" : "bg-slate-100"}`}>
                          {active ? "✓" : ""}
                        </span>
                        {dept}
                      </button>
                    );
                  })}
                </div>
                {form.departments.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className={LABEL_CLS}>Selected departments</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {form.departments.map(d => (
                        <span key={d} onClick={() => toggleDept(d)}
                          className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 cursor-pointer hover:bg-rose-50 hover:text-rose-500 transition-all">
                          {d} ✕
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 5: Contact ── */}
            {step === 5 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Incharge full name *" error={errors.incharge_name}>
                    <input type="text" value={form.incharge_name} onChange={e => set("incharge_name", e.target.value)}
                      placeholder="Dr. Rajesh Sharma" className={INPUT_CLS} />
                  </Field>
                  <Field label="Designation *" error={errors.incharge_designation}>
                    <input type="text" value={form.incharge_designation} onChange={e => set("incharge_designation", e.target.value)}
                      placeholder="e.g. Medical Superintendent" className={INPUT_CLS} />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Hospital phone *" error={errors.contact_phone}>
                    <input type="tel" value={form.contact_phone} onChange={e => set("contact_phone", e.target.value)}
                      placeholder="+91 22 2675 1000" className={INPUT_CLS} />
                  </Field>
                  <Field label="Hospital email *" error={errors.contact_email}>
                    <input type="email" value={form.contact_email} onChange={e => set("contact_email", e.target.value)}
                      placeholder="info@hospital.com" className={INPUT_CLS} />
                  </Field>
                </div>

                {/* Summary */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                  <p className={LABEL_CLS}>Registration summary</p>
                  {[
                    ["Hospital",     form.name],
                    ["City",         form.city],
                    ["Address",      form.address],
                    ["Coordinates",  form.lat && form.lng ? `${form.lat}, ${form.lng}` : "—"],
                    ["General beds", `${form.total_beds} total · ${form.available_beds} available`],
                    ["ICU beds",     `${form.icu_beds} total · ${form.icu_available} available`],
                    ["Emergency",    form.emergency_available ? "✓ Available" : "✗ Not available"],
                    ["Departments",  form.departments.length + " departments"],
                    ["Status",       form.status],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between items-start text-[12px] gap-4">
                      <span className="text-slate-400 font-semibold flex-shrink-0">{k}</span>
                      <span className="text-slate-700 font-medium text-right">{v}</span>
                    </div>
                  ))}
                </div>

                {errors.submit && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-600 text-[13px] rounded-xl px-4 py-3">
                    {errors.submit}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="px-6 py-5 border-t border-slate-100 flex items-center justify-between gap-3">
            <button type="button" onClick={back} disabled={step === 1}
              className="px-5 py-2.5 text-[13px] font-bold text-slate-500 hover:text-slate-900 rounded-xl border-[1.5px] border-slate-200 hover:border-slate-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              ← Back
            </button>
            <div className="flex items-center gap-2">
              {STEPS.map(s => (
                <div key={s.id} className={`h-1.5 rounded-full transition-all duration-300 ${
                  s.id === step ? "w-6 bg-slate-900" : s.id < step ? "w-3 bg-slate-400" : "w-3 bg-slate-200"
                }`} />
              ))}
            </div>
            {step < 5
              ? <button type="button" onClick={next}
                  className="px-6 py-2.5 text-[13px] font-bold text-white bg-slate-900 hover:bg-slate-700 rounded-xl transition-all hover:-translate-y-px hover:shadow-md">
                  Continue →
                </button>
              : <button type="button" onClick={submit} disabled={loading}
                  className="px-6 py-2.5 text-[13px] font-bold text-white rounded-xl transition-all hover:-translate-y-px hover:shadow-md disabled:opacity-60 flex items-center gap-2"
                  style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>
                  {loading
                    ? <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />Submitting…</>
                    : <>🏥 Submit registration</>}
                </button>
            }
          </div>
        </div>

        <p className="text-center text-[11.5px] text-slate-400 mt-6">
          Already registered?{" "}
          <Link href="/hospital/dashboard" className="text-slate-700 font-semibold hover:underline">
            Go to hospital dashboard →
          </Link>
        </p>
      </div>
    </div>
  );
}