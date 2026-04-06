import Link from "next/link";
export const metadata = { title: "About — MediLife", description: "Learn about MediLife's mission to make healthcare accessible." };
export default function AboutPage() {
  return (
    <div style={{ background: "#f8faf9", minHeight: "100vh", fontFamily: "var(--font-dm-sans)" }}>
      <header style={{ background: "#fff", borderBottom: "1px solid #f1f5f9", position: "sticky", top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 24px", height: "64px", display: "flex", alignItems: "center" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg,#16a34a,#059669)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: "14px" }}>+</div>
            <span style={{ fontFamily: "var(--font-sora)", fontSize: "17px", fontWeight: 800, color: "#0f172a" }}>Medi<span style={{ color: "#16a34a" }}>Life</span></span>
          </Link>
        </div>
      </header>
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "linear-gradient(135deg,#16a34a,#059669)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: "24px", margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(22,163,74,0.3)" }}>+</div>
          <h1 style={{ fontFamily: "var(--font-sora)", fontSize: "32px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>About MediLife</h1>
          <p style={{ fontSize: "16px", color: "#64748b", maxWidth: "500px", margin: "0 auto", lineHeight: 1.7 }}>AI-powered hospital intelligence — helping you find the right care, right now.</p>
        </div>
        <div style={{ background: "#fff", borderRadius: "16px", padding: "32px", border: "1px solid rgba(0,0,0,0.06)", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "12px" }}>Our Mission</h2>
          <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.8, marginBottom: "16px" }}>In emergencies, every second counts. MediLife was built to eliminate the chaos of finding the right hospital. Using real-time data, AI triage, and live bed availability, we ensure patients reach the right care — fast.</p>
          <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.8 }}>Whether you're dealing with a midnight emergency, scheduling a routine check-up, or simply want to know which hospital is closest with available beds — MediLife has you covered.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          {[
            { icon: "🩺", title: "AI Triage", desc: "Tell Medi your symptoms and get matched with the right department instantly" },
            { icon: "📡", title: "Live Data", desc: "Real-time hospital data from Geoapify and partner hospitals" },
            { icon: "🛏", title: "Bed Booking", desc: "Reserve beds and book appointments directly from the app" },
            { icon: "🚨", title: "Emergency SOS", desc: "One-tap emergency mode finds nearest ER and alerts hospitals" },
          ].map((f) => (
            <div key={f.title} style={{ background: "#fff", borderRadius: "16px", padding: "24px", border: "1px solid rgba(0,0,0,0.06)", textAlign: "center" }}>
              <span style={{ fontSize: "28px", display: "block", marginBottom: "8px" }}>{f.icon}</span>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>{f.title}</h3>
              <p style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center" }}>
          <Link href="/" style={{ display: "inline-flex", padding: "12px 24px", borderRadius: "12px", background: "linear-gradient(135deg,#16a34a,#059669)", color: "white", fontWeight: 700, fontSize: "13px", textDecoration: "none" }}>
            ← Back to MediLife
          </Link>
        </div>
      </main>
    </div>
  );
}
