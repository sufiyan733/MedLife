import Link from "next/link";
export const metadata = { title: "Terms of Service — MediLife", description: "MediLife terms of service and usage conditions." };
export default function TermsPage() {
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
        <h1 style={{ fontFamily: "var(--font-sora)", fontSize: "28px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>Terms of Service</h1>
        <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "32px" }}>Effective: April 2026</p>
        <div style={{ background: "#fff", borderRadius: "16px", padding: "32px", border: "1px solid rgba(0,0,0,0.06)" }}>
          {[
            ["Acceptance", "By using MediLife, you agree to these terms. If you disagree, please discontinue use."],
            ["Service Description", "MediLife provides hospital discovery, AI-powered symptom triage, appointment booking, and emergency assistance. We aggregate real-time data from public APIs and hospital partners."],
            ["Medical Disclaimer", "MediLife is NOT a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of qualified health providers. Our AI recommendations are informational only."],
            ["User Accounts", "You are responsible for maintaining the confidentiality of your account. Provide accurate health information for your safety. You must be 13+ to use MediLife."],
            ["Appointments", "Appointment confirmations are subject to hospital availability. MediLife facilitates bookings but does not guarantee slot availability. Cancellation policies may vary by hospital."],
            ["Emergency Services", "Our SOS feature contacts emergency services and finds nearest hospitals. In true emergencies, always call 112 directly. MediLife is not a replacement for emergency services."],
            ["Limitation of Liability", "MediLife provides information 'as is'. We are not liable for decisions made based on our AI recommendations, hospital data accuracy, or service interruptions."],
            ["Modifications", "We may modify these terms at any time. Continued use after changes constitutes acceptance."],
          ].map(([title, content], i) => (
            <div key={i} style={{ marginBottom: i < 7 ? "24px" : 0 }}>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>{title}</h2>
              <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.7 }}>{content}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
