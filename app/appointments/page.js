"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { useNotifications } from "@/components/Notifications";

const DEPARTMENTS = [
  "Cardiology", "Neurology", "Orthopedics", "Oncology", "Pediatrics",
  "Gynecology", "ENT", "Dermatology", "Gastroenterology", "Nephrology",
  "Urology", "Pulmonology", "Ophthalmology", "General Medicine", "Dental",
];

const DEPT_ICONS = {
  Cardiology: "🫀", Neurology: "🧠", Orthopedics: "🦴", Oncology: "🎗",
  Pediatrics: "👶", Gynecology: "👩", ENT: "👂", Dermatology: "🧴",
  Gastroenterology: "🫁", Nephrology: "🫘", Urology: "💧",
  Pulmonology: "🫁", Ophthalmology: "👁", "General Medicine": "🩺", Dental: "🦷",
};

function generateTimeSlots(dateStr, deptIdx) {
  const slots = [];
  const seed = dateStr.split("-").reduce((a, b) => a + parseInt(b), 0) + deptIdx;
  const starts = [9, 9.5, 10, 10.5, 11, 11.5, 14, 14.5, 15, 15.5, 16, 16.5, 17];
  starts.forEach((t, i) => {
    const available = ((seed * 7 + i * 13) % 5) > 0;
    const hr = Math.floor(t);
    const min = t % 1 === 0.5 ? "30" : "00";
    const ampm = hr >= 12 ? "PM" : "AM";
    const displayHr = hr > 12 ? hr - 12 : hr;
    slots.push({ time: `${displayHr}:${min} ${ampm}`, available, id: `${dateStr}-${hr}${min}` });
  });
  return slots;
}

function getNextDays(count = 7) {
  const days = [];
  const now = new Date();
  for (let i = 1; i <= count; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    days.push({
      date: d.toISOString().split("T")[0],
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNum: d.getDate(),
      month: d.toLocaleDateString("en-US", { month: "short" }),
    });
  }
  return days;
}

