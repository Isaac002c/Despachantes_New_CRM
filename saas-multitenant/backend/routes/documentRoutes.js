const express = require('express');
const router = express.Router();
const documentModel = require('../models/documentModels');
const companyModel = require('../models/companyModels');
const vehicleModel = require('../models/companyVehicleModels');
const { requireAdmin } = require('../middlewares/checkPermission');

// Garante que a empresa/veículo informado pertence ao tenant autenticado.
// Retorna { ok:true } ou { ok:false, status, error } para resposta controlada.
async function assertOwnership({ company_id, vehicle_id, tenantId }) {
  if (company_id) {
    const company = await companyModel.getCompanyById(company_id, tenantId);
    if (!company) return { ok: false, status: 404, error: 'Empresa não encontrada' };
  }
  if (vehicle_id) {
    const vehicle = await vehicleModel.getById(vehicle_id, tenantId);
    if (!vehicle) return { ok: false, status: 404, error: 'Veículo não encontrado' };
    if (company_id && vehicle.company_id !== company_id) {
      return { ok: false, status: 400, error: 'Veículo não pertence à empresa informada' };
    }
  }
  return { ok: true };
}

// GET /api/documents - Listar documentos (por contrato, cliente, empresa, veículo ou categoria)
router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { category, contract_id, client_id, company_id, vehicle_id } = req.query;

    let documents;

    if (contract_id) {
      documents = await documentModel.getDocumentsByContract(contract_id, tenantId);
    } else if (vehicle_id) {
      const own = await assertOwnership({ vehicle_id, tenantId });
      if (!own.ok) return res.status(own.status).json({ success: false, error: own.error });
      documents = await documentModel.getDocumentsByVehicle(vehicle_id, tenantId);
    } else if (company_id) {
      const own = await assertOwnership({ company_id, tenantId });
      if (!own.ok) return res.status(own.status).json({ success: false, error: own.error });
      documents = await documentModel.getDocumentsByCompany(company_id, tenantId);
    } else if (client_id) {
      documents = await documentModel.getDocumentsByClient(client_id, tenantId);
    } else if (category) {
      documents = await documentModel.getDocumentsByCategory(tenantId, category);
    } else {
      documents = await documentModel.getAllDocuments(tenantId);
    }

    res.json({ success: true, data: documents });
  } catch (err) {
    console.error('Erro ao buscar documentos:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/documents/stats - Estatísticas de documentos
router.get('/stats', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    
    const total = await documentModel.countDocuments(tenantId);
    const byCategory = await documentModel.countDocumentsByCategory(tenantId);
    
    res.json({ 
      success: true, 
      data: { 
        total,
        byCategory 
      } 
    });
  } catch (err) {
    console.error('Erro ao buscar stats:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/documents/contract/:contractId - Buscar documentos por contrato
router.get('/contract/:contractId', async (req, res) => {
  try {
    const { contractId } = req.params;
    const tenantId = req.tenantId;
    
    const documents = await documentModel.getDocumentsByContract(contractId, tenantId);
    res.json({ success: true, data: documents });
  } catch (err) {
    console.error('Erro ao buscar documentos do contrato:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/documents/client/:clientId - Buscar documentos por cliente
router.get('/client/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const tenantId = req.tenantId;
    
    const documents = await documentModel.getDocumentsByClient(clientId, tenantId);
    res.json({ success: true, data: documents });
  } catch (err) {
    console.error('Erro ao buscar documentos do cliente:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/documents/:id - Buscar documento por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    
    const document = await documentModel.getDocumentById(id, tenantId);
    
    if (!document) {
      return res.status(404).json({ success: false, error: 'Documento não encontrado' });
    }
    
    res.json({ success: true, data: document });
  } catch (err) {
    console.error('Erro ao buscar documento:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/documents - Criar novo documento
router.post('/', async (req, res) => {
  try {
    const {
      contract_id, client_id, company_id, vehicle_id, file_url, file_name,
      file_type, file_size, category, description
    } = req.body;
    const tenantId = req.tenantId;
    const userId = req.userId;

    if (!file_url) {
      return res.status(400).json({ success: false, error: 'URL do arquivo é obrigatória' });
    }

    if (!file_name) {
      return res.status(400).json({ success: false, error: 'Nome do arquivo é obrigatório' });
    }

    // Empresa/veículo (quando informados) precisam pertencer ao tenant.
    if (company_id || vehicle_id) {
      const own = await assertOwnership({ company_id, vehicle_id, tenantId });
      if (!own.ok) return res.status(own.status).json({ success: false, error: own.error });
    }

    const document = await documentModel.createDocument({
      tenant_id: tenantId,
      contract_id,
      client_id,
      company_id,
      vehicle_id,
      file_url,
      file_name,
      file_type,
      file_size,
      category: category || 'outros',
      description,
      uploaded_by: userId
    });
    
    res.status(201).json({ success: true, data: document });
  } catch (err) {
    console.error('Erro ao criar documento:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/documents/:id - Atualizar documento
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { file_url, file_name, file_type, file_size, category, description } = req.body;
    const tenantId = req.tenantId;
    
    const existingDocument = await documentModel.getDocumentById(id, tenantId);
    
    if (!existingDocument) {
      return res.status(404).json({ success: false, error: 'Documento não encontrado' });
    }
    
    const document = await documentModel.updateDocument(id, {
      file_url,
      file_name,
      file_type,
      file_size,
      category,
      description
    }, tenantId);
    
    res.json({ success: true, data: document });
  } catch (err) {
    console.error('Erro ao atualizar documento:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/documents/:id - Deletar documento (apenas admin)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    
    const document = await documentModel.deleteDocument(id, tenantId);
    
    if (!document) {
      return res.status(404).json({ success: false, error: 'Documento não encontrado' });
    }
    
    res.json({ success: true, data: document, message: 'Documento deletado com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar documento:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

