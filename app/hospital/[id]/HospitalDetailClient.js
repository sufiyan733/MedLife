"use client";
import { useState } from "react";
import Link from "next/link";

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-5 flex flex-col gap-1" style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{icon}</span>
        <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</span>
      </div>
      <p className="text-[28px] font-extrabold leading-none" style={{ color, fontFamily: "var(--font-sora)" }}>{value}</p>
      {sub && <p className="text-[11px] text-slate-400 font-medium">{sub}</p>}
    </div>
  );
}

function BedBar({ label, available, total, color }) {
  const pct = total > 0 ? Math.round((available / total) * 100) : 0;
  const barColor = pct > 25 ? "#16a34a" : pct > 8 ? "#d97706" : "#ef4444";
  return (
    <div className="p-4 rounded-xl" style={{ background: `${barColor}08`, border: `1.5px solid ${barColor}20` }}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{label}</span>
        <span className="text-[13px] font-extrabold" style={{ color: barColor }}>{available} <span className="text-slate-400 font-medium">/ {total}</span></span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(pct, 3)}%`, background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)` }} />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-slate-400">{pct}% available</span>
        <span className="text-[10px] font-bold" style={{ color: barColor }}>
          {pct > 25 ? "✓ Available" : pct > 8 ? "⏳ Limited" : "⚠ Critical"}
        </span>
      </div>
    </div>
  );
}

