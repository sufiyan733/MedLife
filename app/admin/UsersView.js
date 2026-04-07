'use client';
import { useState } from 'react';
import { USERS } from './data';

export default function UsersView({ showToast }) {
  const [users, setUsers] = useState(USERS);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filtered = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = { all: users.length, patient: users.filter(u => u.role === 'patient').length, doctor: users.filter(u => u.role === 'doctor').length, admin: users.filter(u => u.role === 'admin').length };

  const promoteUser = (id) => {
    setUsers(p => p.map(u => u.id === id ? { ...u, role: 'admin' } : u));
    showToast('Role updated', 'User promoted to admin');
  };

  return (
    <div className="adm-view">
      <div className="adm-sec-label">User Management</div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
        {[
          { label: 'Total Users', count: counts.all, color: '#00a8ff', icon: '👥' },
          { label: 'Patients', count: counts.patient, color: '#00ff9d', icon: '🏥' },
          { label: 'Doctors', count: counts.doctor, color: '#9b6dff', icon: '🩺' },
          { label: 'Admins', count: counts.admin, color: '#ffaa00', icon: '🛡️' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--c-panel)', border: '1px solid var(--c-bdr)', borderRadius: 10, padding: '12px 14px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${s.color},transparent)` }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 9, color: 'var(--c-text3)', fontFamily: 'var(--f-mono)', letterSpacing: 1.2, textTransform: 'uppercase' }}>{s.label}</div>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: 26, fontWeight: 700, color: s.color }}>{s.count}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div className="adm-search-bar" style={{ flex: 1, minWidth: 200 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--c-text3)" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="adm-filter-row">
          {['all', 'patient', 'doctor', 'admin'].map(f => (
            <div key={f} className={`adm-filter-chip ${roleFilter === f ? 'active' : ''}`} onClick={() => setRoleFilter(f)}>
              {f.toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="adm-panel" style={{ maxHeight: 500, overflowY: 'auto' }}>
        <table className="adm-data-table">
          <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Joined</th><th>Appointments</th><th>Last Active</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, rgba(0,168,255,0.15), rgba(155,109,255,0.15))', border: '1px solid var(--c-bdr)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--f-display)', fontSize: 12, fontWeight: 700, color: 'var(--c-blue)' }}>
                      {u.avatar}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 12.5 }}>{u.name}</span>
                  </div>
                </td>
                <td><span style={{ fontSize: 11, color: 'var(--c-text2)', fontFamily: 'var(--f-mono)' }}>{u.email}</span></td>
                <td><span className={`adm-badge adm-badge-${u.role}`}>{u.role.toUpperCase()}</span></td>
                <td><span style={{ fontSize: 11, fontFamily: 'var(--f-mono)', color: 'var(--c-text3)' }}>{u.joined}</span></td>
                <td style={{ textAlign: 'center' }}><span style={{ fontFamily: 'var(--f-display)', fontSize: 16, fontWeight: 700, color: u.appts > 0 ? 'var(--c-blue)' : 'var(--c-text3)' }}>{u.appts}</span></td>
                <td><span style={{ fontSize: 11, color: 'var(--c-text3)', fontFamily: 'var(--f-mono)' }}>{u.lastActive}</span></td>
                <td>
                  {u.role !== 'admin' && (
                    <button className="adm-inline-btn green" onClick={() => promoteUser(u.id)}>⬆ PROMOTE</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
