'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import './admin.css';
import { useLiveClock } from './hooks';
import { HOSPITALS as INIT_H } from './data';
import DashboardView from './DashboardView';
import HospitalsView from './HospitalsView';
import AppointmentsView from './AppointmentsView';
import UsersView from './UsersView';
import AnalyticsView from './AnalyticsView';

const NAV = [
  { section: 'Navigation', items: [
    { key:'Dashboard', icon:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>' },
    { key:'Hospitals', icon:'<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>' },
    { key:'Appointments', icon:'<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' },
    { key:'Users', icon:'<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>' },
  ]},
  { section: 'System', items: [
    { key:'Analytics', icon:'<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>' },
    { key:'Network', icon:'<circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 19.07a10 10 0 010-14.14"/>' },
  ]},
];

function HospitalModal({ hospital, onClose }) {
  if (!hospital) return null;
  const bedPct = Math.round(((hospital.maxBeds - hospital.beds) / hospital.maxBeds) * 100);
  const bedColor = bedPct > 80 ? '#ff3366' : bedPct > 50 ? '#ffaa00' : '#00ff9d';
  const badge = {open:'adm-badge-open', limited:'adm-badge-limited', critical:'adm-badge-critical'}[hospital.status];

  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-modal" onClick={e => e.stopPropagation()}>
        <div className="adm-modal-header">
          <div style={{width:40, height:40, borderRadius:10, background:'linear-gradient(135deg, rgba(0,168,255,0.15), rgba(155,109,255,0.15))', border:'1px solid var(--c-bdr)', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00a8ff" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
          </div>
          <div style={{flex:1}}>
            <div style={{fontFamily:'var(--f-display)', fontSize:18, fontWeight:700}}>{hospital.name}</div>
            <div style={{fontSize:11, color:'var(--c-text3)', fontFamily:'var(--f-mono)'}}>{hospital.loc}</div>
          </div>
          <span className={`adm-badge ${badge}`}><span className="adm-badge-dot"/>{hospital.status.toUpperCase()}</span>
          <button className="adm-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="adm-modal-body">
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:18}}>
            {[
              {label:'Available Beds', value:hospital.beds, max:hospital.maxBeds, color:bedColor},
              {label:'ICU Beds', value:hospital.icu, max:hospital.maxIcu, color:hospital.icu===0?'#ff3366':'#00a8ff'},
              {label:'Rating', value:hospital.rating, max:5, color:'#ffaa00'},
              {label:'Ambulances', value:hospital.ambulances, max:20, color:'#9b6dff'},
            ].map(m => (
              <div key={m.label} style={{background:'rgba(6,16,38,0.8)', border:'1px solid var(--c-bdr)', borderRadius:10, padding:'12px 14px'}}>
                <div style={{fontSize:9, color:'var(--c-text3)', fontFamily:'var(--f-mono)', letterSpacing:1, textTransform:'uppercase', marginBottom:6}}>{m.label}</div>
                <div style={{fontFamily:'var(--f-display)', fontSize:26, fontWeight:700, color:m.color}}>{m.value}<span style={{fontSize:12, color:'var(--c-text3)'}}>/{m.max}</span></div>
                <div style={{height:4, borderRadius:2, background:'rgba(255,255,255,0.06)', overflow:'hidden', marginTop:8}}>
                  <div style={{height:'100%', width:`${(m.value/m.max)*100}%`, background:m.color, borderRadius:2, transition:'width 0.5s ease'}} />
                </div>
              </div>
            ))}
          </div>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:10, color:'var(--c-text3)', fontFamily:'var(--f-mono)', letterSpacing:1, marginBottom:8}}>DEPARTMENTS</div>
            <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
              {hospital.dept.map(d => <span key={d} style={{fontSize:10, padding:'4px 10px', borderRadius:5, background:'rgba(0,168,255,0.08)', border:'1px solid rgba(0,168,255,0.18)', color:'var(--c-blue)', fontFamily:'var(--f-mono)'}}>{d}</span>)}
            </div>
          </div>
          <div style={{display:'flex', gap:14}}>
            <div style={{flex:1, fontSize:11, color:'var(--c-text3)'}}>📞 {hospital.phone}</div>
            <div style={{flex:1, fontSize:11, color:'var(--c-text3)'}}>⭐ {hospital.rating} / 5.0</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [hospitals, setHospitals] = useState(INIT_H);
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [toast, setToast] = useState({ visible:false, title:'', msg:'' });
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [patientsToday, setPatientsToday] = useState(18402);
  const clock = useLiveClock();
  const router = useRouter();
  const toastTimer = useRef(null);

  const showToast = useCallback((title, msg) => {
    setToast({ visible:true, title, msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(t => ({...t, visible:false})), 3200);
  }, []);

  // Hospital simulation
  useEffect(() => {
    const id = setInterval(() => {
      setHospitals(prev => prev.map(h => {
        if (Math.random() > 0.45) return h;
        const bd = Math.floor(Math.random()*8)-3;
        const id2 = Math.random()>0.6?(Math.random()>0.5?1:-1):0;
        const beds = Math.max(0, Math.min(h.maxBeds, h.beds+bd));
        const icu = Math.max(0, Math.min(h.maxIcu, h.icu+id2));
        const status = beds<15?'critical':beds<80?'limited':'open';
        return {...h, beds, icu, status};
      }));
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // Patients counter
  useEffect(() => {
    const tick = () => { setPatientsToday(p => p+Math.floor(Math.random()*4)+1); setTimeout(tick, 12000+Math.random()*6000); };
    const t = setTimeout(tick, 12000);
    return () => clearTimeout(t);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT') return;
      const keys = { '1':'Dashboard', '2':'Hospitals', '3':'Appointments', '4':'Users', '5':'Analytics', '6':'Network' };
      if (keys[e.key]) { setActiveNav(keys[e.key]); e.preventDefault(); }
      if (e.key === 'e' || e.key === 'E') { handleEmergency(); e.preventDefault(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleEmergency = () => {
    setEmergencyMode(true);
    showToast('🚨 EMERGENCY MODE ACTIVE', 'All protocols engaged. Notifying all hospitals.');
    setTimeout(() => setEmergencyMode(false), 4000);
  };

  const criticalCount = hospitals.filter(h => h.status === 'critical').length;

  const renderView = () => {
    switch (activeNav) {
      case 'Hospitals': return <HospitalsView hospitals={hospitals} onSelectHospital={setSelectedHospital} />;
      case 'Appointments': return <AppointmentsView showToast={showToast} />;
      case 'Users': return <UsersView showToast={showToast} />;
      case 'Analytics': return <AnalyticsView hospitals={hospitals} />;
      case 'Network': return (
        <div className="adm-view">
          <div className="adm-sec-label">Network Infrastructure</div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14}}>
            {[
              {label:'Mumbai Region',nodes:247,status:'Operational',color:'#00ff9d',latency:'8ms'},
              {label:'Delhi Region',nodes:189,status:'Operational',color:'#00ff9d',latency:'12ms'},
              {label:'Bangalore Region',nodes:163,status:'Degraded',color:'#ffaa00',latency:'24ms'},
              {label:'Chennai Region',nodes:134,status:'Operational',color:'#00ff9d',latency:'15ms'},
              {label:'Kolkata Region',nodes:98,status:'Operational',color:'#00ff9d',latency:'18ms'},
              {label:'Hyderabad Region',nodes:121,status:'Operational',color:'#00ff9d',latency:'11ms'},
            ].map(r => (
              <div key={r.label} className="adm-panel" style={{padding:18}}>
                <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:12}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:r.color, boxShadow:`0 0 8px ${r.color}`}} />
                  <span style={{fontFamily:'var(--f-display)', fontSize:14, fontWeight:600}}>{r.label}</span>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}>
                  <span style={{fontSize:11, color:'var(--c-text3)'}}>Nodes</span>
                  <span style={{fontFamily:'var(--f-mono)', fontSize:12, color:'var(--c-blue)'}}>{r.nodes}</span>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}>
                  <span style={{fontSize:11, color:'var(--c-text3)'}}>Latency</span>
                  <span style={{fontFamily:'var(--f-mono)', fontSize:12, color:r.color}}>{r.latency}</span>
                </div>
                <div style={{display:'flex', justifyContent:'space-between'}}>
                  <span style={{fontSize:11, color:'var(--c-text3)'}}>Status</span>
                  <span style={{fontFamily:'var(--f-mono)', fontSize:10, color:r.color}}>{r.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
      default: return <DashboardView hospitals={hospitals} showToast={showToast} onSelectHospital={setSelectedHospital} />;
    }
  };

  const I = (d) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" dangerouslySetInnerHTML={{__html:d}} />;

  return (
    <>
      <div className="adm-bg-grid" />
      <div className="adm-orb-1" /><div className="adm-orb-2" /><div className="adm-orb-3" />
      <div className="adm-scanlines" />

      <div className="adm-app">
        {/* SIDEBAR */}
        <aside className="adm-sidebar">
          <div className="adm-logo" onClick={() => router.push('/')} style={{cursor:'pointer'}}>
            <div className="adm-logo-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <div className="adm-logo-name">MEDLIFE<br/>ADMIN</div>
            <div className="adm-logo-sub"><div className="adm-live-dot" />SYSTEM ONLINE</div>
            <div style={{fontFamily:'var(--f-mono)', fontSize:9, color:'var(--c-text3)', letterSpacing:1, marginTop:5}}>9,251 HOSPITALS LINKED</div>
          </div>

          <nav className="adm-nav">
            {NAV.map(s => (
              <div key={s.section}>
                <div className="adm-nav-section">{s.section}</div>
                {s.items.map(({key, icon}) => (
                  <div key={key} className={`adm-nav-item ${activeNav===key?'active':''}`} onClick={() => setActiveNav(key)}>
                    {I(icon)}<span>{key}</span>
                    {key === 'Appointments' && <span className="adm-nav-badge">3</span>}
                    {key === 'Dashboard' && criticalCount > 0 && <span className="adm-nav-badge">{criticalCount}</span>}
                  </div>
                ))}
              </div>
            ))}
          </nav>

          <div className="adm-sidebar-foot">
            <div className="adm-sys-build">SYS BUILD v4.2.1</div>
            <div className="adm-sys-clock">{clock}</div>
          </div>
        </aside>

        {/* MAIN */}
        <div className="adm-main">
          <div className="adm-topbar">
            <div>
              <div className="adm-page-title">Command <span>Center</span></div>
              <div style={{fontFamily:'var(--f-mono)', fontSize:9, color:'var(--c-text3)', letterSpacing:2, marginTop:2}}>
                {activeNav.toUpperCase()} — HOSPITAL INTELLIGENCE SYSTEM
              </div>
            </div>
            <div className="adm-topbar-sep" />
            {criticalCount > 0 && (
              <div className="adm-topbar-chip red">
                <div className="adm-blink-dot" />
                {criticalCount} Critical
              </div>
            )}
            <div className="adm-topbar-chip green">
              <div style={{width:5, height:5, borderRadius:'50%', background:'var(--c-green)', animation:'dotPulse 1.8s ease-in-out infinite'}} />
              <span style={{color:'var(--c-text3)'}}>Patients&nbsp;</span>
              <span style={{color:'var(--c-green)', fontWeight:700}}>{patientsToday.toLocaleString()}</span>
            </div>
            <div className={`adm-topbar-btn ${emergencyMode?'emergency':''}`} onClick={handleEmergency}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              {emergencyMode ? 'ACTIVE — EMERGENCY' : 'Emergency'}
            </div>
            <div className="adm-topbar-btn" onClick={() => showToast('Sync initiated', 'Refreshing all hospital data...')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
              Sync
            </div>
          </div>

          <div className="adm-content" key={activeNav}>
            {renderView()}
          </div>
        </div>
      </div>

      {/* HOSPITAL DETAIL MODAL */}
      {selectedHospital && <HospitalModal hospital={selectedHospital} onClose={() => setSelectedHospital(null)} />}

      {/* TOAST */}
      <div className="adm-toast" style={{
        transform:toast.visible?'translateY(0)':'translateY(16px)',
        opacity:toast.visible?1:0,
        pointerEvents:toast.visible?'auto':'none',
      }}>
        <div style={{fontWeight:600, fontSize:12, color:'var(--c-blue)', marginBottom:4, fontFamily:'var(--f-display)'}}>{toast.title}</div>
        <div style={{fontSize:11, color:'var(--c-text2)', lineHeight:1.5}}>{toast.msg}</div>
      </div>
    </>
  );
}