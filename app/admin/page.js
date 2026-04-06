'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ─── DATA ────────────────────────────────────────────────────────────────────

const INITIAL_HOSPITALS = [
  { id: 1, name: 'Apollo Hospitals', loc: 'Bandra, Mumbai', beds: 284, maxBeds: 500, icu: 12, maxIcu: 40, status: 'open' },
  { id: 2, name: 'Kokilaben Hospital', loc: 'Andheri West, Mumbai', beds: 67, maxBeds: 400, icu: 3, maxIcu: 30, status: 'limited' },
  { id: 3, name: 'Lilavati Hospital', loc: 'Bandra, Mumbai', beds: 142, maxBeds: 350, icu: 18, maxIcu: 35, status: 'open' },
  { id: 4, name: 'Nanavati Hospital', loc: 'Vile Parle, Mumbai', beds: 12, maxBeds: 300, icu: 0, maxIcu: 25, status: 'critical' },
  { id: 5, name: 'Breach Candy Hospital', loc: 'Breach Candy, Mumbai', beds: 5, maxBeds: 200, icu: 1, maxIcu: 20, status: 'critical' },
  { id: 6, name: 'Hinduja Hospital', loc: 'Mahim, Mumbai', beds: 89, maxBeds: 320, icu: 9, maxIcu: 28, status: 'open' },
  { id: 7, name: 'Wockhardt Hospital', loc: 'South Mumbai', beds: 34, maxBeds: 280, icu: 4, maxIcu: 22, status: 'limited' },
];

// Fetch real hospital data from DB on mount — merge with simulation
async function fetchRealHospitals() {
  try {
    const res = await fetch('/api/hospitals/register');
    // If no custom endpoint for listing, we use setup data + keep simulation
    return null;
  } catch { return null; }
}

// Fetch real appointment stats
async function fetchAppointmentStats() {
  try {
    const res = await fetch('/api/appointments');
    const data = await res.json();
    return data.appointments?.length || 0;
  } catch { return 0; }
}

const ALL_PATIENTS = [
  { id: 1, name: 'Rahul M., 54M', sev: 'high', dest: 'Apollo Hospitals', time: '2m ago', eta: '8 min' },
  { id: 2, name: 'Priya S., 28F', sev: 'med', dest: 'Lilavati Hospital', time: '4m ago', eta: '12 min' },
  { id: 3, name: 'Kiran D., 71M', sev: 'high', dest: 'Kokilaben Hospital', time: '6m ago', eta: '15 min' },
  { id: 4, name: 'Meera T., 45F', sev: 'low', dest: 'Hinduja Hospital', time: '9m ago', eta: '19 min' },
  { id: 5, name: 'Arun P., 38M', sev: 'med', dest: 'Nanavati Hospital', time: '11m ago', eta: '6 min' },
  { id: 6, name: 'Sunita R., 62F', sev: 'high', dest: 'Apollo Hospitals', time: '14m ago', eta: '22 min' },
  { id: 7, name: 'Dev K., 33M', sev: 'low', dest: 'Wockhardt Hospital', time: '17m ago', eta: '9 min' },
  { id: 8, name: 'Anita V., 48F', sev: 'med', dest: 'Breach Candy Hospital', time: '20m ago', eta: '5 min' },
];

const ALERT_POOL = [
  { hospital: 'Nanavati Hospital', msg: '0 ICU beds remaining. Diverting critical cases.', type: 'red' },
  { hospital: 'Breach Candy Hospital', msg: 'Only 5 beds available. Emergency overflow required.', type: 'red' },
  { hospital: 'Wockhardt Hospital', msg: 'ICU at 82% capacity. Escalation recommended.', type: 'amber' },
  { hospital: 'Kokilaben Hospital', msg: 'Trauma bay at full capacity. Incoming diverted.', type: 'red' },
  { hospital: 'Apollo Hospitals', msg: 'Surge protocol active. Requesting 20 additional staff.', type: 'amber' },
  { hospital: 'Lilavati Hospital', msg: 'Power unit B on backup generator. Monitoring.', type: 'amber' },
  { hospital: 'Hinduja Hospital', msg: '3 ICU beds remaining. Critical intake paused.', type: 'red' },
  { hospital: 'Nanavati Hospital', msg: 'Blood bank stock critically low. Requesting transfer.', type: 'red' },
  { hospital: 'Wockhardt Hospital', msg: 'Ambulance queue at 7. ETA delays expected.', type: 'amber' },
  { hospital: 'Breach Candy Hospital', msg: 'Ventilator shortage reported. 2 units needed urgently.', type: 'red' },
];

const PATIENT_FIRST = ['Rahul', 'Priya', 'Kiran', 'Meera', 'Arun', 'Sunita', 'Dev', 'Anita', 'Rohit', 'Neha', 'Vikram', 'Sanjana', 'Amit', 'Pooja', 'Rajesh', 'Kavya', 'Suresh', 'Divya', 'Manish', 'Asha'];
const PATIENT_LAST = ['M.', 'S.', 'D.', 'T.', 'P.', 'R.', 'K.', 'V.', 'G.', 'B.'];
const GENDERS = ['M', 'F'];
const DESTINATIONS = ['Apollo Hospitals', 'Kokilaben Hospital', 'Lilavati Hospital', 'Hinduja Hospital', 'Wockhardt Hospital', 'Nanavati Hospital', 'Breach Candy Hospital'];
const SEVERITIES = ['high', 'high', 'med', 'med', 'med', 'low'];
const ETAS = ['4 min', '6 min', '8 min', '11 min', '14 min', '18 min', '22 min', '26 min'];

let _patientId = 100;
function genPatient() {
  const first = PATIENT_FIRST[Math.floor(Math.random() * PATIENT_FIRST.length)];
  const last = PATIENT_LAST[Math.floor(Math.random() * PATIENT_LAST.length)];
  const age = 18 + Math.floor(Math.random() * 62);
  const gen = GENDERS[Math.floor(Math.random() * 2)];
  return {
    id: ++_patientId,
    name: `${first} ${last}, ${age}${gen}`,
    sev: SEVERITIES[Math.floor(Math.random() * SEVERITIES.length)],
    dest: DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)],
    time: 'just now',
    eta: ETAS[Math.floor(Math.random() * ETAS.length)],
  };
}

