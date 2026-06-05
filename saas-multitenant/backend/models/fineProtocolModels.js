const pool = require('../config/db');

const VALID_STATUSES = ['protocolado', 'concluido', 'indeferido'];

const listByFine = async (fine_id, tenant_id) => {
  const r = await pool.query(
    `SELECT * FROM fine_protocols
     WHERE fine_id = $1 AND tenant_id = $2
     ORDER BY created_at ASC`,
    [fine_id, tenant_id]
  );
  return r.rows;
};

const create = async ({ tenant_id, fine_id, protocol_number, protocol_date, protocol_status, protocol_notes, protocol_file_url }) => {
  if (!tenant_id) throw new Error('tenant_id é obrigatório');
  if (!fine_id)   throw new Error('fine_id é obrigatório');
  const status = VALID_STATUSES.includes(protocol_status) ? protocol_status : 'protocolado';
  const r = await pool.query(
    `INSERT INTO fine_protocols
       (tenant_id, fine_id, protocol_number, protocol_date, protocol_status, protocol_notes, protocol_file_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [tenant_id, fine_id, protocol_number || null, protocol_date || null, status, protocol_notes || null, protocol_file_url || null]
  );
  return r.rows[0];
};

const update = async (id, { protocol_number, protocol_date, protocol_status, protocol_notes, protocol_file_url }, tenant_id) => {
  const status = VALID_STATUSES.includes(protocol_status) ? protocol_status : 'protocolado';
  const r = await pool.query(
    `UPDATE fine_protocols
     SET protocol_number=$1, protocol_date=$2, protocol_status=$3,
         protocol_notes=$4, protocol_file_url=$5, updated_at=NOW()
     WHERE id=$6 AND tenant_id=$7 RETURNING *`,
    [protocol_number || null, protocol_date || null, status, protocol_notes || null, protocol_file_url || null, id, tenant_id]
  );
  return r.rows[0];
};

const remove = async (id, tenant_id) => {
  const r = await pool.query(
    'DELETE FROM fine_protocols WHERE id=$1 AND tenant_id=$2 RETURNING *',
    [id, tenant_id]
  );
  return r.rows[0];
};

module.exports = { listByFine, create, update, remove };
