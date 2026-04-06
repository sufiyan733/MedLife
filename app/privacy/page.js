import Link from "next/link";
export const metadata = { title: "Privacy Policy — MediLife", description: "MediLife privacy policy and data handling practices." };
export default function PrivacyPage() {
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
        <h1 style={{ fontFamily: "var(--font-sora)", fontSize: "28px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>Privacy Policy</h1>
        <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "32px" }}>Last updated: April 2026</p>
        <div style={{ background: "#fff", borderRadius: "16px", padding: "32px", border: "1px solid rgba(0,0,0,0.06)" }}>
          {[
            ["Information We Collect", "We collect information you provide directly: name, email, phone, health profile data (blood group, allergies, medications). We also collect device location (with your permission) to find nearby hospitals. We do not sell your data."],
            ["How We Use Your Data", "Your data is used to: find nearby hospitals, provide AI-powered health recommendations, store your health profile for emergency sharing, and improve our services. Health data is encrypted at rest."],
            ["Data Sharing", "We share data only with: hospitals you choose to book with (appointment details), emergency services when you activate SOS mode, and our AI providers (anonymized symptom data for triage). We never share data with advertisers."],
            ["Data Security", "We use industry-standard encryption (TLS 1.3, AES-256) to protect your data in transit and at rest. Our database is hosted on secure cloud infrastructure with SOC 2 compliance."],
            ["Your Rights", "You can: access, update, or delete your profile data at any time; opt out of location tracking; request data export; delete your account. Contact us at privacy@medilife.app."],
            ["Cookies", "We use essential cookies for authentication only. No tracking or advertising cookies are used."],
            ["Changes", "We may update this policy. Significant changes will be communicated via email and in-app notification."],
          ].map(([title, content], i) => (
            <div key={i} style={{ marginBottom: i < 6 ? "24px" : 0 }}>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>{title}</h2>
              <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.7 }}>{content}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