const CHART_LABELS = ['6h', '5h', '4h', '3h', '2h', '1h', 'Now', '+1h', '+2h', '+3h', '+4h'];
const CHART_ACTUAL = [52, 55, 58, 61, 63, 67, 71, null, null, null, null];
const CHART_PREDICTED = [null, null, null, null, null, null, 71, 74, 78, 82, 86];

const NAV_ITEMS = [
  { label: 'Dashboard', active: true, badge: null },
  { label: 'Hospitals', active: false, badge: null },
  { label: 'Analytics', active: false, badge: null },
  { label: 'Emergency Feed', active: false, badge: '3' },
  { label: 'Network Status', active: false, badge: null },
  { label: 'Security', active: false, badge: null },
];

// ─── HOOKS ───────────────────────────────────────────────────────────────────

function useCountUp(target, duration = 900, delay = 0) {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const run = () => {
      const from = fromRef.current;
      const start = performance.now();
      const tick = (now) => {
        const prog = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - prog, 3);
        const cur = Math.round(from + (target - from) * ease);
        setValue(cur);
        if (prog < 1) { rafRef.current = requestAnimationFrame(tick); }
        else { fromRef.current = target; }
      };
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    const t = setTimeout(run, delay);
    return () => { clearTimeout(t); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration, delay]);

  return value;
}

function useLiveClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      setTime(`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} IST`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function Toast({ toast }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: 'rgba(5,14,32,0.97)', border: '1px solid rgba(0,168,255,0.35)',
      borderRadius: 10, padding: '12px 16px', maxWidth: 270,
      boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
      transform: toast.visible ? 'translateY(0)' : 'translateY(16px)',
      opacity: toast.visible ? 1 : 0,
      transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
      pointerEvents: toast.visible ? 'auto' : 'none',
    }}>
      <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--c-blue)', marginBottom: 4, fontFamily: 'var(--f-display)' }}>
        {toast.title}
      </div>
      <div style={{ fontSize: 11, color: 'var(--c-text2)', lineHeight: 1.5 }}>{toast.msg}</div>
    </div>
  );
}

function StatCard({ label, value, suffix, color, icon, sub, subColor, delay }) {
  const count = useCountUp(value, 900, delay);
  const prevRef = useRef(value);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (prevRef.current !== value) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 600);
      prevRef.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);

  const colors = {
    blue: { val: '#00a8ff', glow: 'rgba(0,168,255,0.25)', bg: 'rgba(0,168,255,0.08)', bar: 'rgba(0,168,255,0.18)' },
    green: { val: '#00ff9d', glow: 'rgba(0,255,157,0.2)', bg: 'rgba(0,255,157,0.07)', bar: 'rgba(0,255,157,0.18)' },
    amber: { val: '#ffaa00', glow: 'rgba(255,170,0,0.2)', bg: 'rgba(255,170,0,0.07)', bar: 'rgba(255,170,0,0.18)' },
    purple: { val: '#9b6dff', glow: 'rgba(123,47,255,0.25)', bg: 'rgba(123,47,255,0.08)', bar: 'rgba(123,47,255,0.18)' },
  };
  const c = colors[color];
  return (
    <div className="stat-card" style={{
      '--card-glow': c.glow, '--card-bar': c.bar,
      outline: flash ? `1px solid ${c.val}` : '1px solid transparent',
      transition: 'outline 0.3s ease, transform 0.22s, border-color 0.22s, box-shadow 0.22s',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${c.val},transparent)` }} />
      <div style={{ position: 'absolute', top: 12, right: 14, width: 32, height: 32, borderRadius: 8, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.8 }}>
        {icon}
      </div>
      <div style={{ fontSize: 10, color: 'var(--c-text3)', fontFamily: 'var(--f-mono)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: 'var(--f-display)', fontSize: value > 9999 ? 26 : 34, fontWeight: 700, lineHeight: 1, color: c.val, textShadow: `0 0 24px ${c.glow}`, marginBottom: 8 }}>
        {count.toLocaleString()}{suffix && <span style={{ fontSize: 18 }}>{suffix}</span>}
      </div>
      <div style={{ fontSize: 11, color: 'var(--c-text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ color: subColor === 'up' ? '#00ff9d' : '#ff3366', fontFamily: 'var(--f-mono)', fontSize: 10 }}>{sub.arrow}</span>
        {sub.text}
      </div>
    </div>
  );
}

function HospitalRow({ h }) {
  const pct = Math.round(((h.maxBeds - h.beds) / h.maxBeds) * 100);
  const icuPct = h.maxIcu > 0 ? Math.round(((h.maxIcu - h.icu) / h.maxIcu) * 100) : 100;
  const barColor = pct > 80 ? '#ff3366' : pct > 50 ? '#ffaa00' : '#00ff9d';
  const bedColor = h.beds < 20 ? '#ff3366' : h.beds < 80 ? '#ffaa00' : 'var(--c-text)';
  const icuColor = h.icu === 0 ? '#ff3366' : h.icu < 5 ? '#ffaa00' : 'var(--c-text)';
  const badge = { open: 'badge-open', limited: 'badge-limited', critical: 'badge-critical' }[h.status];

  return (
    <tr className="hosp-row">
      <td style={{ padding: '11px 14px' }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--c-text)', letterSpacing: 0.3 }}>{h.name}</div>
        <div style={{ fontSize: 10, color: 'var(--c-text3)', fontFamily: 'var(--f-mono)', marginTop: 2 }}>{h.loc}</div>
      </td>
      <td style={{ padding: '11px 14px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: bedColor }}>{h.beds}</div>
        <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginTop: 5, width: 80 }}>
          <div style={{ height: '100%', borderRadius: 2, width: `${100 - pct}%`, background: barColor, transition: 'width 0.6s ease' }} />
        </div>
      </td>
      <td style={{ padding: '11px 14px' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: icuColor }}>{h.icu}</span>
        <span style={{ fontSize: 10, color: 'var(--c-text3)' }}> / {h.maxIcu}</span>
        <div style={{ fontSize: 10, color: 'var(--c-text3)', fontFamily: 'var(--f-mono)', marginTop: 2 }}>{icuPct}% used</div>
      </td>
      <td style={{ padding: '11px 14px' }}>
        <span className={`badge ${badge}`}>
          <span className="badge-dot" />
          {h.status.toUpperCase()}
        </span>
      </td>
    </tr>
  );
}

function AlertItem({ a }) {
  const color = a.type === 'red' ? '#ff3366' : '#ffaa00';
  return (
    <div className={`alert-item alert-${a.type}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text)', flex: 1 }}>{a.hospital}</span>
        <span style={{ fontSize: 9, color: 'var(--c-text3)', fontFamily: 'var(--f-mono)' }}>{a.time}</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--c-text2)', lineHeight: 1.5 }}>{a.msg}</div>
    </div>
  );
}

