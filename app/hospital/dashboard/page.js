"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

export default function HospitalDashboard() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/hospitals?limit=50");
        const data = await res.json();
        if (data.success) setHospitals(data.hospitals);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const filtered = hospitals.filter(h =>
    !search || h.name?.toLowerCase().includes(search.toLowerCase()) || h.city?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8faf9" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-[13px] font-medium">Loading hospitals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#f8faf9", fontFamily: "var(--font-dm-sans)" }}>
      <style>{`
        .display{font-family:var(--font-sora)}
        @keyframes fu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fu .4s ease both}
      `}</style>

      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm" style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>+</div>
            <span className="display text-[17px] font-extrabold text-slate-900">Medi<span style={{ color: "#16a34a" }}>Life</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/hospital" className="text-[12px] font-bold px-3 py-1.5 rounded-xl text-white" style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>
              + Register Hospital
            </Link>
            <Link href="/admin" className="text-[12px] font-bold px-3 py-1.5 rounded-xl text-slate-700 bg-slate-100 border border-slate-200">
              Admin Panel
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8 fu">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600 mb-2 block">🏥 Hospital Portal</span>
          <h1 className="display text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">Hospital Dashboard</h1>
          <p className="text-slate-400 text-[14px]">Manage your registered hospitals — update beds, departments, and contact info</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 fu" style={{ animationDelay: "0.1s" }}>
          {[
            { icon: "🏥", label: "Total Hospitals", value: hospitals.length, color: "#0369a1" },
            { icon: "✅", label: "Open", value: hospitals.filter(h => h.status === "open").length, color: "#16a34a" },
            { icon: "🛏", label: "Total Beds", value: hospitals.reduce((s, h) => s + (h.total_beds || 0), 0), color: "#7c3aed" },
            { icon: "🏥", label: "ICU Beds", value: hospitals.reduce((s, h) => s + (h.icu_beds || 0), 0), color: "#d97706" },
          ].map(s => (
            <div key={s.label} className="relative overflow-hidden rounded-2xl bg-white p-4" style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
              <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${s.color}, ${s.color}88)` }} />
              <p className="text-2xl mb-1">{s.icon}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{s.label}</p>
              <p className="text-[24px] font-extrabold leading-none mt-1" style={{ color: s.color, fontFamily: "var(--font-sora)" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6 fu" style={{ animationDelay: "0.15s" }}>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search hospitals by name or city..."
            className="w-full px-4 py-3 rounded-xl text-[13px] text-slate-700 outline-none bg-white border-[1.5px] border-slate-200 placeholder-slate-300 focus:border-emerald-500 transition-all"
            style={{ fontFamily: "inherit" }}
          />
        </div>

        {/* Hospital Cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 fu" style={{ animationDelay: "0.2s" }}>
            <p className="text-5xl mb-4">🏥</p>
            <p className="font-bold text-slate-600 text-[16px] mb-2">
              {hospitals.length === 0 ? "No hospitals registered yet" : "No matching hospitals"}
            </p>
            <p className="text-slate-400 text-[13px] mb-6">
              {hospitals.length === 0 ? "Register your hospital to get started." : "Try a different search term."}
            </p>
            <Link href="/hospital" className="inline-flex px-6 py-3 rounded-xl text-[13px] font-bold text-white" style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>
              + Register Hospital
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((h, idx) => {
              const bedPct = h.total_beds > 0 ? Math.round((h.available_beds / h.total_beds) * 100) : 0;
              const bedColor = bedPct > 25 ? "#16a34a" : bedPct > 8 ? "#d97706" : "#ef4444";
              const statusColor = h.status === "open" ? "#16a34a" : h.status === "full" ? "#ef4444" : "#d97706";
              const depts = Array.isArray(h.departments) ? h.departments : [];

              return (
                <div key={h.id} className="bg-white rounded-2xl overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition-all fu"
                  style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 12px rgba(0,0,0,0.03)", animationDelay: `${idx * 0.06}s` }}>
                  <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${statusColor}, ${statusColor}88)` }} />
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <h3 className="display font-extrabold text-slate-900 text-[15px] leading-tight truncate">{h.name}</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">{h.city} · {h.address?.slice(0, 50)}</p>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wide px-2.5 py-1 rounded-lg flex-shrink-0"
                        style={{ background: `${statusColor}10`, color: statusColor, border: `1px solid ${statusColor}30` }}>
                        <span className="inline-block w-1.5 h-1.5 rounded-full mr-1" style={{ background: statusColor }} />
                        {h.status}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center p-2 rounded-lg" style={{ background: `${bedColor}08` }}>
                        <p className="text-[16px] font-extrabold" style={{ color: bedColor }}>{h.available_beds}</p>
                        <p className="text-[9px] text-slate-400 font-bold">Beds Free</p>
                      </div>
                      <div className="text-center p-2 rounded-lg" style={{ background: "rgba(3,105,161,0.06)" }}>
                        <p className="text-[16px] font-extrabold text-sky-700">{h.icu_available}</p>
                        <p className="text-[9px] text-slate-400 font-bold">ICU Free</p>
                      </div>
                      <div className="text-center p-2 rounded-lg" style={{ background: "rgba(124,58,237,0.06)" }}>
                        <p className="text-[16px] font-extrabold text-violet-600">{depts.length}</p>
                        <p className="text-[9px] text-slate-400 font-bold">Depts</p>
                      </div>
                    </div>

                    {/* Bed bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-slate-400">Bed availability</span>
                        <span className="font-bold" style={{ color: bedColor }}>{bedPct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(bedPct, 3)}%`, background: bedColor }} />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link href={`/hospital/${h.id}`}
                        className="flex-1 py-2.5 rounded-xl text-[11px] font-bold text-center text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all">
                        👁 View
                      </Link>
                      <Link href={`/hospital/${h.id}/updates`}
                        className="flex-1 py-2.5 rounded-xl text-[11px] font-bold text-center text-white transition-all hover:opacity-90"
                        style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>
                        ✏ Update
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
