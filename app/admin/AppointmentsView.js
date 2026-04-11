'use client';
import { useState } from 'react';
import { APPOINTMENTS } from './data';

export default function AppointmentsView({ showToast }) {
  const [appts, setAppts] = useState(APPOINTMENTS);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = appts.filter(a => {
    if (filter !== 'all' && a.status !== filter) return false;
    if (search && !a.patient.toLowerCase().includes(search.toLowerCase()) && !a.hospital.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const updateStatus = (id, status) => {
    setAppts(p => p.map(a => a.id === id ? { ...a, status } : a));
    showToast(`Appointment ${status}`, `Updated ${id} to ${status}`);
  };

  const counts = { all: appts.length, confirmed: appts.filter(a => a.status === 'confirmed').length, pending: appts.filter(a => a.status === 'pending').length, completed: appts.filter(a => a.status === 'completed').length, cancelled: appts.filter(a => a.status === 'cancelled').length };

  return (
    <div className="adm-view">
      <div className="adm-sec-label">Appointment Management</div>

      {/* Summary cards */}
      <div className="adm-appt-filter-grid">
        {[
          { label: 'Total', count: counts.all, color: '#00a8ff' },
          { label: 'Confirmed', count: counts.confirmed, color: '#00ff9d' },
          { label: 'Pending', count: counts.pending, color: '#ffaa00' },
          { label: 'Completed', count: counts.completed, color: '#9b6dff' },
          { label: 'Cancelled', count: counts.cancelled, color: '#ff3366' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--c-panel)', border: '1px solid var(--c-bdr)', borderRadius: 10, padding: '12px 14px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${s.color},transparent)` }} />
            <div style={{ fontSize: 9, color: 'var(--c-text3)', fontFamily: 'var(--f-mono)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 28, fontWeight: 700, color: s.color }}>{s.count}</div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div className="adm-search-bar" style={{ flex: 1, minWidth: 200 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--c-text3)" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input placeholder="Search by patient or hospital..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="adm-filter-row">
          {['all', 'confirmed', 'pending', 'completed', 'cancelled'].map(f => (
            <div key={f} className={`adm-filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.toUpperCase()} {f !== 'all' && <span style={{ opacity: 0.6 }}>({counts[f]})</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="adm-panel" style={{ maxHeight: 500, overflowY: 'auto' }}>
        <table className="adm-data-table">
          <thead>
            <tr>
              <th>Token</th><th>Patient</th><th>Hospital</th><th>Department</th><th>Date & Time</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id}>
                <td><span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--c-blue)' }}>{a.token}</span></td>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 12.5 }}>{a.patient}</div>
                  <div style={{ fontSize: 10, color: 'var(--c-text3)', fontFamily: 'var(--f-mono)', marginTop: 2 }}>{a.phone}</div>
                </td>
                <td style={{ fontSize: 12 }}>{a.hospital}</td>
                <td><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(0,168,255,0.08)', border: '1px solid rgba(0,168,255,0.15)', fontFamily: 'var(--f-mono)' }}>{a.dept}</span></td>
                <td>
                  <div style={{ fontSize: 12 }}>{a.date}</div>
                  <div style={{ fontSize: 10, color: 'var(--c-text3)', fontFamily: 'var(--f-mono)', marginTop: 2 }}>{a.time}</div>
                </td>
                <td><span className={`adm-badge adm-badge-${a.status}`}><span className="adm-badge-dot" />{a.status.toUpperCase()}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {a.status === 'pending' && <button className="adm-inline-btn green" onClick={() => updateStatus(a.id, 'confirmed')}>✓ CONFIRM</button>}
                    {(a.status === 'confirmed' || a.status === 'pending') && <button className="adm-inline-btn red" onClick={() => updateStatus(a.id, 'cancelled')}>✕ CANCEL</button>}
                    {a.status === 'confirmed' && <button className="adm-inline-btn green" onClick={() => updateStatus(a.id, 'completed')}>✓ DONE</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
