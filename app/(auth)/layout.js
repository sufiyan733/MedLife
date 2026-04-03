export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center p-5">
      <div className="flex w-full max-w-[900px] min-h-[580px] rounded-2xl overflow-hidden shadow-[0_8px_48px_rgba(0,0,0,0.10)]">

        {/* Left panel */}
        <div className="hidden md:flex flex-col justify-between flex-1 bg-gradient-to-br from-slate-900 via-slate-800 to-[#0f4c75] p-12 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-blue-400/10 rounded-full" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-400/8 rounded-full" />

          {/* Brand */}
          <div className="flex items-center gap-2.5 z-10">
            <div className="w-9 h-9 bg-white/10 border border-white/15 rounded-xl flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="white" strokeWidth={1.8} viewBox="0 0 24 24">
                <path d="M12 2C8 2 5 6 5 10c0 5 7 12 7 12s7-7 7-12c0-4-3-8-7-8z" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="10" r="2.5"/>
              </svg>
            </div>
            <span className="text-white text-[17px] font-semibold tracking-tight">MediConnect</span>
          </div>

          {/* Copy */}
          <div className="z-10">
            <h1 className="text-white text-[28px] font-semibold leading-snug tracking-tight mb-3">
              Smart healthcare,<br/>when you need it.
            </h1>
            <p className="text-white/50 text-[13px] leading-relaxed">
              Find the right hospital instantly based on your symptoms, location, and real-time availability.
            </p>
          </div>

          {/* Features */}
          <div className="z-10 space-y-2.5">
            {[
              "AI-powered symptom analysis",
              "Real-time bed availability",
              "One-tap emergency response",
              "Secure digital health profile",
            ].map(f => (
              <div key={f} className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 bg-blue-300 rounded-full flex-shrink-0" />
                <span className="text-white/60 text-[12px]">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 bg-white p-10 flex flex-col justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}