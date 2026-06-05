const express = require('express');
const router  = express.Router();
const model   = require('../models/fineProtocolModels');
const { checkPermission } = require('../middlewares/checkPermission');

// GET /api/fine-protocols?fine_id=X
router.get('/', checkPermission('contracts:read'), async (req, res) => {
  try {
    const { fine_id } = req.query;
    if (!fine_id) return res.status(400).json({ success: false, error: 'fine_id é obrigatório' });
    const data = await model.listByFine(fine_id, req.tenantId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/fine-protocols
router.post('/', checkPermission('contracts:update'), async (req, res) => {
  try {
    const item = await model.create({ ...req.body, tenant_id: req.tenantId });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/fine-protocols/:id
router.patch('/:id', checkPermission('contracts:update'), async (req, res) => {
  try {
    const item = await model.update(req.params.id, req.body, req.tenantId);
    if (!item) return res.status(404).json({ success: false, error: 'Protocolo não encontrado' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/fine-protocols/:id
router.delete('/:id', checkPermission('contracts:delete'), async (req, res) => {
  try {
    const item = await model.remove(req.params.id, req.tenantId);
    if (!item) return res.status(404).json({ success: false, error: 'Protocolo não encontrado' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