function FeedItem({ p }) {
  const sevClass = { high: 'sev-high', med: 'sev-med', low: 'sev-low' }[p.sev];
  return (
    <div className="feed-item">
      <div className={`sev-badge ${sevClass}`}>{p.sev.toUpperCase()}</div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text)', marginBottom: 2 }}>{p.name}</div>
        <div style={{ fontSize: 10, color: 'var(--c-text3)', fontFamily: 'var(--f-mono)' }}>→ {p.dest}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 9, color: 'var(--c-text3)', fontFamily: 'var(--f-mono)' }}>{p.time}</div>
        <div style={{ fontSize: 10, color: 'var(--c-blue)', marginTop: 2 }}>ETA {p.eta}</div>
      </div>
    </div>
  );
}

function MiniChart({ actualData, predictedData }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    import('chart.js').then(({ Chart, registerables }) => {
      Chart.register(...registerables);
      if (chartRef.current) chartRef.current.destroy();
      chartRef.current = new Chart(canvasRef.current, {
        type: 'line',
        data: {
          labels: CHART_LABELS,
          datasets: [
            {
              label: 'Actual',
              data: actualData,
              borderColor: '#00a8ff',
              backgroundColor: 'rgba(0,168,255,0.07)',
              tension: 0.45, fill: true, borderWidth: 2,
              pointRadius: 3, pointBackgroundColor: '#00a8ff',
            },
            {
              label: 'AI Forecast',
              data: predictedData,
              borderColor: '#9b6dff',
              backgroundColor: 'rgba(123,47,255,0.05)',
              tension: 0.45, fill: true, borderWidth: 2,
              borderDash: [4, 3],
              pointRadius: 3, pointBackgroundColor: '#9b6dff',
            },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          animation: { duration: 600, easing: 'easeInOutQuart' },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(4,12,28,0.97)',
              borderColor: 'rgba(0,168,255,0.25)', borderWidth: 1,
              titleColor: '#e8f4ff', bodyColor: '#8ab4d4', padding: 10,
            },
          },
          scales: {
            x: {
              ticks: { color: '#4a7a9b', font: { size: 9 }, maxRotation: 0 },
              grid: { color: 'rgba(0,168,255,0.04)' },
              border: { color: 'rgba(0,168,255,0.08)' },
            },
            y: {
              min: 40, max: 100,
              ticks: { color: '#4a7a9b', font: { size: 9 }, callback: (v) => `${v}%` },
              grid: { color: 'rgba(0,168,255,0.04)' },
              border: { color: 'rgba(0,168,255,0.08)' },
            },
          },
        },
      });
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live-update datasets without remounting
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.data.datasets[0].data = actualData;
    chartRef.current.data.datasets[1].data = predictedData;
    chartRef.current.update('active');
  }, [actualData, predictedData]);

  return (
    <div style={{ position: 'relative', height: 180 }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

// ─── ICONS ───────────────────────────────────────────────────────────────────

const Icons = {
  grid: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>,
  home: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
  bar: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  phone: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.22 2.18 2 2 0 012.2 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" /></svg>,
  wifi: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 010 14.14M4.93 19.07a10 10 0 010-14.14" /></svg>,
  shield: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  bolt: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
  refresh: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" /></svg>,
  layers: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00a8ff" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>,
  pulse: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00a8ff" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
  warn: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff3366" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  feed: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8ab4d4" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07" /></svg>,
};

// ─── PAGE COMPONENT ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const [hospitals, setHospitals] = useState(INITIAL_HOSPITALS);
  const [feed, setFeed] = useState(ALL_PATIENTS.slice(0, 6));
  const [alerts, setAlerts] = useState(() =>
    ALERT_POOL.slice(0, 3).map((a, i) => ({ ...a, id: i + 1, time: `${(i + 1) * 3} min ago` }))
  );
  const [toast, setToast] = useState({ visible: false, title: '', msg: '' });
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [activeNav, setActiveNav] = useState('Dashboard');

  // ── Live global stats (derived + independent)
  const [availBeds, setAvailBeds] = useState(284719);
  const [icuPct, setIcuPct] = useState(71);
  const [readinessPct, setReadinessPct] = useState(88);
  const [patientsToday, setPatientsToday] = useState(18402);
  const [bedsDelta, setBedsDelta] = useState(-2847);
  const [icuDelta, setIcuDelta] = useState('+8%');
  const [readinessDelta, setReadinessDelta] = useState('+3%');

  // ── Live chart data
  const [chartActual, setChartActual] = useState(CHART_ACTUAL);
  const [chartPredicted, setChartPredicted] = useState(CHART_PREDICTED);

  // ── Alert age ticker
  const [alertTick, setAlertTick] = useState(0);

  const clock = useLiveClock();
  const toastTimer = useRef(null);
  const feedTimerRef = useRef(null);

  const showToast = useCallback((title, msg) => {
    setToast({ visible: true, title, msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3200);
  }, []);

  // ── 1. Hospital beds + ICU — update every 3s
  useEffect(() => {
    const id = setInterval(() => {
      setHospitals((prev) => {
        const next = prev.map((h) => {
          if (Math.random() > 0.45) return h;
          const bedDelta = Math.floor(Math.random() * 8) - 3;
          const icuDelta = Math.random() > 0.6 ? (Math.random() > 0.5 ? 1 : -1) : 0;
          const beds = Math.max(0, Math.min(h.maxBeds, h.beds + bedDelta));
          const icu = Math.max(0, Math.min(h.maxIcu, h.icu + icuDelta));
          const status = beds < 15 ? 'critical' : beds < 80 ? 'limited' : 'open';
          return { ...h, beds, icu, status };
        });
        // Derive global available beds from table
        const totalFree = next.reduce((s, h) => s + h.beds, 0);
        const ratio = totalFree / next.reduce((s, h) => s + h.maxBeds, 0);
        setAvailBeds((prev) => {
          const target = Math.round(284000 + (ratio - 0.45) * 8000 + (Math.random() - 0.5) * 300);
          const d = target - prev;
          setBedsDelta(d);
          return target;
        });
        // ICU pct
        const icuUsed = next.reduce((s, h) => s + (h.maxIcu - h.icu), 0);
        const icuTotal = next.reduce((s, h) => s + h.maxIcu, 0);
        const newIcu = Math.round((icuUsed / icuTotal) * 100);
        setIcuPct((prev) => { setIcuDelta(`${newIcu >= prev ? '+' : ''}${newIcu - prev}%`); return newIcu; });
        return next;
      });
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // ── 2. Emergency readiness — drifts every 8s
  useEffect(() => {
    const id = setInterval(() => {
      setReadinessPct((prev) => {
        const next = Math.max(72, Math.min(98, prev + Math.round((Math.random() - 0.48) * 3)));
        setReadinessDelta(`${next >= prev ? '+' : ''}${next - prev}%`);
        return next;
      });
    }, 8000);
    return () => clearInterval(id);
  }, []);

  // ── 3. Patients today — ticks up every 12–18s
  useEffect(() => {
    const tick = () => {
      setPatientsToday((p) => p + Math.floor(Math.random() * 4) + 1);
      feedTimerRef.current = setTimeout(tick, 12000 + Math.random() * 6000);
    };
    feedTimerRef.current = setTimeout(tick, 12000);
    return () => clearTimeout(feedTimerRef.current);
  }, []);

  // ── 4. Emergency feed — prepend new patient every 4–7s
  useEffect(() => {
    const tick = () => {
      setFeed((prev) => {
        const aged = prev.map((p, i) => {
          const mins = [2, 5, 8, 12, 17, 22];
          return { ...p, time: `${mins[Math.min(i + 1, mins.length - 1)]}m ago` };
        });
        return [genPatient(), ...aged].slice(0, 6);
      });
      const delay = 4000 + Math.random() * 3000;
      feedTimerRef._feedId = setTimeout(tick, delay);
    };
    feedTimerRef._feedId = setTimeout(tick, 4000);
    return () => clearTimeout(feedTimerRef._feedId);
  }, []);

  // ── 5. Critical alerts — rotate every 15s, age times every 60s
  useEffect(() => {
    const rotateId = setInterval(() => {
      setAlerts((prev) => {
        const pool = ALERT_POOL.filter((a) => !prev.find((p) => p.hospital === a.hospital && p.msg === a.msg));
        if (!pool.length) return prev;
        const newAlert = { ...pool[Math.floor(Math.random() * pool.length)], id: Date.now(), time: 'just now' };
        return [newAlert, ...prev.slice(0, 2)];
      });
    }, 15000);
    const ageId = setInterval(() => setAlertTick((t) => t + 1), 60000);
    return () => { clearInterval(rotateId); clearInterval(ageId); };
  }, []);

  // Age alert timestamps
  useEffect(() => {
    if (alertTick === 0) return;
    setAlerts((prev) => prev.map((a) => {
      const m = parseInt(a.time) || 1;
      return { ...a, time: `${m + 1} min ago` };
    }));
  }, [alertTick]);

  // ── 6. Chart — shift actual left, append new point every 20s
  useEffect(() => {
    const id = setInterval(() => {
      setChartActual((prev) => {
        const existing = prev.filter((v) => v !== null);
        const last = existing[existing.length - 1] ?? 70;
        const next = Math.max(45, Math.min(97, last + Math.round((Math.random() - 0.4) * 5)));
        const shifted = [...prev.slice(1), null];
        // replace the current 'Now' slot (index 6)
        shifted[6] = next;
        return shifted;
      });
      setChartPredicted((prev) => {
        const nowVal = chartActual[6] ?? 71;
        return [null, null, null, null, null, null, nowVal,
          Math.min(99, nowVal + 3),
          Math.min(99, nowVal + 7),
          Math.min(99, nowVal + 11),
          Math.min(99, nowVal + 15),
        ];
      });
    }, 20000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEmergency = () => {
    setEmergencyMode(true);
    showToast('🚨 EMERGENCY MODE ACTIVE', 'All protocols engaged. Notifying all hospitals.');
    setTimeout(() => setEmergencyMode(false), 4000);
  };

  const criticalCount = hospitals.filter((h) => h.status === 'critical').length;

  return (
    <>
      {/* ── GLOBAL STYLES ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@300;500;600;700&family=Exo+2:wght@200;400;600;700&display=swap');

        :root {
          --c-bg:    #030c1a;
          --c-bg2:   #050f22;
          --c-panel: rgba(5,16,38,0.88);
          --c-bdr:   rgba(0,168,255,0.12);
          --c-bdr2:  rgba(0,168,255,0.28);
          --c-blue:  #00a8ff;
          --c-purple:#9b6dff;
          --c-green: #00ff9d;
          --c-red:   #ff3366;
          --c-amber: #ffaa00;
          --c-text:  #e4f1ff;
          --c-text2: #7aadcf;
          --c-text3: #3d6e8a;
          --f-main:  'Exo 2', sans-serif;
          --f-mono:  'Share Tech Mono', monospace;
          --f-display: 'Rajdhani', sans-serif;
        }

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        html, body { height: 100%; overflow: hidden; background: var(--c-bg); color: var(--c-text); font-family: var(--f-main); }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,168,255,0.18); border-radius: 2px; }

        /* Animated BG grid */
        .bg-grid {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            linear-gradient(rgba(0,168,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,168,255,0.025) 1px, transparent 1px);
          background-size: 44px 44px;
          animation: gridDrift 24s linear infinite;
        }
        @keyframes gridDrift { to { background-position: 44px 44px; } }

        .bg-orb-1 {
          position: fixed; width: 640px; height: 640px; border-radius: 50%;
          background: radial-gradient(circle, rgba(0,80,180,0.1), transparent 70%);
          top: -260px; left: -120px; pointer-events: none; z-index: 0;
          animation: orbFloat 10s ease-in-out infinite;
          filter: blur(60px);
        }
        .bg-orb-2 {
          position: fixed; width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(100,30,220,0.07), transparent 70%);
          bottom: -120px; right: -80px; pointer-events: none; z-index: 0;
          animation: orbFloat 10s ease-in-out infinite reverse;
          filter: blur(60px);
        }
        @keyframes orbFloat { 0%,100% { transform: translate(0,0); } 50% { transform: translate(18px,28px); } }

        /* Scanlines */
        .scanlines {
          position: fixed; inset: 0; pointer-events: none; z-index: 999;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.012) 2px, rgba(0,0,0,0.012) 4px);
        }

        /* Layout */
        .app { display: flex; height: 100vh; position: relative; z-index: 1; }

        /* Sidebar */
        .sidebar {
          width: 216px; flex-shrink: 0;
          background: rgba(3,9,22,0.97);
          border-right: 1px solid var(--c-bdr2);
          display: flex; flex-direction: column;
          position: relative; overflow: hidden;
        }
        .sidebar::after {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, var(--c-blue), transparent);
        }

        /* Logo */
        .logo { padding: 18px 18px 14px; border-bottom: 1px solid var(--c-bdr); }
        .logo-icon {
          width: 36px; height: 36px; border-radius: 8px;
          background: linear-gradient(135deg, #0055bb, #6020cc);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 10px; position: relative; overflow: hidden;
        }
        .logo-icon::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.12), transparent);
        }
        .logo-name { font-family: var(--f-display); font-size: 12px; font-weight: 700; letter-spacing: 1.2px; line-height: 1.3; }
        .logo-sub { font-family: var(--f-mono); font-size: 9px; color: var(--c-blue); letter-spacing: 2px; margin-top: 4px; display: flex; align-items: center; gap: 5px; }
        .live-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--c-green); flex-shrink: 0; animation: dotPulse 1.8s ease-in-out infinite; }
        @keyframes dotPulse { 0%,100% { opacity:1; box-shadow:0 0 0 0 rgba(0,255,157,0.4); } 50% { opacity:0.75; box-shadow:0 0 0 4px rgba(0,255,157,0); } }

        /* Nav */
        .nav { padding: 14px 0; flex: 1; }
        .nav-section { font-family: var(--f-mono); font-size: 8.5px; color: var(--c-text3); letter-spacing: 2px; padding: 8px 18px 4px; text-transform: uppercase; }
        .nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 18px; cursor: pointer;
          transition: all 0.18s; position: relative;
          border-left: 2px solid transparent;
          font-size: 12.5px; font-weight: 500; color: var(--c-text3);
          letter-spacing: 0.3px;
          user-select: none;
        }
        .nav-item:hover { background: rgba(0,168,255,0.05); color: var(--c-text2); border-left-color: rgba(0,168,255,0.25); }
        .nav-item.active { background: rgba(0,168,255,0.09); color: var(--c-blue); border-left-color: var(--c-blue); }
        .nav-item.active::after {
          content: ''; position: absolute; right: 0; top: 50%; transform: translateY(-50%);
          width: 3px; height: 14px; background: var(--c-blue);
          border-radius: 2px 0 0 2px; box-shadow: 0 0 8px var(--c-blue);
        }
        .nav-badge {
          margin-left: auto; background: var(--c-red); color: white;
          font-size: 9px; font-family: var(--f-mono); padding: 2px 6px;
          border-radius: 8px; font-weight: 700;
        }

        .sidebar-foot { padding: 14px 18px; border-top: 1px solid var(--c-bdr); }
        .sys-build { font-family: var(--f-mono); font-size: 9.5px; color: var(--c-text3); }
        .sys-clock { font-family: var(--f-mono); font-size: 12px; color: var(--c-blue); margin-top: 4px; letter-spacing: 1px; }

        /* Main */
        .main { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }

        /* Topbar */
        .topbar {
          height: 62px; flex-shrink: 0;
          background: rgba(3,9,22,0.92);
          border-bottom: 1px solid var(--c-bdr2);
          display: flex; align-items: center; gap: 12px;
          padding: 0 22px; position: sticky; top: 0; z-index: 100;
          backdrop-filter: blur(12px);
        }
        .topbar::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,168,255,0.22), transparent);
        }
        .page-title { font-family: var(--f-display); font-size: 17px; font-weight: 600; letter-spacing: 1px; }
        .page-title span { color: var(--c-blue); }
        .topbar-sep { flex: 1; }
        .topbar-alert {
          display: flex; align-items: center; gap: 6px;
          background: rgba(255,51,102,0.1); border: 1px solid rgba(255,51,102,0.28);
          border-radius: 6px; padding: 5px 11px;
          font-size: 11.5px; font-family: var(--f-mono); color: var(--c-red);
          cursor: pointer; transition: all 0.18s;
        }
        .topbar-alert:hover { background: rgba(255,51,102,0.18); }
        .blink-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--c-red); animation: blink 1s step-end infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .topbar-btn {
          display: flex; align-items: center; gap: 6px;
          background: rgba(0,168,255,0.07); border: 1px solid var(--c-bdr2);
          border-radius: 6px; padding: 5px 12px;
          font-size: 11.5px; color: var(--c-blue); cursor: pointer;
          transition: all 0.18s; font-family: var(--f-main); font-weight: 600;
          letter-spacing: 0.3px;
        }
        .topbar-btn:hover { background: rgba(0,168,255,0.16); box-shadow: 0 0 14px rgba(0,168,255,0.12); }
        .topbar-btn:active { transform: scale(0.97); }
        .topbar-btn.emergency { background: rgba(255,51,102,0.14); border-color: rgba(255,51,102,0.4); color: var(--c-red); box-shadow: 0 0 18px rgba(255,51,102,0.18); }

        /* Content */
        .content { padding: 18px 22px 28px; display: flex; flex-direction: column; gap: 18px; }

        /* Section label */
        .sec-label {
          font-family: var(--f-mono); font-size: 9.5px; color: var(--c-text3);
          letter-spacing: 2px; text-transform: uppercase;
          margin-bottom: 11px; display: flex; align-items: center; gap: 8px;
        }
        .sec-label::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, var(--c-bdr), transparent); }

        /* Stats grid */
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .stat-card {
          background: var(--c-panel); border: 1px solid var(--c-bdr);
          border-radius: 10px; padding: 15px 16px; position: relative; overflow: hidden;
          cursor: default; transition: transform 0.22s, border-color 0.22s, box-shadow 0.22s;
        }
        .stat-card:hover { transform: translateY(-2px); border-color: var(--c-bdr2); box-shadow: 0 0 0 1px var(--card-bar, rgba(0,168,255,0.1)), 0 10px 30px rgba(0,0,0,0.3); }

        /* Mid grid */
        .mid-grid { display: grid; grid-template-columns: 1fr 296px; gap: 12px; }
        .right-col { display: flex; flex-direction: column; gap: 12px; }

        /* Panel */
        .panel { background: var(--c-panel); border: 1px solid var(--c-bdr); border-radius: 10px; overflow: hidden; }
        .panel-head {
          padding: 12px 16px; border-bottom: 1px solid var(--c-bdr);
          display: flex; align-items: center; gap: 9px;
        }
        .panel-title { font-family: var(--f-display); font-size: 13.5px; font-weight: 600; letter-spacing: 0.4px; flex: 1; }
        .panel-live { display: flex; align-items: center; gap: 5px; font-family: var(--f-mono); font-size: 8.5px; letter-spacing: 1px; }
        .panel-live.green { color: var(--c-green); }
        .panel-live.red { color: var(--c-red); }
        .panel-live.blue { color: var(--c-blue); }
        .panel-live.purple { color: var(--c-purple); }
        .live-dot-sm { width: 5px; height: 5px; border-radius: 50%; background: currentColor; animation: dotPulse 1.8s ease-in-out infinite; }

        /* Table */
        .hosp-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .hosp-table th {
          font-family: var(--f-mono); font-size: 8.5px; color: var(--c-text3);
          letter-spacing: 1px; text-transform: uppercase;
          padding: 0 14px 10px; text-align: left;
          border-bottom: 1px solid var(--c-bdr);
        }
        .hosp-row { cursor: pointer; transition: background 0.18s; }
        .hosp-row:hover td { background: rgba(0,168,255,0.04); }
        .hosp-table td { border-bottom: 1px solid rgba(0,168,255,0.05); }
        .hosp-table tr:last-child td { border-bottom: none; }

        /* Badges */
        .badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 8px; border-radius: 4px;
          font-family: var(--f-mono); font-size: 9px; font-weight: 700;
          letter-spacing: 0.5px; text-transform: uppercase;
        }
        .badge-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
        .badge-open    { background: rgba(0,255,157,0.09); color: var(--c-green); border: 1px solid rgba(0,255,157,0.22); }
        .badge-limited { background: rgba(255,170,0,0.09); color: var(--c-amber); border: 1px solid rgba(255,170,0,0.22); }
        .badge-critical {
          background: rgba(255,51,102,0.1); color: var(--c-red); border: 1px solid rgba(255,51,102,0.25);
          animation: critGlow 2s ease-in-out infinite;
        }
        @keyframes critGlow { 0%,100%{box-shadow:0 0 0 0 rgba(255,51,102,0.2)} 50%{box-shadow:0 0 0 3px rgba(255,51,102,0)} }

        /* Alerts */
        .alert-item {
          border-radius: 8px; padding: 9px 11px; cursor: pointer;
          transition: all 0.18s;
        }
        .alert-item + .alert-item { margin-top: 7px; }
        .alert-red   { background: rgba(255,51,102,0.06); border: 1px solid rgba(255,51,102,0.2); }
        .alert-red:hover { background: rgba(255,51,102,0.12); }
        .alert-amber { background: rgba(255,170,0,0.06); border: 1px solid rgba(255,170,0,0.2); }
        .alert-amber:hover { background: rgba(255,170,0,0.12); }

        /* Feed */
        .feed-list { display: flex; flex-direction: column; gap: 6px; max-height: 215px; overflow-y: auto; padding-right: 2px; }
        .feed-item {
          background: rgba(6,16,38,0.8); border: 1px solid var(--c-bdr);
          border-radius: 7px; padding: 8px 11px;
          display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 10px;
          transition: all 0.2s;
          animation: feedSlide 0.35s ease-out;
        }
        @keyframes feedSlide { from { transform: translateY(-6px); opacity: 0; } to { transform: none; opacity: 1; } }
        .feed-item:hover { border-color: var(--c-bdr2); background: rgba(0,168,255,0.04); }
        .sev-badge {
          width: 30px; height: 30px; border-radius: 6px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--f-mono); font-size: 9px; font-weight: 700;
        }
        .sev-high { background: rgba(255,51,102,0.13); color: var(--c-red); border: 1px solid rgba(255,51,102,0.28); }
        .sev-med  { background: rgba(255,170,0,0.11); color: var(--c-amber); border: 1px solid rgba(255,170,0,0.25); }
        .sev-low  { background: rgba(0,255,157,0.09); color: var(--c-green); border: 1px solid rgba(0,255,157,0.2); }

        /* Bottom grid */
        .bottom-grid { display: grid; grid-template-columns: 1fr 1fr 264px; gap: 12px; }

        /* Actions */
        .action-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 13px; border-radius: 8px; border: 1px solid;
          cursor: pointer; transition: all 0.18s;
          font-family: var(--f-main); font-size: 12px; font-weight: 600;
          letter-spacing: 0.3px; text-align: left;
          background: transparent;
        }
        .action-btn + .action-btn { margin-top: 7px; }
        .action-btn:active { transform: scale(0.97); }
        .action-btn-icon {
          width: 28px; height: 28px; border-radius: 6px;
          background: rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; font-size: 13px;
        }
        .action-btn.blue   { border-color: rgba(0,168,255,0.22);   color: var(--c-blue);   }
        .action-btn.blue:hover   { background: rgba(0,168,255,0.1);   border-color: rgba(0,168,255,0.45);   box-shadow: 0 0 16px rgba(0,168,255,0.1); }
        .action-btn.red    { border-color: rgba(255,51,102,0.22);   color: var(--c-red);    }
        .action-btn.red:hover    { background: rgba(255,51,102,0.1);   border-color: rgba(255,51,102,0.45);   box-shadow: 0 0 16px rgba(255,51,102,0.1); }
        .action-btn.amber  { border-color: rgba(255,170,0,0.22);    color: var(--c-amber);  }
        .action-btn.amber:hover  { background: rgba(255,170,0,0.1);    border-color: rgba(255,170,0,0.45);    box-shadow: 0 0 16px rgba(255,170,0,0.1); }
        .action-btn.purple { border-color: rgba(155,109,255,0.22);  color: var(--c-purple); }
        .action-btn.purple:hover { background: rgba(155,109,255,0.1);  border-color: rgba(155,109,255,0.45);  box-shadow: 0 0 16px rgba(155,109,255,0.1); }

        .btn-title { font-size: 12px; font-weight: 600; }
        .btn-sub { font-size: 10px; opacity: 0.55; margin-top: 1px; }

        /* Chart legend */
        .chart-legend { display: flex; gap: 16px; margin-bottom: 10px; }
        .legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--c-text3); }
        .legend-swatch { width: 20px; height: 2px; border-radius: 1px; }

        @media (max-width: 1100px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .mid-grid { grid-template-columns: 1fr; }
          .bottom-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 800px) {
          .sidebar { width: 52px; }
          .logo-name, .logo-sub, .nav-item span, .nav-section, .sidebar-foot { display: none; }
          .nav-item { padding: 10px; justify-content: center; }
          .bottom-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ── BACKGROUNDS ── */}
      <div className="bg-grid" />
      <div className="bg-orb-1" />
      <div className="bg-orb-2" />
      <div className="scanlines" />

      <div className="app">
        {/* ── SIDEBAR ── */}
        <aside className="sidebar">
          <div className="logo">
            <div className="logo-icon">{Icons.layers}</div>
            <div className="logo-name">HOSPITAL<br />INTELLIGENCE</div>
            <div className="logo-sub"><div className="live-dot" />SYSTEM ONLINE</div>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: 9, color: 'var(--c-text3)', letterSpacing: 1, marginTop: 5 }}>9,251 HOSPITALS LINKED</div>
          </div>

          <nav className="nav">
            <div className="nav-section">Navigation</div>
            {[
              { label: 'Dashboard', icon: Icons.grid, badge: null },
              { label: 'Hospitals', icon: Icons.home, badge: null },
              { label: 'Analytics', icon: Icons.bar, badge: null },
              { label: 'Emergency Feed', icon: Icons.phone, badge: String(criticalCount) },
            ].map(({ label, icon, badge }) => (
              <div key={label} className={`nav-item ${activeNav === label ? 'active' : ''}`} onClick={() => setActiveNav(label)}>
                {icon}<span>{label}</span>
                {badge && badge !== '0' && <span className="nav-badge">{badge}</span>}
              </div>
            ))}
            <div className="nav-section" style={{ marginTop: 8 }}>System</div>
            {[
              { label: 'Network Status', icon: Icons.wifi },
              { label: 'Security', icon: Icons.shield },
            ].map(({ label, icon }) => (
              <div key={label} className={`nav-item ${activeNav === label ? 'active' : ''}`} onClick={() => setActiveNav(label)}>
                {icon}<span>{label}</span>
              </div>
            ))}
          </nav>

          <div className="sidebar-foot">
            <div className="sys-build">SYS BUILD v4.2.1</div>
            <div className="sys-clock">{clock}</div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="main">

          {/* ── TOPBAR ── */}
          <div className="topbar">
            <div>
              <div className="page-title">Command <span>Center</span></div>
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: 9, color: 'var(--c-text3)', letterSpacing: 2, marginTop: 2 }}>HOSPITAL INTELLIGENCE SYSTEM — INDIA NETWORK</div>
            </div>
            <div className="topbar-sep" />
            {criticalCount > 0 && (
              <div className="topbar-alert">
                <div className="blink-dot" />
                {criticalCount} Critical Alert{criticalCount > 1 ? 's' : ''}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,255,157,0.07)', border: '1px solid rgba(0,255,157,0.18)', borderRadius: 6, padding: '5px 11px', fontFamily: 'var(--f-mono)', fontSize: 11 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--c-green)', animation: 'dotPulse 1.8s ease-in-out infinite' }} />
              <span style={{ color: 'var(--c-text3)' }}>Patients today&nbsp;</span>
              <span style={{ color: 'var(--c-green)', fontWeight: 700 }}>{patientsToday.toLocaleString()}</span>
            </div>
            <div className={`topbar-btn ${emergencyMode ? 'emergency' : ''}`} onClick={handleEmergency}>
              {Icons.bolt}
              {emergencyMode ? 'ACTIVE — EMERGENCY' : 'Emergency Mode'}
            </div>
            <div className="topbar-btn" onClick={() => showToast('Sync initiated', 'Refreshing all hospital data streams...')}>
              {Icons.refresh} Sync All
            </div>
          </div>

          {/* ── CONTENT ── */}
          <div className="content">

            {/* STATS */}
            <div>
              <div className="sec-label">System Overview — India Network · Live</div>
              <div className="stats-grid">
                <StatCard label="Total Hospitals" value={9251} suffix={null} color="blue" delay={100}
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00a8ff" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>}
                  sub={{ arrow: '+38', text: 'new this month' }} subColor="up" />
                <StatCard label="Available Beds" value={availBeds} suffix={null} color="green" delay={250}
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00ff9d" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" /></svg>}
                  sub={{ arrow: bedsDelta > 0 ? `+${bedsDelta.toLocaleString()}` : bedsDelta.toLocaleString(), text: 'vs last update' }}
                  subColor={bedsDelta >= 0 ? 'up' : 'down'} />
                <StatCard label="ICU Capacity" value={icuPct} suffix="%" color="amber" delay={400}
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffaa00" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>}
                  sub={{ arrow: icuDelta, text: 'utilization change' }} subColor={icuDelta.startsWith('+') ? 'down' : 'up'} />
                <StatCard label="Emergency Readiness" value={readinessPct} suffix="%" color="purple" delay={550}
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9b6dff" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>}
                  sub={{ arrow: readinessDelta, text: 'network readiness' }} subColor={readinessDelta.startsWith('+') ? 'up' : 'down'} />
              </div>
            </div>

            {/* MID */}
            <div className="mid-grid">
              {/* Hospital table */}
              <div className="panel">
                <div className="panel-head">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8ab4d4" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><line x1="9" y1="22" x2="9" y2="12" /><line x1="15" y1="22" x2="15" y2="12" /></svg>
                  <span className="panel-title">Hospital Status Matrix</span>
                  <div className="panel-live green"><div className="live-dot-sm" />LIVE</div>
                </div>
                <table className="hosp-table">
                  <thead>
                    <tr>
                      <th>Hospital</th>
                      <th>Beds Free</th>
                      <th>ICU</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hospitals.map((h) => <HospitalRow key={h.id} h={h} />)}
                  </tbody>
                </table>
              </div>

              {/* Right col */}
              <div className="right-col">
                {/* Critical Alerts */}
                <div className="panel">
                  <div className="panel-head">
                    {Icons.warn}
                    <span className="panel-title">Critical Alerts</span>
                    <div className="panel-live red"><div className="live-dot-sm" />URGENT</div>
                  </div>
                  <div style={{ padding: '12px' }}>
                    {alerts.map((a) => <AlertItem key={a.id} a={a} />)}
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM */}
            <div className="bottom-grid">
              {/* Predictive chart */}
              <div className="panel">
                <div className="panel-head">
                  {Icons.pulse}
                  <span className="panel-title">Predictive Load Forecast</span>
                  <div className="panel-live purple"><div className="live-dot-sm" />AI MODEL</div>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div className="chart-legend">
                    <div className="legend-item"><div className="legend-swatch" style={{ background: '#00a8ff' }} />Actual Load</div>
                    <div className="legend-item"><div className="legend-swatch" style={{ background: '#9b6dff', backgroundImage: 'repeating-linear-gradient(90deg,#9b6dff 0,#9b6dff 4px,transparent 4px,transparent 7px)', height: 2 }} />AI Forecast</div>
                  </div>
                  <MiniChart actualData={chartActual} predictedData={chartPredicted} />
                </div>
              </div>

              {/* Emergency Feed */}
              <div className="panel">
                <div className="panel-head">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8ab4d4" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8" /><path d="M.22 2.18A2 2 0 002.2 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91" /></svg>
                  <span className="panel-title">Incoming Emergency Feed</span>
                  <div className="panel-live green"><div className="live-dot-sm" />LIVE</div>
                </div>
                <div style={{ padding: '10px 14px' }}>
                  <div className="feed-list">
                    {feed.map((p) => <FeedItem key={p.id} p={p} />)}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="panel">
                <div className="panel-head">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8ab4d4" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 010 14.14M4.93 19.07a10 10 0 010-14.14" /></svg>
                  <span className="panel-title">Quick Actions</span>
                </div>
                <div style={{ padding: '12px' }}>
                  {[
                    { cls: 'blue', emoji: '🏥', title: 'Mark as Full', sub: 'Lock bed intake', fn: () => showToast('Hospital marked full', 'Updating bed availability across network...') },
                    { cls: 'red', emoji: '🚨', title: 'Emergency Mode', sub: 'Activate protocol', fn: handleEmergency },
                    { cls: 'amber', emoji: '🔀', title: 'Redirect Patients', sub: 'Auto-route active', fn: () => showToast('Redirect initiated', 'Routing patients to nearest available hospitals...') },
                    { cls: 'purple', emoji: '🤖', title: 'Run AI Analysis', sub: 'Predict next 4 hrs', fn: () => showToast('AI Analysis running', 'Generating predictive capacity report...') },
                  ].map(({ cls, emoji, title, sub, fn }) => (
                    <div key={title} className={`action-btn ${cls}`} onClick={fn}>
                      <div className="action-btn-icon">{emoji}</div>
                      <div><div className="btn-title">{title}</div><div className="btn-sub">{sub}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── TOAST ── */}
      <Toast toast={toast} />
    </>
  );
}