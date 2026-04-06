"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

const GENDER_OPTIONS = ["male", "female", "other"];
const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = authClient.useSession();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    phone: "",
    address: "",
    blood_group: "",
    allergies: "",
    existing_conditions: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    insurance_provider: "",
    insurance_id: "",
    medications: "",
  });

  // Redirect if not signed in
  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.push("/sign-in");
    }
  }, [session, sessionLoading, router]);

  // Fetch profile once session is ready
  useEffect(() => {
    if (!session?.user) return;

    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.profile) {
          const p = data.profile;
          setForm({
            name:                   p.name ?? "",
            age:                    p.age ?? "",
            gender:                 p.gender ?? "",
            phone:                  p.phone ?? "",
            address:                p.address ?? "",
            blood_group:            p.blood_group ?? "",
            allergies:              p.allergies ?? "",
            existing_conditions:    p.existing_conditions ?? "",
            emergency_contact_name: p.emergency_contact_name ?? "",
            emergency_contact_phone: p.emergency_contact_phone ?? "",
            insurance_provider:     p.insurance_provider ?? "",
            insurance_id:           p.insurance_id ?? "",
            medications:            p.medications ?? "",
          });
        }
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [session]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaveError("");
    setSuccess("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    setSuccess("");

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? "Something went wrong.");
      } else {
        setSuccess("Profile updated successfully!");
        setTimeout(() => {
          router.push("/");
        }, 1200);
      }
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (sessionLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8faf9" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-[13px] font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#f8faf9", fontFamily: "var(--font-dm-sans)" }}>
      <style>{`.display{font-family:var(--font-sora)} @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} .fade-up{animation:fadeUp 0.4s ease both}`}</style>

      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm" style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>+</div>
            <span className="display text-[17px] font-extrabold text-slate-900">Medi<span style={{ color: "#16a34a" }}>Life</span></span>
          </Link>
          <span className="text-[12px] text-slate-400 font-medium">Health Profile</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Title */}
        <div className="mb-8 fade-up">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600 mb-2 block">👤 Personal</span>
          <h1 className="display text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">My Profile</h1>
          <p className="text-slate-400 text-[14px]">{session?.user?.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 fade-up">

          {/* Basic Info */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
            <div className="h-[3px]" style={{ background: "linear-gradient(90deg,#16a34a,#059669)" }} />
            <div className="p-6 space-y-5">
              <h2 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Basic Information</h2>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Full Name" required>
                  <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="John Doe" required className={inputClass} />
                </Field>
                <Field label="Phone Number" required>
                  <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" required className={inputClass} />
                </Field>
                <Field label="Age" required>
                  <input type="number" name="age" value={form.age} onChange={handleChange} placeholder="25" min={0} max={150} required className={inputClass} />
                </Field>
                <Field label="Gender" required>
                  <select name="gender" value={form.gender} onChange={handleChange} required className={inputClass}>
                    <option value="">Select gender</option>
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Blood Group" required>
                  <select name="blood_group" value={form.blood_group} onChange={handleChange} required className={inputClass}>
                    <option value="">Select blood group</option>
                    {BLOOD_GROUP_OPTIONS.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Address" required>
                <textarea name="address" value={form.address} onChange={handleChange} placeholder="123 Street, City, State" rows={2} required className={`${inputClass} resize-none`} />
              </Field>
            </div>
          </div>

          {/* Medical Info */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
            <div className="h-[3px]" style={{ background: "linear-gradient(90deg,#0369a1,#0891b2)" }} />
            <div className="p-6 space-y-5">
              <h2 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Medical Information</h2>
              <p className="text-[11px] text-slate-300 -mt-3">Optional — helps hospitals prepare for your visit</p>

              <Field label="Known Allergies">
                <textarea name="allergies" value={form.allergies} onChange={handleChange} placeholder="e.g. Penicillin, Peanuts..." rows={2} className={`${inputClass} resize-none`} />
              </Field>
              <Field label="Existing Medical Conditions">
                <textarea name="existing_conditions" value={form.existing_conditions} onChange={handleChange} placeholder="e.g. Diabetes, Hypertension..." rows={2} className={`${inputClass} resize-none`} />
              </Field>
              <Field label="Current Medications">
                <textarea name="medications" value={form.medications} onChange={handleChange} placeholder="e.g. Metformin 500mg, Aspirin 75mg..." rows={2} className={`${inputClass} resize-none`} />
              </Field>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
            <div className="h-[3px]" style={{ background: "linear-gradient(90deg,#dc2626,#ef4444)" }} />
            <div className="p-6 space-y-5">
              <h2 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">🚨 Emergency Contact</h2>
              <p className="text-[11px] text-slate-300 -mt-3">Shared with hospitals during emergencies</p>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Emergency Contact Name">
                  <input type="text" name="emergency_contact_name" value={form.emergency_contact_name} onChange={handleChange} placeholder="Parent / Spouse name" className={inputClass} />
                </Field>
                <Field label="Emergency Contact Phone">
                  <input type="tel" name="emergency_contact_phone" value={form.emergency_contact_phone} onChange={handleChange} placeholder="+91 98765 43210" className={inputClass} />
                </Field>
              </div>
            </div>
          </div>

          {/* Insurance */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
            <div className="h-[3px]" style={{ background: "linear-gradient(90deg,#7c3aed,#a855f7)" }} />
            <div className="p-6 space-y-5">
              <h2 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">🏥 Insurance Details</h2>
              <p className="text-[11px] text-slate-300 -mt-3">Optional — speeds up hospital admissions</p>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Insurance Provider">
                  <input type="text" name="insurance_provider" value={form.insurance_provider} onChange={handleChange} placeholder="e.g. Star Health, ICICI Lombard" className={inputClass} />
                </Field>
                <Field label="Insurance ID / Policy Number">
                  <input type="text" name="insurance_id" value={form.insurance_id} onChange={handleChange} placeholder="e.g. POL-123456789" className={inputClass} />
                </Field>
              </div>
            </div>
          </div>

          {/* Status messages */}
          {saveError && <ErrorBanner msg={saveError} />}
          {success && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success} Redirecting...
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 px-6 rounded-xl transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#16a34a,#059669)", boxShadow: "0 6px 20px rgba(22,163,74,0.3)" }}
          >
            {saving ? <><Spinner /> Saving...</> : "💾 Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold text-slate-500">
        {label}{required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function ErrorBanner({ msg }) {
  return (
    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
      <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
      {msg}
    </div>
  );
}

function Spinner() {
  return <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />;
}

const inputClass =
  "w-full px-4 py-3 text-[13px] text-slate-800 bg-white border-[1.5px] border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:shadow-[0_0_0_3px_rgba(22,163,74,0.08)] transition-all placeholder-slate-300";