export default function AppointmentsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { addToast } = useNotifications();

  const [step, setStep] = useState(1);
  const [hospitalName, setHospitalName] = useState("");
  const [department, setDepartment] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [reason, setReason] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [tokenNumber, setTokenNumber] = useState("");

  const days = useMemo(() => getNextDays(7), []);
  const deptIdx = DEPARTMENTS.indexOf(department);
  const slots = useMemo(() => selectedDate ? generateTimeSlots(selectedDate, deptIdx) : [], [selectedDate, deptIdx]);

  useEffect(() => {
    if (!isPending && !session?.user) router.push("/sign-in");
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      setPatientName(session.user.name || "");
    }
  }, [session]);

  // Read hospital name from query params if redirected from main page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const h = params.get("hospital");
    if (h) setHospitalName(decodeURIComponent(h));
  }, []);

  const canNext = () => {
    if (step === 1) return hospitalName.trim().length > 0;
    if (step === 2) return department.length > 0;
    if (step === 3) return selectedDate && selectedSlot;
    if (step === 4) return patientName.trim().length > 0;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const token = `ML-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    setTokenNumber(token);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospital_name: hospitalName,
          department,
          date: selectedDate,
          time_slot: selectedSlot,
          patient_name: patientName,
          patient_phone: patientPhone,
          reason,
          token_number: token,
        }),
      });
      if (res.ok) {
        // Also save to localStorage for offline access
        try {
          const bookings = JSON.parse(localStorage.getItem("medi-bookings") || "[]");
          bookings.push({
            id: token, hospital_name: hospitalName, department,
            date: selectedDate, time_slot: selectedSlot,
            patient_name: patientName, patient_phone: patientPhone,
            reason, token_number: token, status: "confirmed",
            created_at: new Date().toISOString(),
          });
          localStorage.setItem("medi-bookings", JSON.stringify(bookings));
        } catch {}
        setConfirmed(true);
        addToast({ type: "success", title: "Appointment Booked!", message: `Token: ${token} · ${selectedSlot} on ${selectedDate}` });
      } else {
        addToast({ type: "error", title: "Booking Failed", message: "Please try again" });
      }
    } catch {
      // Save to localStorage as fallback
      try {
        const bookings = JSON.parse(localStorage.getItem("medi-bookings") || "[]");
        bookings.push({
          id: token, hospital_name: hospitalName, department,
          date: selectedDate, time_slot: selectedSlot,
          patient_name: patientName, patient_phone: patientPhone,
          reason, token_number: token, status: "confirmed",
          created_at: new Date().toISOString(),
        });
        localStorage.setItem("medi-bookings", JSON.stringify(bookings));
        setConfirmed(true);
        addToast({ type: "success", title: "Appointment Saved Locally!", message: `Token: ${token}` });
      } catch {
        addToast({ type: "error", title: "Error", message: "Could not save appointment" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8faf9" }}>
        <div className="w-10 h-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#f8faf9", fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}>
        <div className="bg-white rounded-3xl p-8 sm:p-10 max-w-md w-full text-center overflow-hidden" style={{ boxShadow: "0 8px 48px rgba(0,0,0,0.08)", border: "1px solid rgba(0,0,0,0.04)", animation: "fadeUp 0.5s ease both" }}>
          <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}} @keyframes checkBounce{0%{transform:scale(0)rotate(-20deg)}60%{transform:scale(1.15)rotate(4deg)}100%{transform:scale(1)rotate(0)}}`}</style>
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center text-4xl" style={{ background: "linear-gradient(135deg,#16a34a,#059669)", animation: "checkBounce 0.6s cubic-bezier(.16,1,.3,1) both", animationDelay: "0.2s" }}>
            <span style={{ color: "#fff" }}>✓</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2" style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}>Appointment Confirmed!</h2>
          <p className="text-slate-400 text-sm mb-6">Your appointment has been booked successfully</p>

          <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-5 mb-6 text-left space-y-3" style={{ border: "1.5px solid #bbf7d0" }}>
            <div className="flex justify-between items-center pb-3" style={{ borderBottom: "1px solid #dcfce7" }}>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Token Number</span>
              <span className="text-lg font-black text-emerald-700 font-mono">{tokenNumber}</span>
            </div>
            {[
              ["Hospital", hospitalName],
              ["Department", department],
              ["Date", selectedDate],
              ["Time", selectedSlot],
              ["Patient", patientName],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-[12px]">
                <span className="text-slate-400 font-semibold">{k}</span>
                <span className="text-slate-700 font-bold">{v}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Link href="/my-bookings" className="flex-1 py-3 rounded-xl text-[13px] font-bold text-center transition-all" style={{ background: "#f0fdf4", color: "#16a34a", border: "1.5px solid #bbf7d0" }}>
              My Bookings
            </Link>
            <Link href="/" className="flex-1 py-3 rounded-xl text-[13px] font-bold text-white text-center transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>
              Back Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#f8faf9", fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .fade-up{animation:fadeUp 0.4s ease both}
        @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        .slide-in{animation:slideIn 0.35s cubic-bezier(0.16,1,0.3,1) both}
        .display{font-family:var(--font-sora,'Sora',sans-serif)}
      `}</style>

      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm" style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>+</div>
            <span className="display text-[17px] font-extrabold text-slate-900">Medi<span style={{ color: "#16a34a" }}>Life</span></span>
          </Link>
          <span className="text-[12px] text-slate-400 font-medium">Book Appointment</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Title */}
        <div className="mb-8 fade-up">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600 mb-2 block">📋 Appointments</span>
          <h1 className="display text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight mb-2">Book an Appointment</h1>
          <p className="text-slate-400 text-[14px]">Schedule a visit in 4 easy steps</p>
        </div>

        {/* Step progress */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-6 fade-up">
          <div className="flex items-center justify-between gap-2">
            {["Hospital", "Department", "Date & Time", "Confirm"].map((label, i) => {
              const num = i + 1;
              const done = step > num;
              const active = step === num;
              return (
                <div key={label} className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold transition-all ${
                      done ? "bg-emerald-500 text-white" : active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
                    }`}>
                      {done ? "✓" : num}
                    </div>
                    <span className={`text-[11px] font-bold hidden sm:block ${active ? "text-slate-900" : "text-slate-400"}`}>{label}</span>
                  </div>
                  {i < 3 && <div className={`h-0.5 mt-2 rounded-full transition-all ${done ? "bg-emerald-400" : "bg-slate-100"}`} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
          <div className="p-6 slide-in" key={step}>
            {/* Step 1: Hospital */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="display text-lg font-extrabold text-slate-900">Which hospital?</h2>
                <p className="text-slate-400 text-[13px]">Enter the hospital name you want to visit</p>
                <input
                  type="text" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)}
                  placeholder="e.g. Apollo Hospital, AIIMS..."
                  className="w-full px-4 py-3.5 rounded-xl text-[14px] text-slate-800 outline-none bg-white border-[1.5px] border-slate-200 placeholder-slate-300 focus:border-emerald-500 focus:shadow-[0_0_0_3px_rgba(22,163,74,0.08)] transition-all"
                  style={{ fontFamily: "inherit" }} autoFocus
                />
                <div className="bg-amber-50 rounded-xl p-3 flex gap-2.5" style={{ border: "1px solid #fef08a" }}>
                  <span>💡</span>
                  <p className="text-[11px] text-amber-700 leading-relaxed">Tip: You can also book from any hospital card on the homepage by clicking the "🛏 Book" button.</p>
                </div>
              </div>
            )}

            {/* Step 2: Department */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="display text-lg font-extrabold text-slate-900">Select Department</h2>
                <p className="text-slate-400 text-[13px]">Choose the department for your visit at <strong className="text-slate-600">{hospitalName}</strong></p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {DEPARTMENTS.map((dept) => (
                    <button key={dept} onClick={() => setDepartment(dept)}
                      className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-[12px] font-semibold text-left transition-all border-[1.5px]"
                      style={department === dept
                        ? { background: "linear-gradient(135deg,#16a34a,#059669)", color: "white", borderColor: "#16a34a", boxShadow: "0 4px 14px rgba(22,163,74,0.3)" }
                        : { background: "white", color: "#475569", borderColor: "#e2e8f0" }}>
                      <span className="text-lg">{DEPT_ICONS[dept] || "🏥"}</span>
                      {dept}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Date & Time */}
            {step === 3 && (
              <div className="space-y-5">
                <h2 className="display text-lg font-extrabold text-slate-900">Pick Date & Time</h2>
                <p className="text-slate-400 text-[13px]">{department} at <strong className="text-slate-600">{hospitalName}</strong></p>

                {/* Date picker */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2">Select Date</p>
                  <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                    {days.map((d) => (
                      <button key={d.date} onClick={() => { setSelectedDate(d.date); setSelectedSlot(""); }}
                        className="flex flex-col items-center px-3.5 py-3 rounded-xl transition-all flex-shrink-0"
                        style={selectedDate === d.date
                          ? { background: "linear-gradient(135deg,#16a34a,#059669)", color: "white", boxShadow: "0 4px 14px rgba(22,163,74,0.3)" }
                          : { background: "#f8fafc", border: "1.5px solid #e2e8f0", color: "#475569" }}>
                        <span className="text-[10px] font-bold uppercase">{d.day}</span>
                        <span className="text-[18px] font-extrabold">{d.dayNum}</span>
                        <span className="text-[9px] font-medium opacity-70">{d.month}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time slots */}
                {selectedDate && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2">Available Slots</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {slots.map((s) => (
                        <button key={s.id} onClick={() => s.available && setSelectedSlot(s.time)}
                          disabled={!s.available}
                          className="py-2.5 rounded-xl text-[12px] font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          style={selectedSlot === s.time
                            ? { background: "linear-gradient(135deg,#16a34a,#059669)", color: "white", boxShadow: "0 4px 12px rgba(22,163,74,0.3)" }
                            : s.available
                              ? { background: "#f8fafc", border: "1.5px solid #e2e8f0", color: "#475569" }
                              : { background: "#f1f5f9", color: "#cbd5e1", border: "1.5px solid #f1f5f9", textDecoration: "line-through" }}>
                          {s.time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Patient Details + Confirm */}
            {step === 4 && (
              <div className="space-y-5">
                <h2 className="display text-lg font-extrabold text-slate-900">Confirm Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1.5">Patient Name *</label>
                    <input type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-[13px] text-slate-800 outline-none bg-white border-[1.5px] border-slate-200 focus:border-emerald-500 transition-all" style={{ fontFamily: "inherit" }} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1.5">Phone (optional)</label>
                    <input type="tel" value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 rounded-xl text-[13px] text-slate-800 outline-none bg-white border-[1.5px] border-slate-200 focus:border-emerald-500 transition-all placeholder-slate-300" style={{ fontFamily: "inherit" }} />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1.5">Reason for visit (optional)</label>
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
                    placeholder="Brief description of your symptoms or reason..."
                    className="w-full px-4 py-3 rounded-xl text-[13px] text-slate-800 outline-none bg-white border-[1.5px] border-slate-200 focus:border-emerald-500 transition-all resize-none placeholder-slate-300" style={{ fontFamily: "inherit" }} />
                </div>

                {/* Summary */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-2.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Appointment Summary</p>
                  {[
                    ["🏥 Hospital", hospitalName],
                    ["🩺 Department", department],
                    ["📅 Date", selectedDate],
                    ["⏰ Time", selectedSlot],
                    ["👤 Patient", patientName],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-[12px]">
                      <span className="text-slate-400 font-semibold">{k}</span>
                      <span className="text-slate-700 font-bold">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="px-6 py-5 border-t border-slate-100 flex items-center justify-between gap-3">
            <button onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}
              className="px-5 py-2.5 text-[13px] font-bold text-slate-500 rounded-xl border-[1.5px] border-slate-200 transition-all disabled:opacity-30">
              ← Back
            </button>
            {step < 4 ? (
              <button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}
                className="px-6 py-2.5 text-[13px] font-bold text-white rounded-xl transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>
                Continue →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={!canNext() || submitting}
                className="px-6 py-2.5 text-[13px] font-bold text-white rounded-xl transition-all hover:opacity-90 disabled:opacity-40 flex items-center gap-2"
                style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>
                {submitting ? <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />Booking...</> : "📋 Confirm Booking"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