export default function HospitalDetailClient({ hospital, totalAppointments }) {
  const h = hospital;
  const bedPct = h.total_beds > 0 ? Math.round((h.available_beds / h.total_beds) * 100) : 0;
  const statusColor = h.status === "open" ? "#16a34a" : h.status === "full" ? "#ef4444" : "#d97706";
  const statusLabel = h.status === "open" ? "Open" : h.status === "full" ? "Full" : "Limited";

  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${h.lng - 0.02},${h.lat - 0.015},${h.lng + 0.02},${h.lat + 0.015}&layer=mapnik&marker=${h.lat},${h.lng}`;
  const googleUrl = `https://www.google.com/maps/search/?api=1&query=${h.lat},${h.lng}`;

  const departments = Array.isArray(h.departments) ? h.departments : [];

  return (
    <div className="min-h-screen" style={{ background: "#f8faf9", fontFamily: "var(--font-dm-sans)" }}>
      <style>{`
        .display{font-family:var(--font-sora)}
        @keyframes fu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fu .4s ease both}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .fade-in{animation:fadeIn .3s ease both}
      `}</style>

      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm" style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>+</div>
            <span className="display text-[17px] font-extrabold text-slate-900">Medi<span style={{ color: "#16a34a" }}>Life</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href={`/hospital/${h.id}/updates`} className="text-[12px] font-bold px-3 py-1.5 rounded-xl text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-all">
              ✏ Update Info
            </Link>
            <Link href={`/appointments?hospital=${encodeURIComponent(h.name)}`} className="text-[12px] font-bold px-3 py-1.5 rounded-xl text-white hover:opacity-90 transition-all" style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>
              📋 Book Appointment
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero Section */}
        <div className="fu mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full" style={{ background: statusColor, boxShadow: `0 0 8px ${statusColor}80` }} />
                <span className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: statusColor }}>{statusLabel}</span>
                {h.emergency_available && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-500 border border-rose-200 ml-1">🚨 ER Available</span>
                )}
              </div>
              <h1 className="display text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">{h.name}</h1>
              <p className="text-slate-400 text-[14px]">{h.address || h.city}</p>
              {h.city && h.address && <p className="text-slate-400 text-[12px] mt-0.5">{h.city}</p>}
            </div>
            <div className="flex gap-2">
              {h.contact_phone && (
                <a href={`tel:${h.contact_phone}`} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-bold border-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
                  📞 Call
                </a>
              )}
              {h.contact_email && (
                <a href={`mailto:${h.contact_email}`} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-bold border-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
                  ✉ Email
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 fu" style={{ animationDelay: "0.1s" }}>
          <StatCard icon="🛏" label="Available Beds" value={h.available_beds} sub={`of ${h.total_beds} total`} color="#16a34a" />
          <StatCard icon="🏥" label="ICU Available" value={h.icu_available} sub={`of ${h.icu_beds} total`} color="#0369a1" />
          <StatCard icon="📋" label="Appointments" value={totalAppointments} sub="total booked" color="#7c3aed" />
          <StatCard icon="🩺" label="Departments" value={departments.length} sub="specialties" color="#d97706" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bed Availability */}
            <div className="bg-white rounded-2xl overflow-hidden fu" style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 12px rgba(0,0,0,0.03)", animationDelay: "0.15s" }}>
              <div className="h-[3px]" style={{ background: "linear-gradient(90deg,#16a34a,#059669)" }} />
              <div className="p-6">
                <h2 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-4">🛏 Real-Time Bed Availability</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <BedBar label="General Beds" available={h.available_beds} total={h.total_beds} />
                  <BedBar label="ICU Beds" available={h.icu_available} total={h.icu_beds} />
                </div>
              </div>
            </div>

            {/* Departments */}
            {departments.length > 0 && (
              <div className="bg-white rounded-2xl overflow-hidden fu" style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 12px rgba(0,0,0,0.03)", animationDelay: "0.2s" }}>
                <div className="h-[3px]" style={{ background: "linear-gradient(90deg,#0369a1,#0891b2)" }} />
                <div className="p-6">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-4">🩺 Departments & Specialties</h2>
                  <div className="flex flex-wrap gap-2">
                    {departments.map((dept) => (
                      <span key={dept} className="text-[12px] font-semibold px-3 py-2 rounded-xl transition-colors hover:bg-slate-100"
                        style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", color: "#475569" }}>
                        {dept}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Map */}
            <div className="bg-white rounded-2xl overflow-hidden fu" style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 12px rgba(0,0,0,0.03)", animationDelay: "0.25s" }}>
              <div className="h-[3px]" style={{ background: "linear-gradient(90deg,#7c3aed,#a855f7)" }} />
              <div className="p-6">
                <h2 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-4">📍 Location</h2>
                <div className="rounded-xl overflow-hidden border border-slate-200" style={{ height: "280px" }}>
                  <iframe src={osmUrl} className="w-full h-full border-0" title={`Map - ${h.name}`} loading="lazy" />
                </div>
                <div className="flex gap-3 mt-4">
                  <a href={googleUrl} target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-[12px] font-bold text-white transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>
                    🗺 Open in Google Maps
                  </a>
                  <a href={`tel:${h.contact_phone}`}
                    className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl text-[12px] font-bold bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all">
                    📞 Call
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl overflow-hidden fu" style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 12px rgba(0,0,0,0.03)", animationDelay: "0.15s" }}>
              <div className="h-[3px]" style={{ background: "linear-gradient(90deg,#dc2626,#ef4444)" }} />
              <div className="p-6 space-y-3">
                <h2 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2">⚡ Quick Actions</h2>
                <Link href={`/appointments?hospital=${encodeURIComponent(h.name)}`}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90 hover:shadow-lg"
                  style={{ background: "linear-gradient(135deg,#16a34a,#059669)", boxShadow: "0 4px 14px rgba(22,163,74,0.3)" }}>
                  📋 Book Appointment
                </Link>
                {h.emergency_available && (
                  <a href="tel:112"
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg,#dc2626,#991b1b)", boxShadow: "0 4px 14px rgba(220,38,38,0.3)" }}>
                    🚨 Emergency Call
                  </a>
                )}
                <Link href={`/hospital/${h.id}/updates`}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-all">
                  ✏ Update Hospital Data
                </Link>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-2xl overflow-hidden fu" style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 12px rgba(0,0,0,0.03)", animationDelay: "0.2s" }}>
              <div className="h-[3px]" style={{ background: "linear-gradient(90deg,#d97706,#f59e0b)" }} />
              <div className="p-6 space-y-4">
                <h2 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">📞 Contact Information</h2>
                {[
                  { icon: "📞", label: "Phone", value: h.contact_phone, href: `tel:${h.contact_phone}` },
                  { icon: "✉", label: "Email", value: h.contact_email, href: `mailto:${h.contact_email}` },
                  { icon: "📍", label: "Coordinates", value: `${h.lat?.toFixed(4)}, ${h.lng?.toFixed(4)}` },
                ].filter(c => c.value).map(c => (
                  <div key={c.label} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                    <span className="text-base w-6 text-center">{c.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{c.label}</p>
                      {c.href ? (
                        <a href={c.href} className="text-[13px] font-semibold text-slate-700 hover:text-emerald-600 transition-colors">{c.value}</a>
                      ) : (
                        <p className="text-[13px] font-semibold text-slate-700">{c.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Last Updated */}
            <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Last Updated</p>
              <p className="text-[13px] font-semibold text-slate-600 mt-1">
                {h.updated_at ? new Date(h.updated_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
