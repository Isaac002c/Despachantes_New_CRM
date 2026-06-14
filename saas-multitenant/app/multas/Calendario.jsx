'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getDeadlines } from '../lib/contractsAPI';

// ─── Helpers de data (date-only, sem shift de fuso) ─────────────────────────────

const parseDateOnly = (v) => {
  if (!v) return null;
  const [y, m, d] = String(v).substring(0, 10).split('-');
  if (!y || !m || !d) return null;
  return new Date(+y, +m - 1, +d, 12, 0, 0);
};

const fmtDate = (v) => {
  const dt = parseDateOnly(v);
  if (!dt) return '—';
  return dt.toLocaleDateString('pt-BR');
};

const diffDays = (v) => {
  const dt = parseDateOnly(v);
  if (!dt) return null;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.round((dt - today) / 86400000);
};

const prazoLabel = (v) => {
  const d = diffDays(v);
  if (d == null) return '';
  if (d === 0)  return 'vence hoje';
  if (d < 0)    return `venceu há ${Math.abs(d)} dia${Math.abs(d) !== 1 ? 's' : ''}`;
  return `vence em ${d} dia${d !== 1 ? 's' : ''}`;
};

// ─── Item da agenda ─────────────────────────────────────────────────────────────

function DeadlineItem({ item, overdue, onOpen }) {
  const accent = overdue ? '#ef4444' : '#f59e0b';
  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        borderLeft: `3px solid ${accent}`,
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderLeftWidth: 3,
        borderRadius: 8,
        cursor: 'pointer',
      }}
    >
      <div style={{
        flexShrink: 0, width: 40, height: 40, borderRadius: 8,
        background: `${accent}18`, color: accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
      }}>
        {(item.client_name || '?').charAt(0).toUpperCase()}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.client_name || 'Cliente'}
        </div>
        <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
          {[item.numero_multa, item.vehicle_plate, item.organ].filter(Boolean).join(' · ') || '—'}
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{fmtDate(item.due_date)}</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: accent, marginTop: 2 }}>{prazoLabel(item.due_date)}</div>
      </div>
    </div>
  );
}

function Section({ title, color, items, overdue, onOpen }) {
  return (
    <div className="md-section-card" style={{ marginBottom: 16 }}>
      <div className="md-section-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
        <h3 className="md-section-title">{title}</h3>
        <span style={{
          marginLeft: 'auto', fontSize: 12, fontWeight: 700,
          background: `${color}18`, color, padding: '2px 10px', borderRadius: 999,
        }}>
          {items.length}
        </span>
      </div>
      <div className="md-section-body">
        {items.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>Nenhum prazo nesta seção.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((it) => (
              <DeadlineItem key={it.id} item={it} overdue={overdue} onOpen={() => onOpen(it)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Componente principal ───────────────────────────────────────────────────────

export default function MultasAgenda() {
  const router = useRouter();
  const [overdue, setOverdue]   = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDeadlines(30);
      setOverdue(data?.overdue || []);
      setUpcoming(data?.upcoming || []);
    } catch (err) {
      setError('Não foi possível carregar os prazos.');
    } finally {
      setLoading(false);
    }
  };

  const openClient = (it) => {
    if (it?.client_id) router.push(`/multas/clients/${it.client_id}`);
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: 14 }}>
      <div className="loading-spinner" style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#751518' }} />
      <p style={{ color: '#94a3b8', fontSize: 14 }}>Carregando prazos...</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0 }}>Agenda de Prazos</h2>
        <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>
          Prazos vencidos e próximos 30 dias dos seus processos.
        </p>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', color: '#b91c1c', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}

      <Section title="Vencidos"        color="#ef4444" items={overdue}  overdue       onOpen={openClient} />
      <Section title="Próximos prazos" color="#f59e0b" items={upcoming} overdue={false} onOpen={openClient} />
    </div>
  );
}
