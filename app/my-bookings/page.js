"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

export default function MyBookingsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    if (!isPending && !session?.user) router.push("/sign-in");
  }, [session, isPending, router]);

  // Fetch from DB + merge localStorage fallbacks
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    let dbBookings = [];
    let localBookings = [];

    // 1. Fetch from DB
    try {
      const res = await fetch("/api/appointments");
      const data = await res.json();
      if (data.success && Array.isArray(data.appointments)) {
        dbBookings = data.appointments.map((b) => ({
          id: b.id,
          hospital_name: b.hospital_name,
          department: b.department,
          date: b.date,
          time_slot: b.time_slot,
          patient_name: b.patient_name,
          patient_phone: b.patient_phone,
          reason: b.reason,
          status: b.status,
          token_number: b.token_number,
          created_at: b.created_at,
          source: "db",
        }));
      }
    } catch {}

    // 2. Load localStorage fallbacks (bookings that failed to save to DB)
    try {
      const saved = JSON.parse(localStorage.getItem("medi-bookings") || "[]");
      localBookings = saved
        .filter((lb) => !dbBookings.some((db) => db.id === lb.id || db.token_number === lb.token_number))
        .map((b) => ({ ...b, source: "local" }));
    } catch {}

    setBookings([...dbBookings, ...localBookings]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (session?.user) fetchBookings();
  }, [session, fetchBookings]);

  const now = new Date().toISOString().split("T")[0];
  const upcoming = bookings.filter((b) => b.date >= now && b.status !== "cancelled");
  const past = bookings.filter((b) => b.date < now || b.status === "cancelled");

  const cancelBooking = async (id) => {
    setCancelling(id);
    try {
      // Try DB cancellation
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "cancelled" }),
      });
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b))
        );
      }
    } catch {}
    // Also update localStorage
    try {
      const saved = JSON.parse(localStorage.getItem("medi-bookings") || "[]");
      const updated = saved.map((b) =>
        b.id === id || b.token_number === id ? { ...b, status: "cancelled" } : b
      );
      localStorage.setItem("medi-bookings", JSON.stringify(updated));
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id || b.token_number === id ? { ...b, status: "cancelled" } : b
        )
      );
    } catch {}
    setCancelling(null);
  };

  const list = activeTab === "upcoming" ? upcoming : past;

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8faf9" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-[13px] font-medium">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#f8faf9", fontFamily: "var(--font-dm-sans)" }}>
      <style>{`.display{font-family:var(--font-sora)} @keyframes ci{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm" style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>+</div>
            <span className="display text-[17px] font-extrabold text-slate-900">Medi<span style={{ color: "#16a34a" }}>Life</span></span>
          </Link>
          <Link href="/appointments" className="text-[12px] font-bold px-3 py-1.5 rounded-xl text-white" style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>+ New</Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600 mb-2 block">📖 Activity</span>
          <h1 className="display text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">My Bookings</h1>
          <p className="text-slate-400 text-[14px]">{bookings.length} total</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[["upcoming", `Upcoming (${upcoming.length})`], ["past", `Past (${past.length})`]].map(([k, l]) => (
            <button key={k} onClick={() => setActiveTab(k)} className="px-4 py-2 rounded-xl text-[12px] font-bold transition-all"
              style={activeTab === k ? { background: "linear-gradient(135deg,#16a34a,#059669)", color: "white" } : { background: "#f1f5f9", color: "#64748b" }}>{l}</button>
          ))}
        </div>

        {/* Booking List */}
        {list.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">{activeTab === "upcoming" ? "📋" : "📜"}</p>
            <p className="font-bold text-slate-600 text-[16px] mb-2">{activeTab === "upcoming" ? "No upcoming bookings" : "No past bookings"}</p>
            <p className="text-slate-400 text-[13px] mb-6 max-w-xs mx-auto">{activeTab === "upcoming" ? "Book an appointment to get started." : "Past appointments appear here."}</p>
            {activeTab === "upcoming" && <Link href="/appointments" className="inline-flex px-6 py-3 rounded-xl text-[13px] font-bold text-white" style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>📋 Book Now</Link>}
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((b, i) => {
              const isCan = b.status === "cancelled";
              const days = Math.ceil((new Date(b.date) - new Date()) / 86400000);
              const isLocalOnly = b.source === "local";
              return (
                <div key={b.id || b.token_number || i} className="bg-white rounded-2xl overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition-all" style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 12px rgba(0,0,0,0.03)", animation: `ci 0.35s ease both`, animationDelay: `${i * 60}ms` }}>
                  <div className="h-[3px]" style={{ background: isCan ? "#ef4444" : days <= 1 ? "#f59e0b" : "#16a34a" }} />
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-slate-900 text-[14px] truncate display">{b.hospital_name}</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">{b.department}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isLocalOnly && (
                          <span className="text-[8px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-200">Offline</span>
                        )}
                        <span className={`text-[9px] font-black uppercase tracking-wide px-2.5 py-1 rounded-lg ${isCan ? "bg-red-50 text-red-500" : days <= 0 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
                          {isCan ? "Cancelled" : days <= 0 ? "Today" : `In ${days}d`}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-50 text-slate-500">📅 {b.date}</span>
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-50 text-slate-500">⏰ {b.time_slot}</span>
                      {(b.token_number || b.id) && <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 font-mono">#{b.token_number || b.id}</span>}
                    </div>
                    {b.patient_name && (
                      <p className="text-[11px] text-slate-400 mb-3">👤 {b.patient_name}</p>
                    )}
                    {!isCan && activeTab === "upcoming" && (
                      <div className="flex gap-2 pt-2 border-t border-slate-50">
                        <button
                          onClick={() => cancelBooking(b.id || b.token_number)}
                          disabled={cancelling === (b.id || b.token_number)}
                          className="flex-1 py-2 rounded-xl text-[11px] font-bold text-rose-500 bg-rose-50 border border-rose-100 hover:bg-rose-100 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          {cancelling === (b.id || b.token_number) ? (
                            <><span className="w-3 h-3 rounded-full border-2 border-rose-300 border-t-transparent animate-spin" />Cancelling...</>
                          ) : "Cancel"}
                        </button>
                        <Link href={`/appointments?hospital=${encodeURIComponent(b.hospital_name)}`} className="flex-1 py-2 rounded-xl text-[11px] font-bold text-center text-emerald-600 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-all">Reschedule</Link>
                      </div>
                    )}
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
