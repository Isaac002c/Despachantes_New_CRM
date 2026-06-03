const pool = require('../config/db');

const VALID_STATUSES = ['entrada', 'possui_defensor', 'nao_quer_defender', 'negociacao', 'fechado', 'perdido'];

// CREATE
const createMultasLead = async ({
  tenant_id, name, cpf, cnh, first_license_date, birth_date,
  phone, source, status, created_by, created_by_name, notes, motivo
}) => {
  if (!tenant_id) throw new Error('tenant_id é obrigatório');
  if (!name)      throw new Error('name é obrigatório');

  const result = await pool.query(
    `INSERT INTO multas_leads
       (tenant_id, name, cpf, cnh, first_license_date, birth_date,
        phone, source, status, created_by, created_by_name, notes, motivo)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      tenant_id, name,
      cpf             || null,
      cnh             || null,
      first_license_date || null,
      birth_date      || null,
      phone           || null,
      source          || null,
      VALID_STATUSES.includes(status) ? status : 'entrada',
      created_by      || null,
      created_by_name || null,
      notes           || null,
      motivo          || null,
    ]
  );
  return result.rows[0];
};

// READ - todos
const getAllMultasLeads = async (tenant_id) => {
  const result = await pool.query(
    `SELECT ml.*, u.name AS user_name
     FROM multas_leads ml
     LEFT JOIN users u ON ml.created_by = u.id
     WHERE ml.tenant_id = $1
     ORDER BY ml.created_at DESC`,
    [tenant_id]
  );
  return result.rows;
};

// READ - por status
const getMultasLeadsByStatus = async (tenant_id, status) => {
  const result = await pool.query(
    `SELECT ml.*, u.name AS user_name
     FROM multas_leads ml
     LEFT JOIN users u ON ml.created_by = u.id
     WHERE ml.tenant_id = $1 AND ml.status = $2
     ORDER BY ml.created_at DESC`,
    [tenant_id, status]
  );
  return result.rows;
};

// READ - por id
const getMultasLeadById = async (id, tenant_id) => {
  const result = await pool.query(
    `SELECT ml.*, u.name AS user_name
     FROM multas_leads ml
     LEFT JOIN users u ON ml.created_by = u.id
     WHERE ml.id = $1 AND ml.tenant_id = $2`,
    [id, tenant_id]
  );
  return result.rows[0];
};

// READ - contagem por status
const countMultasLeadsByStatus = async (tenant_id) => {
  const result = await pool.query(
    `SELECT status, COUNT(*) as count
     FROM multas_leads
     WHERE tenant_id = $1
     GROUP BY status`,
    [tenant_id]
  );
  return result.rows;
};

// UPDATE
const updateMultasLead = async (id, {
  name, cpf, cnh, first_license_date, birth_date,
  phone, source, status, notes, motivo
}, tenant_id) => {
  const result = await pool.query(
    `UPDATE multas_leads
     SET name = $1, cpf = $2, cnh = $3, first_license_date = $4, birth_date = $5,
         phone = $6, source = $7, status = $8, notes = $9, motivo = $10, updated_at = NOW()
     WHERE id = $11 AND tenant_id = $12
     RETURNING *`,
    [
      name,
      cpf             || null,
      cnh             || null,
      first_license_date || null,
      birth_date      || null,
      phone           || null,
      source          || null,
      VALID_STATUSES.includes(status) ? status : 'entrada',
      notes           || null,
      motivo          || null,
      id, tenant_id,
    ]
  );
  return result.rows[0];
};

// UPDATE status only
const updateMultasLeadStatus = async (id, status, tenant_id) => {
  const normalized = (status || '').toLowerCase().trim();
  if (!VALID_STATUSES.includes(normalized)) throw new Error('Status inválido');
  const result = await pool.query(
    `UPDATE multas_leads SET status = $1, updated_at = NOW()
     WHERE id = $2 AND tenant_id = $3 RETURNING *`,
    [normalized, id, tenant_id]
  );
  return result.rows[0];
};

// DELETE
const deleteMultasLead = async (id, tenant_id) => {
  const result = await pool.query(
    'DELETE FROM multas_leads WHERE id = $1 AND tenant_id = $2 RETURNING *',
    [id, tenant_id]
  );
  return result.rows[0];
};

module.exports = {
  createMultasLead,
  getAllMultasLeads,
  getMultasLeadsByStatus,
  getMultasLeadById,
  countMultasLeadsByStatus,
  updateMultasLead,
  updateMultasLeadStatus,
  deleteMultasLead,
};
