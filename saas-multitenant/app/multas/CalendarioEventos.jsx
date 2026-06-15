'use client';

import { useState, useEffect } from 'react';
import { getEvents, createEvent, updateEvent, setEventStatus, deleteEvent } from '../lib/calendarAPI';
import { getClients } from '../lib/clientsAPI';

const TYPES = [
  { value: 'reuniao',   label: 'Reunião',   color: '#6366f1' },
  { value: 'audiencia', label: 'Audiência', color: '#751518' },
  { value: 'ligacao',   label: 'Ligação',   color: '#0891b2' },
  { value: 'prazo',     label: 'Prazo',     color: '#f59e0b' },
  { value: 'outro',     label: 'Outro',     color: '#64748b' },
];
const typeInfo = (t) => TYPES.find(x => x.value === t) || TYPES[4];
const STATUS_LABEL = { agendado: 'Agendado', concluido: 'Concluído', cancelado: 'Cancelado' };

const parseDateOnly = (v) => {
  if (!v) return null;
  const [y, m, d] = String(v).substring(0, 10).split('-');
  return (y && m && d) ? new Date(+y, +m - 1, +d, 12, 0, 0) : null;
};
const fmtDateLong = (v) => {
  const dt = parseDateOnly(v);
  return dt ? dt.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '—';
};
const fmtTime = (t) => (t ? String(t).substring(0, 5) : '');

const EMPTY = { title: '', description: '', event_date: '', start_time: '', end_time: '', type: 'reuniao', client_id: '', status: 'agendado' };

const SCOPES = [
  { key: 'upcoming', label: 'Próximos' },
  { key: 'past',     label: 'Passados' },
  { key: 'all',      label: 'Todos' },
];

