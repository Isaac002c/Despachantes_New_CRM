'use client';

import { useState, useEffect } from 'react';
import { getEvents, getEventsRange, createEvent, updateEvent, setEventStatus, deleteEvent } from '../lib/calendarAPI';
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
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const DAY_STATUS = { livre: { label: 'Livre', color: '#22c55e' }, ocupado: { label: 'Ocupado', color: '#f59e0b' }, fechado: { label: 'Fechado', color: '#dc2626' } };

const pad = (n) => String(n).padStart(2, '0');
const localISO = (dt) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
const parseDateOnly = (v) => { if (!v) return null; const [y, m, d] = String(v).substring(0, 10).split('-'); return (y && m && d) ? new Date(+y, +m - 1, +d, 12, 0, 0) : null; };
const fmtDateLong = (v) => { const dt = parseDateOnly(v); return dt ? dt.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '—'; };
const fmtTime = (t) => (t ? String(t).substring(0, 5) : '');

const EMPTY = { title: '', description: '', event_date: '', start_time: '', end_time: '', type: 'reuniao', client_id: '', status: 'agendado' };
const SCOPES = [{ key: 'upcoming', label: 'Próximos' }, { key: 'past', label: 'Passados' }, { key: 'all', label: 'Todos' }];

export default function CalendarioEventos() {
  const todayDate = new Date();
  const todayStr = localISO(todayDate);

  const [view, setView]       = useState('mes'); // 'mes' (principal) | 'lista'
  const [cursor, setCursor]   = useState({ y: todayDate.getFullYear(), m: todayDate.getMonth() });
  const [monthEvents, setMonthEvents] = useState([]);
  const [listEvents, setListEvents]   = useState([]);
  const [scope, setScope]     = useState('upcoming');
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [dayDrawer, setDayDrawer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);
  const [modalError, setModalError] = useState(null);

  const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};

  useEffect(() => { getClients().then(d => setClients(d || [])).catch(() => {}); }, []);
  useEffect(() => { load(); }, [view, scope, cursor.y, cursor.m]);   // eslint-disable-line react-hooks/exhaustive-deps

  const monthRange = () => {
    const first = `${cursor.y}-${pad(cursor.m + 1)}-01`;
    const lastDay = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const last = `${cursor.y}-${pad(cursor.m + 1)}-${pad(lastDay)}`;
    return { first, last };
  };

  const load = async () => {
    try {
      setLoading(true); setError(null);
      if (view === 'mes') {
        const { first, last } = monthRange();
        setMonthEvents(await getEventsRange(first, last) || []);
      } else {
        setListEvents(await getEvents(scope) || []);
      }
    } catch (e) { setError('Não foi possível carregar os eventos.'); }
    finally { setLoading(false); }
  };

  // ── CRUD ──
  const openNew = (dateStr) => { setEditing(null); setForm({ ...EMPTY, event_date: dateStr || localISO(new Date()) }); setModalError(null); setShowModal(true); };
  const openEdit = (ev) => {
    setEditing(ev);
    setForm({
      title: ev.title || '', description: ev.description || '', event_date: String(ev.event_date).substring(0, 10),
      start_time: fmtTime(ev.start_time), end_time: fmtTime(ev.end_time), type: ev.type || 'outro',
      client_id: ev.client_id || '', status: ev.status || 'agendado',
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
    } catch (err) { setModalError(err.message); }   // 409 = conflito de horário / agenda fechada
    finally { setSaving(false); }
  };
  const cancelEvent = async (ev) => { if (!confirm('Cancelar este evento?')) return; try { await setEventStatus(ev.id, 'cancelado'); load(); } catch (err) { setError(err.message); } };
  const removeEvent = async (ev) => { if (!confirm('Excluir este evento?')) return; try { await deleteEvent(ev.id); load(); } catch (err) { setError(err.message); } };

  // ── Fechar / reabrir agenda do dia (type='bloqueio') ──
  const closeDay = async (dateStr) => {
    if (!confirm('Fechar a agenda deste dia? Novos eventos ficarão bloqueados.')) return;
    try { await createEvent({ title: 'Agenda fechada', event_date: dateStr, type: 'bloqueio', status: 'agendado' }); load(); }
    catch (err) { setError(err.message); }
  };
  const reopenDay = async (dateStr, dayEvents) => {
    const blocks = dayEvents.filter(e => e.type === 'bloqueio' && e.status !== 'cancelado');
    try { for (const b of blocks) await deleteEvent(b.id); load(); }
    catch (err) { setError(err.message); }
  };

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  const eventsOn = (dateStr) => monthEvents.filter(e => String(e.event_date).substring(0, 10) === dateStr);
  const dayStatusOf = (evs) => {
    if (evs.some(e => e.type === 'bloqueio' && e.status !== 'cancelado')) return 'fechado';
    if (evs.some(e => e.status !== 'cancelado')) return 'ocupado';
    return 'livre';
  };

  const buildCells = () => {
    const startW = new Date(cursor.y, cursor.m, 1).getDay();
    const start = new Date(cursor.y, cursor.m, 1 - startW);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i);
      return { date: localISO(d), inMonth: d.getMonth() === cursor.m, day: d.getDate() };
    });
  };
  const prevMonth = () => setCursor(c => { let m = c.m - 1, y = c.y; if (m < 0) { m = 11; y--; } return { y, m }; });
  const nextMonth = () => setCursor(c => { let m = c.m + 1, y = c.y; if (m > 11) { m = 0; y++; } return { y, m }; });
  const goToday   = () => setCursor({ y: todayDate.getFullYear(), m: todayDate.getMonth() });

  const showSpinner = loading && ((view === 'mes' && monthEvents.length === 0) || (view === 'lista' && listEvents.length === 0));

  // ── Lista agrupada (modo lista) ──
  const groups = {};
  for (const ev of listEvents) { const k = String(ev.event_date).substring(0, 10); (groups[k] = groups[k] || []).push(ev); }
  const listDates = Object.keys(groups).sort((a, b) => scope === 'past' ? b.localeCompare(a) : a.localeCompare(b));

  return (
    <div className="ag-page">
      <div className="ag-head">
        <div>
          <h2 className="ag-head-title">Agenda</h2>
          <p className="ag-head-sub">Eventos e agendamentos da equipe.</p>
        </div>
        <div className="cal-toggle">
          <button className={view === 'mes' ? 'active' : ''} onClick={() => setView('mes')}>Mês</button>
          <button className={view === 'lista' ? 'active' : ''} onClick={() => setView('lista')}>Lista</button>
        </div>
      </div>

      {error && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}

      {showSpinner ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: 14 }}>
          <div className="loading-spinner" style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#751518' }} />
          <p style={{ color: '#94a3b8', fontSize: 14 }}>Carregando agenda...</p>
        </div>
      ) : view === 'mes' ? (
        <>
          <div className="cal-toolbar">
            <div className="cal-nav">
              <button className="cal-iconbtn" onClick={prevMonth} aria-label="Mês anterior"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg></button>
              <span className="cal-month">{MONTHS[cursor.m]} de {cursor.y}</span>
              <button className="cal-iconbtn" onClick={nextMonth} aria-label="Próximo mês"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg></button>
              <button className="btn-secondary" onClick={goToday} style={{ marginLeft: 4 }}>Hoje</button>
            </div>
            <button className="btn-primary" onClick={() => openNew(null)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 6, verticalAlign: '-2px' }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Novo evento
            </button>
          </div>

          <div className="cal-grid" style={{ marginBottom: 6 }}>
            {WEEKDAYS.map(w => <div key={w} className="cal-weekday">{w}</div>)}
          </div>
          <div className="cal-grid">
            {buildCells().map(cell => {
              const evs = eventsOn(cell.date);
              const st = dayStatusOf(evs);
              const closed = st === 'fechado';
              const active = evs.filter(e => e.status !== 'cancelado' && e.type !== 'bloqueio');
              const visible = active.slice(0, 3);
              const extra = active.length - visible.length;
              const cls = `cal-cell${!cell.inMonth ? ' cal-cell--out' : ''}${cell.date === todayStr ? ' cal-cell--today' : ''}${closed ? ' cal-cell--closed' : ''}`;
              return (
                <div key={cell.date} className={cls} onClick={() => setDayDrawer(cell.date)}>
                  <div className="cal-daynum">
                    <span>{cell.day}</span>
                    <span className="cal-status-dot" style={{ background: DAY_STATUS[st].color }} title={DAY_STATUS[st].label} />
                  </div>
                  {closed ? (
                    <span className="cal-closed-tag">Fechada</span>
                  ) : (
                    <>
                      {visible.map(ev => { const ti = typeInfo(ev.type); return (
                        <span key={ev.id} className="cal-chip" style={{ background: `${ti.color}18`, color: ti.color }}>
                          {fmtTime(ev.start_time) ? `${fmtTime(ev.start_time)} ` : ''}{ev.title}
                        </span>
                      ); })}
                      {extra > 0 && <span className="cal-more">+{extra} mais</span>}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        // ── Modo LISTA (2 colunas) ──
        <div className="md-layout">
          <div className="md-main">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SCOPES.map(s => (
                <button key={s.key} onClick={() => setScope(s.key)}
                  style={{ padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    border: '1px solid ' + (scope === s.key ? '#751518' : '#e2e8f0'),
                    background: scope === s.key ? 'var(--cr-wine-light, rgba(117,21,24,0.10))' : '#fff',
                    color: scope === s.key ? '#751518' : '#64748b' }}>
                  {s.label}
                </button>
              ))}
            </div>
            {listDates.length === 0 ? (
              <div className="ag-card"><div className="ag-empty">Nenhum evento {scope === 'past' ? 'passado' : scope === 'upcoming' ? 'próximo' : ''}.</div></div>
            ) : listDates.map(date => (
              <div key={date} className="ag-card">
                <div className="ag-card-head" style={{ '--accent': '#751518', '--accent-soft': 'rgba(117,21,24,0.10)' }}>
                  <span className="ag-card-dot" />
                  <span className="ag-card-title" style={{ textTransform: 'capitalize' }}>{fmtDateLong(date)}</span>
                  <span className="ag-card-count">{groups[date].length}</span>
                </div>
                <div className="ag-list">
                  {groups[date].map(ev => <EventRow key={ev.id} ev={ev} onEdit={openEdit} onCancel={cancelEvent} onRemove={removeEvent} />)}
                </div>
              </div>
            ))}
          </div>
          <aside className="md-sidebar">
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => openNew(null)}>+ Novo evento</button>
            <div className="ag-aside-card">
              <div className="ag-aside-title">Exibir</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {SCOPES.map(s => (
                  <button key={s.key} onClick={() => setScope(s.key)}
                    style={{ textAlign: 'left', padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      border: '1px solid ' + (scope === s.key ? '#751518' : '#e2e8f0'),
                      background: scope === s.key ? 'var(--cr-wine-light, rgba(117,21,24,0.10))' : '#fff',
                      color: scope === s.key ? '#751518' : '#475569' }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ── Drawer do dia ── */}
      {dayDrawer && (() => {
        const dayEvents = eventsOn(dayDrawer);
        const st = dayStatusOf(dayEvents);
        const closed = st === 'fechado';
        const normal = dayEvents.filter(e => e.type !== 'bloqueio');
        return (
          <div className="modal-overlay" onClick={() => setDayDrawer(null)}>
            <div className="modal-content" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', textTransform: 'capitalize' }}>{fmtDateLong(dayDrawer)}</h2>
                  <span style={{ display: 'inline-block', marginTop: 4, fontSize: 11, fontWeight: 700, background: `${DAY_STATUS[st].color}18`, color: DAY_STATUS[st].color, padding: '2px 10px', borderRadius: 999 }}>
                    {DAY_STATUS[st].label}
                  </span>
                </div>
                <button type="button" onClick={() => setDayDrawer(null)} className="btn-close">✕</button>
              </div>

              {closed ? (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, color: '#b91c1c', fontWeight: 600 }}>Agenda fechada neste dia. Novos eventos estão bloqueados.</span>
                  <button className="btn-secondary" onClick={() => reopenDay(dayDrawer, dayEvents)}>Reabrir agenda</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  <button className="btn-primary" onClick={() => openNew(dayDrawer)}>+ Novo evento</button>
                  <button className="btn-secondary" onClick={() => closeDay(dayDrawer)}>Fechar agenda do dia</button>
                </div>
              )}

              {normal.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>Nenhum evento neste dia.</p>
              ) : (
                <div className="ag-list" style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                  {normal.map(ev => <EventRow key={ev.id} ev={ev} onEdit={openEdit} onCancel={cancelEvent} onRemove={removeEvent} />)}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Modal criar/editar ── */}
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
                <div className="form-group"><label>Tipo</label><select value={form.type} onChange={set('type')}>{TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
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
              <div className="form-group"><label>Observações</label><textarea rows={2} value={form.description} onChange={set('description')} placeholder="Detalhes do evento..." /></div>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 8px' }}>Responsável: {currentUser?.name || 'você'} (usuário logado). Sem horário = dia inteiro.</p>
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

// Linha de evento reutilizável (lista e drawer do dia)
function EventRow({ ev, onEdit, onCancel, onRemove }) {
  const ti = typeInfo(ev.type);
  const cancelled = ev.status === 'cancelado';
  return (
    <div className="ag-item" style={{ cursor: 'default', opacity: cancelled ? 0.55 : 1, borderLeft: `3px solid ${ti.color}` }}>
      <div className="ag-ava" style={{ background: `${ti.color}18`, color: ti.color, fontSize: 12, fontWeight: 700 }}>
        {fmtTime(ev.start_time) || '--:--'}
      </div>
      <div className="ag-itembody">
        <div className="ag-name" style={cancelled ? { textDecoration: 'line-through' } : undefined}>{ev.title}</div>
        <div className="ag-meta" style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: ti.color, background: `${ti.color}14`, padding: '1px 7px', borderRadius: 5, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{ti.label}</span>
          {fmtTime(ev.start_time) && fmtTime(ev.end_time) && <span>{fmtTime(ev.start_time)}–{fmtTime(ev.end_time)}</span>}
          {ev.client_name && <span>· {ev.client_name}</span>}
          {ev.responsible_name && <span style={{ color: '#cbd5e1' }}>· resp.: {ev.responsible_name}</span>}
          {ev.description && <span style={{ color: '#94a3b8' }}>· {ev.description}</span>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
        {cancelled
          ? <span className="ag-pill" style={{ background: '#f1f5f9', color: '#94a3b8' }}>Cancelado</span>
          : <span className="ag-pill" style={{ background: `${ti.color}18`, color: ti.color }}>{STATUS_LABEL[ev.status] || 'Agendado'}</span>}
        <button className="btn-icon" title="Editar" onClick={() => onEdit(ev)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        {!cancelled && (
          <button className="btn-icon" title="Cancelar" onClick={() => onCancel(ev)} style={{ color: '#f59e0b' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </button>
        )}
        <button className="btn-icon danger" title="Excluir" onClick={() => onRemove(ev)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </div>
    </div>
  );
}
