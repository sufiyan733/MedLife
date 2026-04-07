'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useCountUp } from './hooks';
import { HOSPITALS as INIT_H, ALERT_POOL, CHART_LABELS, CHART_ACTUAL, CHART_PREDICTED, genPatient, PATIENTS } from './data';

function StatCard({ label, value, suffix, color, icon, sub, subColor, delay }) {
  const count = useCountUp(value, 900, delay);
  const prev = useRef(value);
  const [flash, setFlash] = useState(false);
  useEffect(() => { if (prev.current !== value) { setFlash(true); const t = setTimeout(() => setFlash(false), 600); prev.current = value; return () => clearTimeout(t); } }, [value]);
  const C = { blue:{v:'#00a8ff',g:'rgba(0,168,255,0.25)',bg:'rgba(0,168,255,0.08)',bar:'rgba(0,168,255,0.18)'}, green:{v:'#00ff9d',g:'rgba(0,255,157,0.2)',bg:'rgba(0,255,157,0.07)',bar:'rgba(0,255,157,0.18)'}, amber:{v:'#ffaa00',g:'rgba(255,170,0,0.2)',bg:'rgba(255,170,0,0.07)',bar:'rgba(255,170,0,0.18)'}, purple:{v:'#9b6dff',g:'rgba(123,47,255,0.25)',bg:'rgba(123,47,255,0.08)',bar:'rgba(123,47,255,0.18)'}, cyan:{v:'#00e5ff',g:'rgba(0,229,255,0.2)',bg:'rgba(0,229,255,0.07)',bar:'rgba(0,229,255,0.18)'} }[color];
  return (
    <div className="adm-stat-card" style={{'--card-glow':C.g,'--card-bar':C.bar, outline:flash?`1px solid ${C.v}`:'1px solid transparent', transition:'outline 0.3s ease, transform 0.25s, border-color 0.25s, box-shadow 0.25s'}}>
      <div className="adm-bar-top" style={{background:`linear-gradient(90deg,transparent,${C.v},transparent)`}} />
      <div className="adm-icon-box" style={{background:C.bg}}>{icon}</div>
      <div className="adm-stat-label">{label}</div>
      <div className="adm-stat-value" style={{fontSize:value>9999?26:34, color:C.v, textShadow:`0 0 24px ${C.g}`}}>
        {count.toLocaleString()}{suffix && <span style={{fontSize:18}}>{suffix}</span>}
      </div>
      <div className="adm-stat-sub">
        <span style={{color:subColor==='up'?'#00ff9d':'#ff3366', fontFamily:'var(--f-mono)', fontSize:10}}>{sub.arrow}</span>
        {sub.text}
      </div>
    </div>
  );
}

function HospitalRow({ h, onClick }) {
  const pct = Math.round(((h.maxBeds - h.beds) / h.maxBeds) * 100);
  const barColor = pct > 80 ? '#ff3366' : pct > 50 ? '#ffaa00' : '#00ff9d';
  const bedColor = h.beds < 20 ? '#ff3366' : h.beds < 80 ? '#ffaa00' : 'var(--c-text)';
  const icuColor = h.icu === 0 ? '#ff3366' : h.icu < 5 ? '#ffaa00' : 'var(--c-text)';
  const badge = { open:'adm-badge-open', limited:'adm-badge-limited', critical:'adm-badge-critical' }[h.status];
  return (
    <tr className="adm-hosp-row" onClick={() => onClick?.(h)}>
      <td><div style={{fontWeight:600, fontSize:13, color:'var(--c-text)', letterSpacing:0.3}}>{h.name}</div><div style={{fontSize:10, color:'var(--c-text3)', fontFamily:'var(--f-mono)', marginTop:2}}>{h.loc}</div></td>
      <td><div style={{fontSize:13, fontWeight:600, color:bedColor}}>{h.beds}</div><div style={{height:3, borderRadius:2, background:'rgba(255,255,255,0.07)', overflow:'hidden', marginTop:5, width:80}}><div style={{height:'100%', borderRadius:2, width:`${100-pct}%`, background:barColor, transition:'width 0.6s ease'}} /></div></td>
      <td><span style={{fontSize:13, fontWeight:600, color:icuColor}}>{h.icu}</span><span style={{fontSize:10, color:'var(--c-text3)'}}> / {h.maxIcu}</span></td>
      <td><span className={`adm-badge ${badge}`}><span className="adm-badge-dot" />{h.status.toUpperCase()}</span></td>
    </tr>
  );
}

