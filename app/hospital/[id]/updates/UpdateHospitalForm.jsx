"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const SUGGESTIONS = [
  "Cardiology","Oncology","Nephrology","ENT","Neurology","Pediatrics",
  "Orthopedics","Dermatology","Radiology","Gastroenterology","Psychiatry",
  "Ophthalmology","Urology","Pulmonology","Endocrinology","Rheumatology",
];

const BedIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/>
  </svg>
);
const PhoneIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.8 19.8 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14z"/>
  </svg>
);
const DeptIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><path d="M9 12h6M12 9v6"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f766e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

function SectionHead({ icon, title }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 18px", borderBottom:"1px solid #f3f4f6" }}>
      <div style={{ width:26, height:26, borderRadius:6, background:"#f9fafb", border:"1px solid #f3f4f6", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        {icon}
      </div>
      <span style={{ fontSize:13, fontWeight:500 }}>{title}</span>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <div onClick={onChange} style={{ position:"relative", width:38, height:21, borderRadius:11, cursor:"pointer", flexShrink:0, background: checked ? "#14b8a6" : "#f3f4f6", border:`1px solid ${checked ? "#14b8a6" : "#e5e7eb"}`, transition:"background 0.2s, border-color 0.2s" }}>
      <div style={{ position:"absolute", width:15, height:15, top:3, left: checked ? 20 : 3, background:"white", borderRadius:"50%", boxShadow:"0 1px 2px rgba(0,0,0,0.15)", transition:"left 0.2s" }} />
    </div>
  );
}

function FieldInput({ label, error, errorMsg, ...props }) {
  return (
    <div>
      <label style={{ display:"block", fontSize:11, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.05em", color:"#9ca3af", marginBottom:6 }}>{label}</label>
      <input
        {...props}
        style={{ width:"100%", background: error ? "#fef2f2" : "#f9fafb", border:`1px solid ${error ? "#fca5a5" : "#f3f4f6"}`, borderRadius:8, padding:"8px 12px", fontSize:14, fontWeight:500, outline:"none", fontFamily:"inherit", MozAppearance:"textfield" }}
        onFocus={e => { e.target.style.borderColor = error ? "#f87171" : "#d1d5db"; e.target.style.background = "#fff"; }}
        onBlur={e => { e.target.style.borderColor = error ? "#fca5a5" : "#f3f4f6"; e.target.style.background = error ? "#fef2f2" : "#f9fafb"; }}
      />
      {error && <p style={{ fontSize:11, color:"#ef4444", marginTop:3 }}>{errorMsg}</p>}
    </div>
  );
}

export default function UpdateHospitalForm({ hospital }) {
  const router = useRouter();
  const [loading, setLoading]       = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [deptInput, setDeptInput]   = useState("");
  const [form, setForm] = useState({
    total_beds:          hospital.total_beds ?? 0,
    available_beds:      hospital.available_beds ?? 0,
    icu_beds:            hospital.icu_beds ?? 0,
    icu_available:       hospital.icu_available ?? 0,
    emergency_available: hospital.emergency_available ?? true,
    departments:         hospital.departments ?? [],
    contact_phone:       hospital.contact_phone ?? "",
    contact_email:       hospital.contact_email ?? "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addDept = (val) => {
    const d = val.trim();
    if (!d || form.departments.includes(d)) return;
    set("departments", [...form.departments, d]);
    setDeptInput("");
  };
  const removeDept = (d) => set("departments", form.departments.filter(x => x !== d));

  const bedsErr = form.available_beds > form.total_beds;
  const icuErr  = form.icu_available > form.icu_beds;

  const occ    = form.total_beds > 0 ? ((form.total_beds - form.available_beds) / form.total_beds * 100) : 0;
  const icuPct = form.icu_beds   > 0 ? ((form.icu_beds - form.icu_available)   / form.icu_beds   * 100) : 0;
  const barColor = (n) => n > 90 ? "#f87171" : n > 70 ? "#f59e0b" : "#14b8a6";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (bedsErr || icuErr) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/hospitals/${hospital.id}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      setShowSuccess(true);
      router.refresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const s = {
    page:    { minHeight:"100vh", background:"#f5f5f0", padding:"2.5rem 1.5rem", fontFamily:"system-ui, sans-serif" },
    wrap:    { maxWidth:960, margin:"0 auto" },
    crumb:   { fontSize:12, color:"#9ca3af", marginBottom:10 },
    crumbSpan: { color:"#6b7280" },
    h1:      { fontSize:22, fontWeight:500, color:"#111", letterSpacing:"-0.02em" },
    sub:     { fontSize:13, color:"#9ca3af", marginTop:4, display:"flex", alignItems:"center", gap:6 },
    dot:     { width:7, height:7, borderRadius:"50%", background:"#14b8a6", display:"inline-block", flexShrink:0 },
    cols:    { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, alignItems:"start", marginTop:28 },
    col:     { display:"flex", flexDirection:"column", gap:12 },
    card:    { background:"#fff", borderRadius:12, border:"1px solid #f3f4f6", overflow:"hidden" },
    grid2:   { display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 },
    body:    { padding:"16px 18px" },
    strip:   { display:"grid", gridTemplateColumns:"1fr 1fr", borderTop:"1px solid #f3f4f6" },
    cell:    { padding:"12px 18px", borderRight:"1px solid #f3f4f6" },
    cellLast:{ padding:"12px 18px" },
    slbl:    { fontSize:11, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.05em", color:"#9ca3af", marginBottom:3 },
    snum:    { fontSize:18, fontWeight:500, color:"#111", fontVariantNumeric:"tabular-nums" },
    barWrap: { height:3, borderRadius:2, background:"#f3f4f6", marginTop:6, overflow:"hidden" },
    divider: { height:1, background:"#f3f4f6" },
    qlbl:    { fontSize:11, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.05em", color:"#9ca3af", marginBottom:8 },
    pills:   { display:"flex", flexWrap:"wrap", gap:6 },
    tags:    { display:"flex", flexWrap:"wrap", gap:6, minHeight:28 },
    deptBody:{ padding:"16px 18px", display:"flex", flexDirection:"column", gap:12 },
    dRow:    { display:"flex", gap:8 },
    saveBtn: { width:"100%", background:"#111", color:"#fff", border:"none", borderRadius:10, padding:"13px", fontSize:14, fontWeight:500, cursor:"pointer", fontFamily:"inherit", transition:"opacity 0.15s" },
    overlay: { position:"fixed", inset:0, background:"rgba(0,0,0,0.3)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50 },
    modal:   { background:"#fff", borderRadius:16, padding:"36px 32px", textAlign:"center", maxWidth:320, width:"100%", margin:"0 16px", border:"1px solid #f3f4f6" },
    checkWrap:{ width:52, height:52, borderRadius:"50%", background:"#f0fdfa", border:"1px solid #99f6e4", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" },
    mh2:     { fontSize:16, fontWeight:500, color:"#111", marginBottom:6 },
    mp:      { fontSize:13, color:"#9ca3af", lineHeight:1.6, marginBottom:20 },
    doneBtn: { background:"#111", color:"#fff", border:"none", borderRadius:8, padding:"9px 28px", fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:"inherit" },
  };

  return (
    <div style={s.page}>
      <div style={s.wrap}>

        {/* Header */}
        <div>
          <p style={s.crumb}>Hospital portal › <span style={s.crumbSpan}>Update info</span></p>
          <h1 style={s.h1}>{hospital.name}</h1>
          <p style={s.sub}><span style={s.dot} />Currently open · Changes go live immediately</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={s.cols}>

            {/* LEFT */}
            <div style={s.col}>

              {/* Beds */}
              <div style={s.card}>
                <SectionHead icon={<BedIcon />} title="Bed availability" />
                <div style={s.body}>
                  <div style={s.grid2}>
                    <FieldInput label="Total beds"     type="number" min={0} value={form.total_beds}     onChange={e => set("total_beds",     Number(e.target.value))} error={false} />
                    <FieldInput label="Available beds"  type="number" min={0} value={form.available_beds} onChange={e => set("available_beds",  Number(e.target.value))} error={bedsErr} errorMsg="Exceeds total beds" />
                    <FieldInput label="ICU beds"        type="number" min={0} value={form.icu_beds}       onChange={e => set("icu_beds",        Number(e.target.value))} error={false} />
                    <FieldInput label="ICU available"   type="number" min={0} value={form.icu_available}  onChange={e => set("icu_available",   Number(e.target.value))} error={icuErr} errorMsg="Exceeds ICU total" />
                  </div>
                </div>
                <div style={s.strip}>
                  {[["Bed occupancy", occ], ["ICU usage", icuPct]].map(([label, pct], i) => (
                    <div key={label} style={i === 0 ? s.cell : s.cellLast}>
                      <p style={s.slbl}>{label}</p>
                      <p style={s.snum}>{pct.toFixed(1)}%</p>
                      <div style={s.barWrap}>
                        <div style={{ height:"100%", borderRadius:2, width:`${Math.min(pct,100)}%`, background:barColor(pct), transition:"width 0.3s, background 0.3s" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emergency */}
              <div style={{ ...s.card, padding:"16px 18px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:500, color:"#111" }}>Emergency services</p>
                  <p style={{ fontSize:12, color:"#9ca3af", marginTop:2 }}>Toggle if emergency intake is currently open</p>
                </div>
                <Toggle checked={form.emergency_available} onChange={() => set("emergency_available", !form.emergency_available)} />
              </div>

              {/* Contact */}
              <div style={s.card}>
                <SectionHead icon={<PhoneIcon />} title="Contact details" />
                <div style={s.body}>
                  <div style={s.grid2}>
                    <FieldInput label="Phone" type="tel"   value={form.contact_phone} onChange={e => set("contact_phone", e.target.value)} placeholder="+91 XXXXX XXXXX" error={false} />
                    <FieldInput label="Email" type="email" value={form.contact_email} onChange={e => set("contact_email", e.target.value)} placeholder="admin@hospital.com" error={false} />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div style={s.col}>

              {/* Departments */}
              <div style={s.card}>
                <SectionHead icon={<DeptIcon />} title="Departments" />
                <div style={s.deptBody}>
                  {/* Tags */}
                  <div style={s.tags}>
                    {form.departments.length === 0
                      ? <span style={{ fontSize:13, color:"#d1d5db" }}>No departments added</span>
                      : form.departments.map(d => (
                        <span key={d} style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#f0fdfa", border:"1px solid #99f6e4", borderRadius:20, padding:"4px 10px", fontSize:12, fontWeight:500, color:"#0f766e" }}>
                          {d}
                          <button type="button" onClick={() => removeDept(d)} style={{ background:"none", border:"none", cursor:"pointer", color:"#14b8a6", fontSize:11, lineHeight:1, padding:0, display:"flex", alignItems:"center" }}>✕</button>
                        </span>
                      ))
                    }
                  </div>

                  <div style={s.divider} />

                  {/* Quick add */}
                  <div>
                    <p style={s.qlbl}>Quick add</p>
                    <div style={s.pills}>
                      {SUGGESTIONS.filter(sg => !form.departments.includes(sg)).map(sg => (
                        <button key={sg} type="button" onClick={() => addDept(sg)}
                          style={{ background:"none", border:"1px solid #e5e7eb", borderRadius:20, padding:"4px 10px", fontSize:12, fontWeight:500, color:"#6b7280", cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }}
                          onMouseEnter={e => { e.target.style.background="#f0fdfa"; e.target.style.borderColor="#99f6e4"; e.target.style.color="#0f766e"; }}
                          onMouseLeave={e => { e.target.style.background="none"; e.target.style.borderColor="#e5e7eb"; e.target.style.color="#6b7280"; }}>
                          + {sg}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom input */}
                  <div style={s.dRow}>
                    <input
                      value={deptInput} onChange={e => setDeptInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addDept(deptInput); } }}
                      placeholder="Add custom department…"
                      style={{ flex:1, background:"#f9fafb", border:"1px solid #f3f4f6", borderRadius:8, padding:"8px 12px", fontSize:13, color:"#111", fontFamily:"inherit", outline:"none" }}
                      onFocus={e => { e.target.style.borderColor="#d1d5db"; e.target.style.background="#fff"; }}
                      onBlur={e => { e.target.style.borderColor="#f3f4f6"; e.target.style.background="#f9fafb"; }}
                    />
                    <button type="button" onClick={() => addDept(deptInput)}
                      style={{ width:36, border:"1px solid #e5e7eb", borderRadius:8, background:"#f9fafb", color:"#9ca3af", fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Save */}
              <button type="submit" disabled={loading || bedsErr || icuErr} style={{ ...s.saveBtn, opacity: (loading || bedsErr || icuErr) ? 0.3 : 1, cursor: (loading || bedsErr || icuErr) ? "not-allowed" : "pointer" }}>
                {loading ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div style={s.overlay} onClick={() => setShowSuccess(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.checkWrap}><CheckIcon /></div>
            <h2 style={s.mh2}>Changes saved</h2>
            <p style={s.mp}>Hospital info has been updated and is now live for patients and staff.</p>
            <button style={s.doneBtn} onClick={() => setShowSuccess(false)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}