export default function CalendarioEventos() {
  const [events, setEvents]   = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [scope, setScope]     = useState('upcoming');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);
  const [modalError, setModalError] = useState(null);

  const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};

  useEffect(() => { load(); }, [scope]);          // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { getClients().then(d => setClients(d || [])).catch(() => {}); }, []);

  const load = async () => {
    try { setLoading(true); setError(null); setEvents(await getEvents(scope) || []); }
    catch (e) { setError('Não foi possível carregar os eventos.'); }
    finally { setLoading(false); }
  };

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY, event_date: new Date().toISOString().substring(0, 10) });
    setModalError(null); setShowModal(true);
  };
  const openEdit = (ev) => {
    setEditing(ev);
    setForm({
      title: ev.title || '', description: ev.description || '',
      event_date: String(ev.event_date).substring(0, 10),
      start_time: fmtTime(ev.start_time), end_time: fmtTime(ev.end_time),
      type: ev.type || 'outro', client_id: ev.client_id || '', status: ev.status || 'agendado',
    });
    setModalError(null); setShowModal(true);
  };

  const save = async (e) => {
    e.preventDefault(); setModalError(null);
    if (!form.title.trim()) { setModalError('Título é obrigatório.'); return; }
    if (!form.event_date)   { setModalError('Data é obrigatória.'); return; }
    try {
      setSaving(true);
      const payload = { ...form, client_id: form.client_id || null };
      if (editing) await updateEvent(editing.id, payload);
      else         await createEvent(payload);
      setShowModal(false); load();
    } catch (err) { setModalError(err.message); } finally { setSaving(false); }
  };

  const cancelEvent = async (ev) => { if (!confirm('Cancelar este evento?')) return; try { await setEventStatus(ev.id, 'cancelado'); load(); } catch (err) { setError(err.message); } };
  const removeEvent = async (ev) => { if (!confirm('Excluir este evento? Esta ação não pode ser desfeita.')) return; try { await deleteEvent(ev.id); load(); } catch (err) { setError(err.message); } };

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  // Agrupa por data
  const groups = {};
  for (const ev of events) { const k = String(ev.event_date).substring(0, 10); (groups[k] = groups[k] || []).push(ev); }
  const dates = Object.keys(groups).sort((a, b) => scope === 'past' ? b.localeCompare(a) : a.localeCompare(b));

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: 14 }}>
      <div className="loading-spinner" style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#751518' }} />
      <p style={{ color: '#94a3b8', fontSize: 14 }}>Carregando eventos...</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 880 }}>
      <div className="ag-head">
        <div>
          <h2 className="ag-head-title">Calendário</h2>
          <p className="ag-head-sub">Eventos e agendamentos da equipe.</p>
        </div>
        <button className="btn-primary" onClick={openNew}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 6, verticalAlign: '-2px' }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo evento
        </button>
      </div>

      {/* Filtro de escopo */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {SCOPES.map(s => (
          <button key={s.key} onClick={() => setScope(s.key)}
            style={{
              padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: '1px solid ' + (scope === s.key ? '#751518' : '#e2e8f0'),
              background: scope === s.key ? 'var(--cr-wine-light, rgba(117,21,24,0.10))' : '#fff',
              color: scope === s.key ? '#751518' : '#64748b',
            }}>
            {s.label}
          </button>
        ))}
      </div>

      {error && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}

      {dates.length === 0 ? (
        <div className="ag-card"><div className="ag-empty">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Nenhum evento {scope === 'past' ? 'passado' : scope === 'upcoming' ? 'próximo' : ''}.
        </div></div>
      ) : dates.map(date => (
        <div key={date} className="ag-card" style={{ marginBottom: 16 }}>
          <div className="ag-card-head" style={{ '--accent': '#751518', '--accent-soft': 'rgba(117,21,24,0.10)' }}>
            <span className="ag-card-dot" />
            <span className="ag-card-title" style={{ textTransform: 'capitalize' }}>{fmtDateLong(date)}</span>
            <span className="ag-card-count">{groups[date].length}</span>
          </div>
          <div className="ag-list">
            {groups[date].map(ev => {
              const ti = typeInfo(ev.type);
              const cancelled = ev.status === 'cancelado';
              return (
                <div key={ev.id} className="ag-item" style={{ cursor: 'default', opacity: cancelled ? 0.55 : 1 }}>
                  <div className="ag-ava" style={{ background: `${ti.color}18`, color: ti.color, fontSize: 11, fontWeight: 700 }}>
                    {(fmtTime(ev.start_time) || '--')}
                  </div>
                  <div className="ag-itembody">
                    <div className="ag-name" style={cancelled ? { textDecoration: 'line-through' } : undefined}>{ev.title}</div>
                    <div className="ag-meta">
                      {[ti.label,
                        (fmtTime(ev.start_time) && fmtTime(ev.end_time)) ? `${fmtTime(ev.start_time)}–${fmtTime(ev.end_time)}` : null,
                        ev.client_name, ev.responsible_name ? `resp.: ${ev.responsible_name}` : null,
                      ].filter(Boolean).join(' · ') || '—'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                    {cancelled
                      ? <span className="ag-pill" style={{ background: '#f1f5f9', color: '#94a3b8' }}>Cancelado</span>
                      : <span className="ag-pill" style={{ background: `${ti.color}18`, color: ti.color }}>{STATUS_LABEL[ev.status] || 'Agendado'}</span>}
                    <button className="btn-icon" title="Editar" onClick={() => openEdit(ev)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    {!cancelled && (
                      <button className="btn-icon" title="Cancelar" onClick={() => cancelEvent(ev)} style={{ color: '#f59e0b' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                      </button>
                    )}
                    <button className="btn-icon danger" title="Excluir" onClick={() => removeEvent(ev)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Modal criar/editar */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{editing ? 'Editar Evento' : 'Novo Evento'}</h2>
              <button type="button" onClick={() => setShowModal(false)} className="btn-close">✕</button>
            </div>
            {modalError && <div className="error-message" style={{ margin: '0 0 12px', fontSize: 13 }}>{modalError}</div>}
            <form onSubmit={save} className="modal-form">
              <div className="form-group"><label>Título *</label><input value={form.title} onChange={set('title')} placeholder="Ex.: Audiência / Reunião com cliente" required /></div>
              <div className="form-row">
                <div className="form-group"><label>Data *</label><input type="date" value={form.event_date} onChange={set('event_date')} required /></div>
                <div className="form-group"><label>Tipo</label>
                  <select value={form.type} onChange={set('type')}>{TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Início</label><input type="time" value={form.start_time} onChange={set('start_time')} /></div>
                <div className="form-group"><label>Fim</label><input type="time" value={form.end_time} onChange={set('end_time')} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Cliente (opcional)</label>
                  <select value={form.client_id} onChange={set('client_id')}>
                    <option value="">— Nenhum —</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Status</label>
                  <select value={form.status} onChange={set('status')}>
                    <option value="agendado">Agendado</option><option value="concluido">Concluído</option><option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>
              <div className="form-group"><label>Descrição</label><textarea rows={2} value={form.description} onChange={set('description')} placeholder="Detalhes do evento..." /></div>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 8px' }}>Responsável: {currentUser?.name || 'você'} (usuário logado).</p>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar evento'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