function AlertItem({ a }) {
  const color = a.type === 'red' ? '#ff3366' : '#ffaa00';
  return (
    <div className={`adm-alert-item adm-alert-${a.type}`}>
      <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:4}}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <span style={{fontSize:12, fontWeight:600, color:'var(--c-text)', flex:1}}>{a.hospital}</span>
        <span style={{fontSize:9, color:'var(--c-text3)', fontFamily:'var(--f-mono)'}}>{a.time}</span>
      </div>
      <div style={{fontSize:11, color:'var(--c-text2)', lineHeight:1.5}}>{a.msg}</div>
    </div>
  );
}

function FeedItem({ p }) {
  const sc = { high:'adm-sev-high', med:'adm-sev-med', low:'adm-sev-low' }[p.sev];
  return (
    <div className="adm-feed-item">
      <div className={`adm-sev-badge ${sc}`}>{p.sev.toUpperCase()}</div>
      <div><div style={{fontSize:12, fontWeight:600, color:'var(--c-text)', marginBottom:2}}>{p.name}</div><div style={{fontSize:10, color:'var(--c-text3)', fontFamily:'var(--f-mono)'}}>→ {p.dest}</div></div>
      <div style={{textAlign:'right'}}><div style={{fontSize:9, color:'var(--c-text3)', fontFamily:'var(--f-mono)'}}>{p.time}</div><div style={{fontSize:10, color:'var(--c-blue)', marginTop:2}}>ETA {p.eta}</div></div>
    </div>
  );
}

