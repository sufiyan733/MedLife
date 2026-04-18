'use client';
import { useState, useEffect } from 'react';

const SHIFTS = ['Morning (6am–2pm)', 'Afternoon (2pm–10pm)', 'Night (10pm–6am)'];
const ROLES = ['Doctor', 'Nurse', 'Surgeon', 'Lab Tech', 'Paramedic', 'Admin Staff', 'Receptionist'];
const DEPTS = ['Cardiology', 'Neurology', 'Orthopedics', 'Oncology', 'Emergency', 'ICU', 'General', 'Pediatrics', 'ENT'];

const FIRST = ['Dr. Arun','Dr. Priya','Nurse Sunita','Dr. Rajesh','Nurse Kavya','Dr. Neha','Dr. Vikram','Nurse Asha','Dr. Rohit','Dr. Pooja','Nurse Meena','Dr. Sanjay','Dr. Anjali','Nurse Divya','Dr. Suresh'];
const LAST = ['Sharma','Patel','Gupta','Kumar','Singh','Mishra','Roy','Verma','Das','Bhatt'];

function genStaffMember(id) {
  const f = FIRST[id % FIRST.length];
  const l = LAST[(id * 7) % LAST.length];
  const role = ROLES[(id * 3) % ROLES.length];
  const dept = DEPTS[(id * 5) % DEPTS.length];
  const shift = SHIFTS[(id * 2) % SHIFTS.length];
  const status = id % 7 === 0 ? 'off-duty' : id % 11 === 0 ? 'on-leave' : 'on-duty';
  const avatar = `${f.replace(/^(Dr\.|Nurse)\s+/, '')[0]}${l[0]}`;
  return { id, name: `${f} ${l}`, role, dept, shift, status, avatar, phone: `+91 ${9000000000 + id * 1234567}`, joined: `2026-0${(id % 9) + 1}-${10 + id % 20}`, experience: `${3 + id % 15} years` };
}

const INITIAL_STAFF = Array.from({ length: 24 }, (_, i) => genStaffMember(i + 1));

function AddStaffModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', role: 'Doctor', dept: 'General', shift: SHIFTS[0], phone: '' });
  const s = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div style={{ background: 'var(--c-panel)', border: '1px solid var(--c-bdr)', borderRadius: 16, padding: 28, width: '95%', maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 20, fontWeight: 700, marginBottom: 20, color: 'var(--c-text)' }}>Add Staff Member</h3>
        {[
          { label: 'Full Name', key: 'name', type: 'text' },
          { label: 'Phone', key: 'phone', type: 'tel' },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 10, fontFamily: 'var(--f-mono)', color: 'var(--c-text3)', textTransform: 'uppercase', letterSpacing: 1.2, display: 'block', marginBottom: 6 }}>{f.label}</label>
            <input type={f.type} value={form[f.key]} onChange={e => s(f.key, e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--c-bdr)', color: 'var(--c-text)', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
              placeholder={f.label} />
          </div>
        ))}
        {[
          { label: 'Role', key: 'role', options: ROLES },
          { label: 'Department', key: 'dept', options: DEPTS },
          { label: 'Shift', key: 'shift', options: SHIFTS },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 10, fontFamily: 'var(--f-mono)', color: 'var(--c-text3)', textTransform: 'uppercase', letterSpacing: 1.2, display: 'block', marginBottom: 6 }}>{f.label}</label>
            <select value={form[f.key]} onChange={e => s(f.key, e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--c-bdr)', color: 'var(--c-text)', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}>
              {f.options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid var(--c-bdr)', background: 'transparent', color: 'var(--c-text2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => { if (form.name.trim()) onAdd(form); }} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#00a8ff,#0369a1)', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Add Staff</button>
        </div>
      </div>
    </div>
  );
}

