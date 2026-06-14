const express = require('express');
const router = express.Router();
const contractModel = require('../models/contractModels');
const { checkPermission, requireAdmin } = require('../middlewares/checkPermission');

// GET /api/contracts/stage-clients — clientes agrupados por macro-etapa
router.get('/stage-clients', checkPermission('contracts:read'), async (req, res) => {
  try {
    const rows = await contractModel.getClientsByStageGroup(req.tenantId);
    // Agrupa por sub_group
    const groups = {};
    for (const r of rows) {
      if (!r.sub_group) continue;
      if (!groups[r.sub_group]) groups[r.sub_group] = [];
      groups[r.sub_group].push(r);
    }
    res.json({ success: true, data: groups });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/aprs-stats', checkPermission('contracts:read'), async (req, res) => {
  try {
    const stats = await contractModel.getAPRsByStage(req.tenantId);
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/by-organ', checkPermission('contracts:read'), async (req, res) => {
  try {
    const data = await contractModel.getContractsGroupedByOrgan(req.tenantId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/dashboard', checkPermission('contracts:read'), async (req, res) => {
  try {
    const [dashboard, alerts] = await Promise.all([
      contractModel.getDashboardStats(req.tenantId),
      contractModel.getAlerts(req.tenantId),
    ]);
    res.json({ success: true, data: { dashboard, alerts } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/contracts/deadlines?days=30 — prazos vencidos + próximos (escopo do tenant autenticado)
router.get('/deadlines', checkPermission('contracts:read'), async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365);
    const [overdue, upcoming] = await Promise.all([
      contractModel.getOverdueContracts(req.tenantId),
      contractModel.getContractsNearDueDate(req.tenantId, days),
    ]);
    res.json({ success: true, data: { overdue, upcoming, days } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/client/:clientId', checkPermission('contracts:read'), async (req, res) => {
  try {
    const contracts = await contractModel.getContractsByClient(req.params.clientId, req.tenantId);
    res.json({ success: true, data: contracts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/service/:serviceId', checkPermission('contracts:read'), async (req, res) => {
  try {
    const contracts = await contractModel.getContractsByService(
      req.params.serviceId,
      req.tenantId,
      req.query.client_id || null
    );
    res.json({ success: true, data: contracts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/', requireAdmin, async (req, res) => {
  try {
    const contracts = await contractModel.getAllContracts(req.tenantId);
    res.json({ success: true, data: contracts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', checkPermission('contracts:create'), async (req, res) => {
  try {
    const contract = await contractModel.createContract({ ...req.body, tenant_id: req.tenantId });
    res.status(201).json({ success: true, data: contract });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', checkPermission('contracts:update'), async (req, res) => {
  try {
    const contract = await contractModel.updateContract(req.params.id, req.body, req.tenantId);
    if (!contract) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: contract });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/contracts/:id/protocol — atualiza apenas campos de protocolo
router.patch('/:id/protocol', checkPermission('contracts:update'), async (req, res) => {
  try {
    const contract = await contractModel.patchContractProtocol(req.params.id, req.body, req.tenantId);
    if (!contract) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: contract });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', checkPermission('contracts:delete'), async (req, res) => {
  try {
    const contract = await contractModel.deleteContract(req.params.id, req.tenantId);
    if (!contract) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: contract });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', checkPermission('contracts:read'), async (req, res) => {
  try {
    const contract = await contractModel.getContractById(req.params.id, req.tenantId);
    if (!contract) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: contract });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;