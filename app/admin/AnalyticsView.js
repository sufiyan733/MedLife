'use client';
import { useEffect, useRef } from 'react';
import { DEPT_STATS, DAILY_TRENDS } from './data';

function DeptDonut() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'), s = 2;
    c.width = 160 * s; c.height = 160 * s;
    const cx = c.width / 2, cy = c.height / 2, r = 60 * s, w = 18 * s;
    const total = DEPT_STATS.reduce((s, d) => s + d.count, 0);
    let angle = -Math.PI / 2;
    DEPT_STATS.forEach(d => {
      const sweep = (d.count / total) * Math.PI * 2;
      ctx.beginPath(); ctx.arc(cx, cy, r, angle, angle + sweep);
      ctx.strokeStyle = d.color; ctx.lineWidth = w; ctx.lineCap = 'butt'; ctx.stroke();
      angle += sweep;
    });
    // Center text
    ctx.fillStyle = '#e4f1ff'; ctx.font = `bold ${22 * s}px Rajdhani`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(total.toString(), cx, cy - 6 * s);
    ctx.fillStyle = '#3d6e8a'; ctx.font = `${8 * s}px "Share Tech Mono"`;
    ctx.fillText('TOTAL APPTS', cx, cy + 12 * s);
  }, []);
  return <canvas ref={canvasRef} style={{ width: 160, height: 160 }} />;
}

function TrendChart() {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    import('chart.js').then(({ Chart, registerables }) => {
      Chart.register(...registerables);
      new Chart(canvasRef.current, {
        type: 'bar',
        data: {
          labels: DAILY_TRENDS.map(d => d.day),
          datasets: [
            { label: 'Appointments', data: DAILY_TRENDS.map(d => d.appts), backgroundColor: 'rgba(0,168,255,0.6)', borderRadius: 4, barPercentage: 0.6 },
            { label: 'Beds Used', data: DAILY_TRENDS.map(d => d.beds), backgroundColor: 'rgba(155,109,255,0.4)', borderRadius: 4, barPercentage: 0.6 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#4a7a9b', font: { size: 10 } } } },
          scales: {
            x: { ticks: { color: '#4a7a9b', font: { size: 10 } }, grid: { color: 'rgba(0,168,255,0.04)' } },
            y: { ticks: { color: '#4a7a9b', font: { size: 10 } }, grid: { color: 'rgba(0,168,255,0.04)' } },
          },
        },
      });
    });
  }, []);
  return <div style={{ height: 220 }}><canvas ref={canvasRef} /></div>;
}

function HospitalRanking({ hospitals }) {
  const sorted = [...hospitals].sort((a, b) => (b.maxBeds - b.beds) - (a.maxBeds - a.beds));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {sorted.slice(0, 7).map((h, i) => {
        const used = h.maxBeds - h.beds;
        const pct = Math.round((used / h.maxBeds) * 100);
        const color = pct > 80 ? '#ff3366' : pct > 50 ? '#ffaa00' : '#00ff9d';
        return (
          <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--c-text3)', width: 16 }}>#{i + 1}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600 }}>{h.name}</span>
                <span style={{ fontSize: 10, fontFamily: 'var(--f-mono)', color }}>{pct}%</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${color},${color}88)`, borderRadius: 2, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsView({ hospitals }) {
  return (
    <div className="adm-view">
      <div className="adm-sec-label">Analytics & Insights — 7 Day Overview</div>
      <div className="adm-analytics-grid">
        {/* Department Distribution */}
        <div className="adm-panel">
          <div className="adm-panel-head">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8ab4d4" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path d="M9 12l2 2 4-4" /></svg>
            <span className="adm-panel-title">Department Distribution</span>
          </div>
          <div className="adm-ring-chart">
            <DeptDonut />
            <div className="adm-ring-legend">
              {DEPT_STATS.map(d => (
                <div key={d.name} className="adm-ring-legend-item">
                  <div className="adm-ring-legend-dot" style={{ background: d.color }} />
                  <span style={{ color: 'var(--c-text2)', fontSize: 11 }}>{d.name}</span>
                  <span style={{ color: 'var(--c-text3)', fontFamily: 'var(--f-mono)', fontSize: 10, marginLeft: 'auto' }}>{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hospital Utilization Ranking */}
        <div className="adm-panel">
          <div className="adm-panel-head">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8ab4d4" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
            <span className="adm-panel-title">Bed Utilization Ranking</span>
          </div>
          <div style={{ padding: '16px 18px' }}>
            <HospitalRanking hospitals={hospitals} />
          </div>
        </div>

        {/* Weekly Trends */}
        <div className="adm-panel adm-analytics-full">
          <div className="adm-panel-head">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8ab4d4" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            <span className="adm-panel-title">Weekly Appointment & Bed Trends</span>
            <div className="adm-panel-live blue"><div className="adm-live-dot-sm" />7-DAY</div>
          </div>
          <div style={{ padding: '14px 18px' }}>
            <TrendChart />
          </div>
        </div>

        {/* Key Metrics */}
        <div className="adm-panel">
          <div className="adm-panel-head">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8ab4d4" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /></svg>
            <span className="adm-panel-title">Key Metrics</span>
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Avg. Wait Time', value: '23 min', change: '-12%', up: true },
              { label: 'Patient Satisfaction', value: '4.6/5', change: '+0.3', up: true },
              { label: 'Bed Turnover Rate', value: '2.8/day', change: '+8%', up: true },
              { label: 'Emergency Response', value: '8.2 min', change: '-18%', up: true },
              { label: 'Ambulance Dispatch', value: '4.1 min', change: '-5%', up: true },
            ].map(m => (
              <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(0,168,255,0.05)' }}>
                <span style={{ fontSize: 12, color: 'var(--c-text2)' }}>{m.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--f-display)', fontSize: 16, fontWeight: 700, color: 'var(--c-text)' }}>{m.value}</span>
                  <span style={{ fontSize: 10, fontFamily: 'var(--f-mono)', color: m.up ? '#00ff9d' : '#ff3366' }}>{m.change}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="adm-panel">
          <div className="adm-panel-head">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00ff9d" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
            <span className="adm-panel-title">System Health</span>
            <div className="adm-panel-live green"><div className="adm-live-dot-sm" />ALL OK</div>
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'API Uptime', value: '99.97%', color: '#00ff9d' },
              { label: 'Database Latency', value: '12ms', color: '#00ff9d' },
              { label: 'WebSocket Connections', value: '847', color: '#00a8ff' },
              { label: 'Data Sync Status', value: 'Real-time', color: '#00ff9d' },
              { label: 'Last Backup', value: '2 min ago', color: '#00a8ff' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
                  <span style={{ fontSize: 12, color: 'var(--c-text2)' }}>{s.label}</span>
                </div>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
