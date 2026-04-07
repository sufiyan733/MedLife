'use client';
import { useState, useEffect, useRef } from 'react';

function Gauge({ value, max, color, label }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'), s = 2, w = 56*s, h = 56*s;
    c.width = w; c.height = h;
    const cx = w/2, cy = h/2, r = w/2 - 8, pct = max > 0 ? value/max : 0;
    ctx.clearRect(0,0,w,h);
    ctx.beginPath(); ctx.arc(cx,cy,r, -Math.PI*0.75, Math.PI*0.75); ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.lineWidth=6; ctx.lineCap='round'; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx,cy,r, -Math.PI*0.75, -Math.PI*0.75 + Math.PI*1.5*pct); ctx.strokeStyle=color; ctx.lineWidth=6; ctx.lineCap='round'; ctx.stroke();
  }, [value, max, color]);
  return (
    <div className="adm-gauge">
      <canvas ref={canvasRef} style={{width:56,height:56}} />
      <div className="adm-gauge-label">
        <div className="adm-gauge-val" style={{color}}>{value}</div>
        <div className="adm-gauge-sub">{label}</div>
      </div>
    </div>
  );
}

export default function HospitalsView({ hospitals, onSelectHospital }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const filtered = hospitals.filter(h => {
    if (filter !== 'all' && h.status !== filter) return false;
    if (search && !h.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="adm-view">
      <div className="adm-sec-label">Registered Hospitals — Mumbai Network</div>
      <div style={{display:'flex', gap:12, marginBottom:14, flexWrap:'wrap'}}>
        <div className="adm-search-bar" style={{flex:1, minWidth:200}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--c-text3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input placeholder="Search hospitals..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="adm-filter-row">
          {['all','open','limited','critical'].map(f => (
            <div key={f} className={`adm-filter-chip ${filter===f?'active':''}`} onClick={() => setFilter(f)}>
              {f.toUpperCase()}
            </div>
          ))}
        </div>
      </div>
      <div className="adm-hosp-cards">
        {filtered.map(h => {
          const bedPct = Math.round(((h.maxBeds - h.beds) / h.maxBeds) * 100);
          const bedColor = bedPct > 80 ? '#ff3366' : bedPct > 50 ? '#ffaa00' : '#00ff9d';
          const icuPct = h.maxIcu > 0 ? Math.round(((h.maxIcu - h.icu) / h.maxIcu) * 100) : 100;
          const icuColor = icuPct > 80 ? '#ff3366' : icuPct > 50 ? '#ffaa00' : '#00a8ff';
          const badge = {open:'adm-badge-open', limited:'adm-badge-limited', critical:'adm-badge-critical'}[h.status];
          return (
            <div key={h.id} className="adm-hosp-card" onClick={() => onSelectHospital?.(h)}>
              <div className="adm-bar-top" style={{background:`linear-gradient(90deg,transparent,${bedColor},transparent)`}} />
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8}}>
                <div>
                  <div style={{fontWeight:700, fontSize:14, color:'var(--c-text)', letterSpacing:0.3}}>{h.name}</div>
                  <div style={{fontSize:10, color:'var(--c-text3)', fontFamily:'var(--f-mono)', marginTop:3}}>{h.loc}</div>
                </div>
                <span className={`adm-badge ${badge}`}><span className="adm-badge-dot" />{h.status.toUpperCase()}</span>
              </div>
              <div className="adm-gauge-wrap">
                <Gauge value={h.beds} max={h.maxBeds} color={bedColor} label="BEDS" />
                <Gauge value={h.icu} max={h.maxIcu} color={icuColor} label="ICU" />
                <div style={{flex:1, display:'flex', flexDirection:'column', justifyContent:'center', gap:6}}>
                  <div style={{fontSize:10, color:'var(--c-text3)', fontFamily:'var(--f-mono)'}}>⭐ {h.rating}</div>
                  <div style={{fontSize:10, color:'var(--c-text3)', fontFamily:'var(--f-mono)'}}>🚑 {h.ambulances} units</div>
                  <div style={{fontSize:10, color:'var(--c-text3)', fontFamily:'var(--f-mono)'}}>📞 {h.phone}</div>
                </div>
              </div>
              <div style={{display:'flex', gap:4, flexWrap:'wrap', marginTop:12}}>
                {h.dept.slice(0,3).map(d => <span key={d} style={{fontSize:9, padding:'2px 7px', borderRadius:4, background:'rgba(0,168,255,0.08)', border:'1px solid rgba(0,168,255,0.15)', color:'var(--c-text3)', fontFamily:'var(--f-mono)'}}>{d}</span>)}
                {h.dept.length > 3 && <span style={{fontSize:9, padding:'2px 7px', color:'var(--c-text3)', fontFamily:'var(--f-mono)'}}>+{h.dept.length-3}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
