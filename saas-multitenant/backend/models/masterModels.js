const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// ============================================
// MASTER MODEL — gestão do SaaS (somente super_admin).
// Queries CROSS-TENANT propositais: usadas APENAS por rotas com requireSuperAdmin.
// O tenant "Chronostek" (slug) e os super_admin são excluídos das métricas/listas.
// ============================================

const MASTER_SLUG = 'chronostek';

const getOverview = async () => {
  const r = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM tenants WHERE slug IS DISTINCT FROM $1)                                                       AS total_tenants,
       (SELECT COUNT(*) FROM tenants WHERE slug IS DISTINCT FROM $1 AND COALESCE(status,'ativo') = 'ativo')                AS active_tenants,
       (SELECT COUNT(*) FROM tenants WHERE slug IS DISTINCT FROM $1 AND COALESCE(status,'ativo') <> 'ativo')               AS inactive_tenants,
       (SELECT COUNT(*) FROM users WHERE role IS DISTINCT FROM 'super_admin')                                              AS total_users`,
    [MASTER_SLUG]
  );
  return r.rows[0];
};

const listTenants = async () => {
  const r = await pool.query(
    `SELECT t.id, t.name, t.slug, COALESCE(t.status,'ativo') AS status, t.email, t.created_at,
            COUNT(u.id) FILTER (WHERE u.role IS DISTINCT FROM 'super_admin') AS users_count,
            MAX(u.last_login) AS last_login
       FROM tenants t
       LEFT JOIN users u ON u.tenant_id = t.id
      WHERE t.slug IS DISTINCT FROM $1
      GROUP BY t.id, t.name, t.slug, t.status, t.email, t.created_at
      ORDER BY t.created_at DESC NULLS LAST`,
    [MASTER_SLUG]
  );
  return r.rows;
};

const getTenantById = async (id) => {
  const r = await pool.query(
    `SELECT id, name, slug, COALESCE(status,'ativo') AS status, email, created_at FROM tenants WHERE id = $1`,
    [id]
  );
  return r.rows[0];
};

const getTenantUsers = async (tenant_id) => {
  const r = await pool.query(
    `SELECT id, name, email, role, last_login, created_at
       FROM users WHERE tenant_id = $1 AND role IS DISTINCT FROM 'super_admin'
      ORDER BY created_at ASC`,
    [tenant_id]
  );
  return r.rows;
};

const slugExists  = async (slug) => (await pool.query('SELECT 1 FROM tenants WHERE slug = $1', [slug])).rowCount > 0;
const emailInTenant = async (email, tenant_id) =>
  (await pool.query('SELECT 1 FROM users WHERE email = $1 AND tenant_id = $2', [email, tenant_id])).rowCount > 0;

// Cria tenant + usuário admin (transação). Senha sempre com bcrypt.
const createTenantWithAdmin = async ({ name, slug, email, adminName, adminEmail, adminPassword, status }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const t = await client.query(
      `INSERT INTO tenants(name, slug, email, status) VALUES($1,$2,$3,$4)
       RETURNING id, name, slug, COALESCE(status,'ativo') AS status, email, created_at`,
      [name, slug, email || null, status || 'ativo']
    );
    const tenant = t.rows[0];
    const hash = await bcrypt.hash(adminPassword, 10);
    const u = await client.query(
      `INSERT INTO users(tenant_id, name, email, password_hash, role) VALUES($1,$2,$3,$4,'admin')
       RETURNING id, name, email, role`,
      [tenant.id, adminName, adminEmail, hash]
    );
    await client.query('COMMIT');
    return { tenant, admin: u.rows[0] };   // nunca retorna senha
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

const setTenantStatus = async (id, status) => {
  const r = await pool.query(
    `UPDATE tenants SET status = $1 WHERE id = $2 RETURNING id, name, slug, COALESCE(status,'ativo') AS status`,
    [status, id]
  );
  return r.rows[0];
};

const createTenantUser = async ({ tenant_id, name, email, password, role }) => {
  const hash = await bcrypt.hash(password, 10);
  const r = await pool.query(
    `INSERT INTO users(tenant_id, name, email, password_hash, role) VALUES($1,$2,$3,$4,$5)
     RETURNING id, name, email, role`,
    [tenant_id, name, email, hash, role === 'admin' ? 'admin' : 'seller']
  );
  return r.rows[0];
};

const getUserById = async (id) =>
  (await pool.query('SELECT id, email, tenant_id, role FROM users WHERE id = $1', [id])).rows[0];

const resetUserPassword = async (userId, newPassword) => {
  const hash = await bcrypt.hash(newPassword, 10);
  const r = await pool.query(
    `UPDATE users SET password_hash = $1 WHERE id = $2 AND role IS DISTINCT FROM 'super_admin'
     RETURNING id, email`,
    [hash, userId]
  );
  return r.rows[0];
};

module.exports = {
  MASTER_SLUG, getOverview, listTenants, getTenantById, getTenantUsers,
  slugExists, emailInTenant, createTenantWithAdmin, setTenantStatus,
  createTenantUser, getUserById, resetUserPassword,
};