export default function StaffView({ showToast }) {
  const [staff, setStaff] = useState(INITIAL_STAFF);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);

  const filtered = staff.filter(s => {
    if (roleFilter !== 'all' && s.role !== roleFilter) return false;
    if (deptFilter !== 'all' && s.dept !== deptFilter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    total: staff.length,
    onDuty: staff.filter(s => s.status === 'on-duty').length,
    offDuty: staff.filter(s => s.status === 'off-duty').length,
    onLeave: staff.filter(s => s.status === 'on-leave').length,
    doctors: staff.filter(s => s.role === 'Doctor' || s.role === 'Surgeon').length,
    nurses: staff.filter(s => s.role === 'Nurse').length,
  };

  const handleAdd = (form) => {
    const newStaff = {
      id: staff.length + 1,
      name: form.name,
      role: form.role,
      dept: form.dept,
      shift: form.shift,
      status: 'on-duty',
      avatar: form.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      phone: form.phone || '—',
      joined: new Date().toISOString().split('T')[0],
      experience: '0 years',
    };
    setStaff(p => [newStaff, ...p]);
    setShowAdd(false);
    showToast('Staff Added', `${form.name} added as ${form.role}`);
  };

  const toggleStatus = (id) => {
    setStaff(p => p.map(s => {
      if (s.id !== id) return s;
      const next = s.status === 'on-duty' ? 'off-duty' : s.status === 'off-duty' ? 'on-leave' : 'on-duty';
      return { ...s, status: next };
    }));
  };

  const removeStaff = (id) => {
    const member = staff.find(s => s.id === id);
    setStaff(p => p.filter(s => s.id !== id));
    showToast('Staff Removed', `${member?.name} has been removed`);
  };

  return (
    <div className="adm-view">
      {showAdd && <AddStaffModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="adm-sec-label" style={{ marginBottom: 0 }}>Staff Management — Hospital Network</div>
        <button onClick={() => setShowAdd(true)}
          style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#00a8ff,#0369a1)', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          + Add Staff
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Total Staff', count: counts.total, color: '#00a8ff', icon: '👥' },
          { label: 'On Duty', count: counts.onDuty, color: '#00ff9d', icon: '✅' },
          { label: 'Off Duty', count: counts.offDuty, color: '#ffaa00', icon: '🔸' },
          { label: 'On Leave', count: counts.onLeave, color: '#ff3366', icon: '🏖' },
          { label: 'Doctors', count: counts.doctors, color: '#9b6dff', icon: '🩺' },
          { label: 'Nurses', count: counts.nurses, color: '#00e5ff', icon: '👩‍⚕️' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--c-panel)', border: '1px solid var(--c-bdr)', borderRadius: 10, padding: '12px 14px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${s.color},transparent)` }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 9, color: 'var(--c-text3)', fontFamily: 'var(--f-mono)', letterSpacing: 1.2, textTransform: 'uppercase' }}>{s.label}</div>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: 24, fontWeight: 700, color: s.color }}>{s.count}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div className="adm-search-bar" style={{ flex: 1, minWidth: 200 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--c-text3)" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="adm-filter-row">
          {['all', ...ROLES.slice(0, 4)].map(f => (
            <div key={f} className={`adm-filter-chip ${roleFilter === f ? 'active' : ''}`} onClick={() => setRoleFilter(f)}>
              {f === 'all' ? 'ALL ROLES' : f.toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      {/* Dept filter */}
      <div className="adm-filter-row" style={{ marginBottom: 14 }}>
        {['all', ...DEPTS.slice(0, 6)].map(f => (
          <div key={f} className={`adm-filter-chip ${deptFilter === f ? 'active' : ''}`} onClick={() => setDeptFilter(f)}>
            {f === 'all' ? 'ALL DEPTS' : f.toUpperCase()}
          </div>
        ))}
      </div>

      {/* Staff Table */}
      <div className="adm-panel" style={{ maxHeight: 500, overflowY: 'auto' }}>
        <table className="adm-data-table">
          <thead>
            <tr>
              <th>Staff Member</th>
              <th>Role</th>
              <th>Department</th>
              <th>Current Shift</th>
              <th>Status</th>
              <th>Experience</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => {
              const statusColors = { 'on-duty': '#00ff9d', 'off-duty': '#ffaa00', 'on-leave': '#ff3366' };
              const statusBg = { 'on-duty': 'rgba(0,255,157,0.08)', 'off-duty': 'rgba(255,170,0,0.08)', 'on-leave': 'rgba(255,51,102,0.08)' };
              return (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, rgba(0,168,255,0.15), rgba(155,109,255,0.15))', border: '1px solid var(--c-bdr)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--f-display)', fontSize: 11, fontWeight: 700, color: 'var(--c-blue)' }}>
                        {s.avatar}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 12.5 }}>{s.name}</div>
                        <div style={{ fontSize: 9.5, color: 'var(--c-text3)', fontFamily: 'var(--f-mono)', marginTop: 1 }}>{s.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(155,109,255,0.08)', border: '1px solid rgba(155,109,255,0.15)', fontFamily: 'var(--f-mono)' }}>{s.role}</span></td>
                  <td><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(0,168,255,0.08)', border: '1px solid rgba(0,168,255,0.15)', fontFamily: 'var(--f-mono)' }}>{s.dept}</span></td>
                  <td style={{ fontSize: 11, color: 'var(--c-text2)' }}>{s.shift}</td>
                  <td>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: statusBg[s.status], border: `1px solid ${statusColors[s.status]}30`, color: statusColors[s.status], textTransform: 'uppercase', letterSpacing: 0.8, cursor: 'pointer' }}
                      onClick={() => toggleStatus(s.id)}>
                      <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: statusColors[s.status], marginRight: 5 }} />
                      {s.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td style={{ fontSize: 11, fontFamily: 'var(--f-mono)', color: 'var(--c-text3)' }}>{s.experience}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="adm-inline-btn red" onClick={() => removeStaff(s.id)}>REMOVE</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--c-text3)' }}>
            <p style={{ fontSize: 28, marginBottom: 8 }}>👥</p>
            <p style={{ fontSize: 13, fontWeight: 600 }}>No staff members found</p>
          </div>
        )}
      </div>
    </div>
  );
}