function MiniChart({ actualData, predictedData }) {
  const canvasRef = useRef(null), chartRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    import('chart.js').then(({ Chart, registerables }) => {
      Chart.register(...registerables);
      if (chartRef.current) chartRef.current.destroy();
      chartRef.current = new Chart(canvasRef.current, {
        type:'line', data:{ labels:CHART_LABELS, datasets:[
          { label:'Actual', data:actualData, borderColor:'#00a8ff', backgroundColor:'rgba(0,168,255,0.07)', tension:0.45, fill:true, borderWidth:2, pointRadius:3, pointBackgroundColor:'#00a8ff' },
          { label:'AI Forecast', data:predictedData, borderColor:'#9b6dff', backgroundColor:'rgba(123,47,255,0.05)', tension:0.45, fill:true, borderWidth:2, borderDash:[4,3], pointRadius:3, pointBackgroundColor:'#9b6dff' },
        ]}, options:{ responsive:true, maintainAspectRatio:false, animation:{duration:600, easing:'easeInOutQuart'},
          plugins:{legend:{display:false}, tooltip:{backgroundColor:'rgba(4,12,28,0.97)', borderColor:'rgba(0,168,255,0.25)', borderWidth:1, titleColor:'#e8f4ff', bodyColor:'#8ab4d4', padding:10}},
          scales:{x:{ticks:{color:'#4a7a9b', font:{size:9}, maxRotation:0}, grid:{color:'rgba(0,168,255,0.04)'}, border:{color:'rgba(0,168,255,0.08)'}}, y:{min:40, max:100, ticks:{color:'#4a7a9b', font:{size:9}, callback:v=>`${v}%`}, grid:{color:'rgba(0,168,255,0.04)'}, border:{color:'rgba(0,168,255,0.08)'}}}
        }
      });
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, []);
  useEffect(() => { if (!chartRef.current) return; chartRef.current.data.datasets[0].data = actualData; chartRef.current.data.datasets[1].data = predictedData; chartRef.current.update('active'); }, [actualData, predictedData]);
  return <div style={{position:'relative', height:180}}><canvas ref={canvasRef} /></div>;
}

export default function DashboardView({ hospitals, showToast, onSelectHospital }) {
  const [feed, setFeed] = useState(PATIENTS.slice(0, 6));
  const [alerts, setAlerts] = useState(() => ALERT_POOL.slice(0,3).map((a,i) => ({...a, id:i+1, time:`${(i+1)*3} min ago`})));
  const [availBeds, setAvailBeds] = useState(284719);
  const [icuPct, setIcuPct] = useState(71);
  const [readinessPct, setReadinessPct] = useState(88);
  const [bedsDelta, setBedsDelta] = useState(-2847);
  const [icuDelta, setIcuDelta] = useState('+8%');
  const [readinessDelta, setReadinessDelta] = useState('+3%');
  const [chartActual, setChartActual] = useState(CHART_ACTUAL);
  const [chartPredicted, setChartPredicted] = useState(CHART_PREDICTED);
  const feedRef = useRef(null);

  // Live hospital simulation
  useEffect(() => {
    const id = setInterval(() => {
      const totalFree = hospitals.reduce((s,h) => s+h.beds, 0);
      const ratio = totalFree / hospitals.reduce((s,h) => s+h.maxBeds, 0);
      setAvailBeds(p => { const t = Math.round(284000 + (ratio-0.45)*8000 + (Math.random()-0.5)*300); setBedsDelta(t-p); return t; });
      const icuUsed = hospitals.reduce((s,h) => s+(h.maxIcu-h.icu), 0);
      const icuTotal = hospitals.reduce((s,h) => s+h.maxIcu, 0);
      const newIcu = Math.round((icuUsed/icuTotal)*100);
      setIcuPct(p => { setIcuDelta(`${newIcu>=p?'+':''}${newIcu-p}%`); return newIcu; });
    }, 3000);
    return () => clearInterval(id);
  }, [hospitals]);

  useEffect(() => { const id = setInterval(() => { setReadinessPct(p => { const n = Math.max(72,Math.min(98,p+Math.round((Math.random()-0.48)*3))); setReadinessDelta(`${n>=p?'+':''}${n-p}%`); return n; }); }, 8000); return () => clearInterval(id); }, []);

  // Feed
  useEffect(() => {
    const tick = () => { setFeed(p => { const aged = p.map((x,i) => ({...x, time:`${[2,5,8,12,17,22][Math.min(i+1,5)]}m ago`})); return [genPatient(),...aged].slice(0,6); }); feedRef.current = setTimeout(tick, 4000+Math.random()*3000); };
    feedRef.current = setTimeout(tick, 4000);
    return () => clearTimeout(feedRef.current);
  }, []);

  // Alerts
  useEffect(() => {
    const id = setInterval(() => { setAlerts(p => { const pool = ALERT_POOL.filter(a => !p.find(x => x.hospital===a.hospital && x.msg===a.msg)); if(!pool.length) return p; return [{...pool[Math.floor(Math.random()*pool.length)], id:Date.now(), time:'just now'},...p.slice(0,2)]; }); }, 15000);
    return () => clearInterval(id);
  }, []);

  // Chart
  useEffect(() => {
    const id = setInterval(() => {
      setChartActual(p => { const ex = p.filter(v=>v!==null); const last = ex[ex.length-1]??70; const n = Math.max(45,Math.min(97,last+Math.round((Math.random()-0.4)*5))); const s = [...p.slice(1),null]; s[6]=n; return s; });
      setChartPredicted(p => { const nv = chartActual[6]??71; return [null,null,null,null,null,null,nv, Math.min(99,nv+3), Math.min(99,nv+7), Math.min(99,nv+11), Math.min(99,nv+15)]; });
    }, 20000);
    return () => clearInterval(id);
  }, []);

  const I = (d, c='currentColor') => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" dangerouslySetInnerHTML={{__html:d}} />;

  return (
    <div className="adm-view">
      {/* Stats */}
      <div>
        <div className="adm-sec-label">System Overview — India Network · Live</div>
        <div className="adm-stats-grid">
          <StatCard label="Total Hospitals" value={9251} color="blue" delay={100} icon={I('<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>','#00a8ff')} sub={{arrow:'+38',text:'new this month'}} subColor="up" />
          <StatCard label="Available Beds" value={availBeds} color="green" delay={250} icon={I('<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>','#00ff9d')} sub={{arrow:bedsDelta>0?`+${bedsDelta.toLocaleString()}`:bedsDelta.toLocaleString(),text:'vs last update'}} subColor={bedsDelta>=0?'up':'down'} />
          <StatCard label="ICU Capacity" value={icuPct} suffix="%" color="amber" delay={400} icon={I('<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>','#ffaa00')} sub={{arrow:icuDelta,text:'utilization change'}} subColor={icuDelta.startsWith('+')?'down':'up'} />
          <StatCard label="Emergency Readiness" value={readinessPct} suffix="%" color="purple" delay={550} icon={I('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>','#9b6dff')} sub={{arrow:readinessDelta,text:'network readiness'}} subColor={readinessDelta.startsWith('+')?'up':'down'} />
        </div>
      </div>

      {/* Mid grid */}
      <div className="adm-mid-grid">
        <div className="adm-panel">
          <div className="adm-panel-head">
            {I('<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><line x1="9" y1="22" x2="9" y2="12"/><line x1="15" y1="22" x2="15" y2="12"/>','#8ab4d4')}
            <span className="adm-panel-title">Hospital Status Matrix</span>
            <div className="adm-panel-live green"><div className="adm-live-dot-sm" />LIVE</div>
          </div>
          <table className="adm-hosp-table">
            <thead><tr><th>Hospital</th><th>Beds Free</th><th>ICU</th><th>Status</th></tr></thead>
            <tbody>{hospitals.map(h => <HospitalRow key={h.id} h={h} onClick={onSelectHospital} />)}</tbody>
          </table>
        </div>
        <div className="adm-right-col">
          <div className="adm-panel">
            <div className="adm-panel-head">
              {I('<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>','#ff3366')}
              <span className="adm-panel-title">Critical Alerts</span>
              <div className="adm-panel-live red"><div className="adm-live-dot-sm" />URGENT</div>
            </div>
            <div style={{padding:12}}>{alerts.map(a => <AlertItem key={a.id} a={a} />)}</div>
          </div>
        </div>
      </div>

      {/* Bottom grid */}
      <div className="adm-bottom-grid">
        <div className="adm-panel">
          <div className="adm-panel-head">
            {I('<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>','#00a8ff')}
            <span className="adm-panel-title">Predictive Load Forecast</span>
            <div className="adm-panel-live purple"><div className="adm-live-dot-sm" />AI MODEL</div>
          </div>
          <div style={{padding:'14px 16px'}}>
            <div className="adm-chart-legend">
              <div className="adm-legend-item"><div className="adm-legend-swatch" style={{background:'#00a8ff'}} />Actual Load</div>
              <div className="adm-legend-item"><div className="adm-legend-swatch" style={{background:'#9b6dff'}} />AI Forecast</div>
            </div>
            <MiniChart actualData={chartActual} predictedData={chartPredicted} />
          </div>
        </div>
        <div className="adm-panel">
          <div className="adm-panel-head">
            {I('<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07"/>','#8ab4d4')}
            <span className="adm-panel-title">Incoming Emergency Feed</span>
            <div className="adm-panel-live green"><div className="adm-live-dot-sm" />LIVE</div>
          </div>
          <div style={{padding:'10px 14px'}}><div className="adm-feed-list">{feed.map(p => <FeedItem key={p.id} p={p} />)}</div></div>
        </div>
        <div className="adm-panel">
          <div className="adm-panel-head">
            {I('<circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 19.07a10 10 0 010-14.14"/>','#8ab4d4')}
            <span className="adm-panel-title">Quick Actions</span>
          </div>
          <div style={{padding:12}}>
            {[
              {cls:'blue', emoji:'🏥', title:'Mark as Full', sub:'Lock bed intake', fn:()=>showToast('Hospital marked full','Updating bed availability across network...')},
              {cls:'red', emoji:'🚨', title:'Emergency Mode', sub:'Activate protocol', fn:()=>showToast('🚨 EMERGENCY MODE','All protocols engaged. Notifying hospitals.')},
              {cls:'amber', emoji:'🔀', title:'Redirect Patients', sub:'Auto-route active', fn:()=>showToast('Redirect initiated','Routing to nearest available hospitals...')},
              {cls:'purple', emoji:'🤖', title:'Run AI Analysis', sub:'Predict next 4 hrs', fn:()=>showToast('AI Analysis running','Generating predictive capacity report...')},
            ].map(({cls,emoji,title,sub,fn}) => (
              <div key={title} className={`adm-action-btn ${cls}`} onClick={fn}>
                <div className="adm-action-btn-icon">{emoji}</div>
                <div><div className="adm-btn-title">{title}</div><div className="adm-btn-sub">{sub}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
