const pool = require('../config/db');

// ============================================
// CALENDAR EVENTS MODEL — eventos/agendamentos
// Tudo escopado por tenant_id.
// ============================================

const toStrOrNull  = (v) => (v === '' || v === undefined ? null : v);
const toTimeOrNull = (v) => (v === '' || v == null ? null : v);
const toUuidOrNull = (v) => (v === '' || v == null ? null : v);

// scope: 'upcoming' (>= hoje) | 'past' (< hoje) | 'all'; ou range from/to
const list = async (tenant_id, { scope = 'upcoming', from, to } = {}) => {
  let where = 'WHERE e.tenant_id = $1';
  const params = [tenant_id];
  if (from && to) {
    params.push(from, to);
    where += ` AND e.event_date BETWEEN $2 AND $3`;
  } else if (scope === 'upcoming') {
    where += ` AND e.event_date >= CURRENT_DATE`;
  } else if (scope === 'past') {
    where += ` AND e.event_date < CURRENT_DATE`;
  }
  const order = scope === 'past' ? 'DESC' : 'ASC';
  const r = await pool.query(
    `SELECT e.*, c.name AS client_name, u.name AS responsible_name
       FROM calendar_events e
       LEFT JOIN clients c ON e.client_id = c.id AND c.tenant_id = e.tenant_id
       LEFT JOIN users   u ON e.responsible_user_id = u.id
      ${where}
      ORDER BY e.event_date ${order}, e.start_time ASC NULLS LAST
      LIMIT 500`,
    params
  );
  return r.rows;
};

const upcoming = async (tenant_id, limit = 5) => {
  const r = await pool.query(
    `SELECT e.*, c.name AS client_name
       FROM calendar_events e
       LEFT JOIN clients c ON e.client_id = c.id AND c.tenant_id = e.tenant_id
      WHERE e.tenant_id = $1 AND e.status <> 'cancelado' AND e.event_date >= CURRENT_DATE
      ORDER BY e.event_date ASC, e.start_time ASC NULLS LAST
      LIMIT $2`,
    [tenant_id, limit]
  );
  return r.rows;
};

const getById = async (id, tenant_id) => {
  const r = await pool.query('SELECT * FROM calendar_events WHERE id = $1 AND tenant_id = $2', [id, tenant_id]);
  return r.rows[0];
};

const create = async ({
  tenant_id, title, description, event_date, start_time, end_time,
  type, client_id, fine_id, responsible_user_id, status, created_by
}) => {
  if (!tenant_id)   throw new Error('tenant_id é obrigatório');
  if (!title)       throw new Error('title é obrigatório');
  if (!event_date)  throw new Error('event_date é obrigatório');
  const r = await pool.query(
    `INSERT INTO calendar_events
       (tenant_id, title, description, event_date, start_time, end_time, type,
        client_id, fine_id, responsible_user_id, status, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [
      tenant_id, title, toStrOrNull(description), event_date,
      toTimeOrNull(start_time), toTimeOrNull(end_time), type || 'outro',
      toUuidOrNull(client_id), toUuidOrNull(fine_id), toUuidOrNull(responsible_user_id),
      status || 'agendado', toUuidOrNull(created_by),
    ]
  );
  return r.rows[0];
};

const update = async (id, {
  title, description, event_date, start_time, end_time,
  type, client_id, fine_id, responsible_user_id, status
}, tenant_id) => {
  const r = await pool.query(
    `UPDATE calendar_events
        SET title=$1, description=$2, event_date=$3, start_time=$4, end_time=$5, type=$6,
            client_id=$7, fine_id=$8, responsible_user_id=$9, status=$10, updated_at=NOW()
      WHERE id=$11 AND tenant_id=$12 RETURNING *`,
    [
      title, toStrOrNull(description), event_date, toTimeOrNull(start_time), toTimeOrNull(end_time),
      type || 'outro', toUuidOrNull(client_id), toUuidOrNull(fine_id), toUuidOrNull(responsible_user_id),
      status || 'agendado', id, tenant_id,
    ]
  );
  return r.rows[0];
};

const setStatus = async (id, status, tenant_id) => {
  const r = await pool.query(
    'UPDATE calendar_events SET status=$1, updated_at=NOW() WHERE id=$2 AND tenant_id=$3 RETURNING *',
    [status, id, tenant_id]
  );
  return r.rows[0];
};

const remove = async (id, tenant_id) => {
  const r = await pool.query('DELETE FROM calendar_events WHERE id=$1 AND tenant_id=$2 RETURNING *', [id, tenant_id]);
  return r.rows[0];
};

// Dia fechado? (existe um evento type='bloqueio' ativo naquele dia) — tenant-scoped
const isDayClosed = async (tenant_id, event_date, excludeId = null) => {
  const r = await pool.query(
    `SELECT 1 FROM calendar_events
      WHERE tenant_id = $1 AND event_date = $2 AND type = 'bloqueio' AND status <> 'cancelado'
        AND ($3::uuid IS NULL OR id <> $3)
      LIMIT 1`,
    [tenant_id, event_date, excludeId]
  );
  return r.rowCount > 0;
};

// Conflito de horário na equipe (mesmo tenant, mesmo dia, horário sobreposto) — tenant-scoped.
// Eventos sem horário (dia inteiro) não disputam horário; cancelados não contam; bloqueio não conta aqui.
const hasTimeConflict = async (tenant_id, event_date, start_time, end_time, excludeId = null) => {
  if (!start_time) return false;
  const r = await pool.query(
    `SELECT 1 FROM calendar_events
      WHERE tenant_id = $1 AND event_date = $2 AND status <> 'cancelado' AND type <> 'bloqueio'
        AND start_time IS NOT NULL
        AND ($5::uuid IS NULL OR id <> $5)
        AND (
          start_time = $3::time
          OR (start_time < COALESCE($4::time, $3::time) AND $3::time < COALESCE(end_time, start_time))
        )
      LIMIT 1`,
    [tenant_id, event_date, start_time, end_time || null, excludeId]
  );
  return r.rowCount > 0;
};

module.exports = { list, upcoming, getById, create, update, setStatus, remove, isDayClosed, hasTimeConflict };
