const pool = require('../config/db');

// ============================================
// COMPANY VEHICLES MODEL - Veículos/frota da empresa
// Tudo escopado por tenant_id + company_id.
// ============================================

const toStrOrNull = (v) => (v === '' || v === undefined ? null : v);
const toIntOrNull = (v) => {
  if (v === '' || v === undefined || v === null) return null;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
};

const listByCompany = async (company_id, tenant_id) => {
  const r = await pool.query(
    'SELECT * FROM company_vehicles WHERE company_id = $1 AND tenant_id = $2 ORDER BY created_at ASC',
    [company_id, tenant_id]
  );
  return r.rows;
};

const create = async ({ tenant_id, company_id, plate, brand, model, year, renavam, notes, status }) => {
  if (!tenant_id) throw new Error('tenant_id é obrigatório');
  if (!company_id) throw new Error('company_id é obrigatório');
  const r = await pool.query(
    `INSERT INTO company_vehicles(tenant_id, company_id, plate, brand, model, year, renavam, notes, status)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [
      tenant_id, company_id, toStrOrNull(plate), toStrOrNull(brand), toStrOrNull(model),
      toIntOrNull(year), toStrOrNull(renavam), toStrOrNull(notes), status || 'ativo',
    ]
  );
  return r.rows[0];
};

const getById = async (id, tenant_id) => {
  const r = await pool.query('SELECT * FROM company_vehicles WHERE id = $1 AND tenant_id = $2', [id, tenant_id]);
  return r.rows[0];
};

const update = async (id, { plate, brand, model, year, renavam, notes, status }, tenant_id) => {
  const r = await pool.query(
    `UPDATE company_vehicles
        SET plate=$1, brand=$2, model=$3, year=$4, renavam=$5, notes=$6, status=$7, updated_at=NOW()
      WHERE id=$8 AND tenant_id=$9 RETURNING *`,
    [
      toStrOrNull(plate), toStrOrNull(brand), toStrOrNull(model), toIntOrNull(year),
      toStrOrNull(renavam), toStrOrNull(notes), status || 'ativo', id, tenant_id,
    ]
  );
  return r.rows[0];
};

const setStatus = async (id, status, tenant_id) => {
  const r = await pool.query(
    'UPDATE company_vehicles SET status=$1, updated_at=NOW() WHERE id=$2 AND tenant_id=$3 RETURNING *',
    [status, id, tenant_id]
  );
  return r.rows[0];
};

const countVehicleFines = async (id, tenant_id) => {
  const r = await pool.query(
    'SELECT COUNT(*)::int AS total FROM fines WHERE vehicle_id = $1 AND tenant_id = $2',
    [id, tenant_id]
  );
  return r.rows[0].total;
};

const remove = async (id, tenant_id) => {
  const r = await pool.query('DELETE FROM company_vehicles WHERE id=$1 AND tenant_id=$2 RETURNING *', [id, tenant_id]);
  return r.rows[0];
};

module.exports = { listByCompany, create, getById, update, setStatus, countVehicleFines, remove };
