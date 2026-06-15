'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  getCompanyById, updateCompany,
  getVehicles, createVehicle, updateVehicle, setVehicleStatus, deleteVehicle,
  getCompanyFines,
} from '../../../lib/companiesAPI';
import { createContract, updateContract, deleteContract } from '../../../lib/contractsAPI';
import { getServiceTypes } from '../../../lib/servicesAPI';

// ─── Constantes / helpers ───────────────────────────────────────────────────────

const ORGANS = ['DETRAN', 'DER', 'DNIT', 'SMTR', 'RENAINF', 'PRF', 'ANTT', 'PREFEITURA UF', 'OUTROS'];
const getOrganOptions = (current) =>
  current && !ORGANS.includes(current) ? [current, ...ORGANS] : ORGANS;

const STATUS_OPTIONS = [
  { value: 'APRS DEFESA PREVIA',      label: 'APRs — Defesa Prévia' },
  { value: 'DEFESA PREVIA - ANALISE', label: 'Defesa Prévia — Análise' },
  { value: 'APRS 1 INSTANCIA',        label: 'APRs — 1ª Instância' },
  { value: '1 INSTANCIA - ANALISE',   label: '1ª Instância — Análise' },
  { value: 'APRS 2 INSTANCIA',        label: 'APRs — 2ª Instância' },
  { value: '2 INSTANCIA - ANALISE',   label: '2ª Instância — Análise' },
  { value: 'PROTOCOLADO',             label: 'Protocolado' },
  { value: 'DEFERIDO',                label: 'Deferido' },
  { value: 'INDEFERIDO',              label: 'Indeferido' },
  { value: 'FINALIZADO',              label: 'Finalizado' },
  { value: 'CANCELADO',               label: 'Cancelado' },
];
const STATUS_COLORS = {
  'DEFERIDO':   { bg: '#dcfce7', text: '#15803d' },
  'INDEFERIDO': { bg: '#fee2e2', text: '#991b1b' },
  'PROTOCOLADO':{ bg: '#f0fdf4', text: '#16a34a' },
  'CANCELADO':  { bg: '#f1f5f9', text: '#94a3b8' },
  'FINALIZADO': { bg: '#f1f5f9', text: '#475569' },
};
const getStatusStyle = (s) => {
  const c = STATUS_COLORS[s];
  return c ? { background: c.bg, color: c.text } : { background: '#ede9fe', color: '#6366f1' };
};
const getStatusLabel = (s) => STATUS_OPTIONS.find(o => o.value === s)?.label || s || '—';

const formatDate = (v) => {
  if (!v) return '—';
  const [y, m, d] = String(v).substring(0, 10).split('-');
  return (y && m && d) ? `${d}/${m}/${y}` : '—';
};
const toInputDate = (v) => (!v ? '' : String(v).substring(0, 10));
const getPrazoStyle = (due) => {
  if (!due) return { color: '#94a3b8' };
  const [y, m, d] = String(due).substring(0, 10).split('-');
  const prazo = new Date(+y, +m - 1, +d, 12, 0, 0);
  const diff = Math.ceil((prazo - new Date()) / 86400000);
  if (diff < 0)  return { color: '#ef4444', fontWeight: 600 };
  if (diff <= 7) return { color: '#f59e0b', fontWeight: 600 };
  return { color: '#334155' };
};

const maskCnpj = (value) => {
  const d = (value || '').replace(/\D/g, '').slice(0, 14);
  if (d.length <= 2)  return d;
  if (d.length <= 5)  return `${d.slice(0,2)}.${d.slice(2)}`;
  if (d.length <= 8)  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`;
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
};
const maskPhone = (value) => {
  const d = (value || '').replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const EMPTY_VEHICLE = { plate: '', brand: '', model: '', year: '', renavam: '', notes: '', status: 'ativo' };
const EMPTY_PROC = { service_id: '', numero_multa: '', vehicle_id: '', vehicle_plate: '', organ: '', status: '', due_date: '', notes: '' };

// ─── Página ─────────────────────────────────────────────────────────────────────

export default function CompanyDetail() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id;

  const [company, setCompany]   = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [fines, setFines]       = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  // Modais
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [companyForm, setCompanyForm] = useState({});
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehicleForm, setVehicleForm] = useState(EMPTY_VEHICLE);
  const [showProcModal, setShowProcModal] = useState(false);
  const [editingProc, setEditingProc] = useState(null);
  const [procForm, setProcForm] = useState(EMPTY_PROC);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [c, v, f, st] = await Promise.all([
        getCompanyById(companyId),
        getVehicles(companyId).catch(() => []),
        getCompanyFines(companyId).catch(() => []),
        getServiceTypes().catch(() => []),
      ]);
      setCompany(c);
      setVehicles(v || []);
      setFines(f || []);
      setServiceTypes(st || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  // ── Empresa ──
  const openCompanyEdit = () => {
    setCompanyForm({
      razao_social: company.razao_social || '', nome_fantasia: company.nome_fantasia || '',
      cnpj: maskCnpj(company.cnpj || ''), responsavel: company.responsavel || '',
      phone: company.phone || '', email: company.email || '', address: company.address || '',
      notes: company.notes || '', status: company.status || 'ativo',
    });
    setModalError(null);
    setShowCompanyModal(true);
  };
  const saveCompany = async (e) => {
    e.preventDefault();
    setModalError(null);
    if (!companyForm.razao_social?.trim()) { setModalError('Razão social é obrigatória.'); return; }
    if ((companyForm.cnpj || '').replace(/\D/g, '').length !== 14) { setModalError('CNPJ deve ter 14 dígitos.'); return; }
    try {
      setSaving(true);
      await updateCompany(companyId, { ...companyForm, cnpj: companyForm.cnpj.replace(/\D/g, '') });
      setShowCompanyModal(false);
      load();
    } catch (err) { setModalError(err.message); } finally { setSaving(false); }
  };

  // ── Veículos ──
  const openVehicleNew = () => { setEditingVehicle(null); setVehicleForm(EMPTY_VEHICLE); setModalError(null); setShowVehicleModal(true); };
  const openVehicleEdit = (v) => {
    setEditingVehicle(v);
    setVehicleForm({ plate: v.plate || '', brand: v.brand || '', model: v.model || '', year: v.year || '', renavam: v.renavam || '', notes: v.notes || '', status: v.status || 'ativo' });
    setModalError(null);
    setShowVehicleModal(true);
  };
  const saveVehicle = async (e) => {
    e.preventDefault();
    setModalError(null);
    try {
      setSaving(true);
      if (editingVehicle) await updateVehicle(companyId, editingVehicle.id, vehicleForm);
      else                await createVehicle(companyId, vehicleForm);
      setShowVehicleModal(false);
      load();
    } catch (err) { setModalError(err.message); } finally { setSaving(false); }
  };
  const toggleVehicleStatus = async (v) => {
    try {
      await setVehicleStatus(companyId, v.id, v.status === 'inativo' ? 'ativo' : 'inativo');
      load();
    } catch (err) { setError(err.message); }
  };
  const removeVehicle = async (v) => {
    if (!confirm('Excluir este veículo?')) return;
    try { await deleteVehicle(companyId, v.id); load(); }
    catch (err) { setError(err.message); } // bloqueado se houver processo vinculado
  };

  // ── Processos ──
  const defaultServiceId = () => {
    const multa = serviceTypes.find(s => (s.code || '').toUpperCase() === 'MULTA');
    return multa ? String(multa.id) : (serviceTypes[0] ? String(serviceTypes[0].id) : '');
  };
  const openProcNew = () => {
    setEditingProc(null);
    setProcForm({ ...EMPTY_PROC, service_id: defaultServiceId(), status: 'APRS DEFESA PREVIA' });
    setModalError(null);
    setShowProcModal(true);
  };
  const openProcEdit = (f) => {
    setEditingProc(f);
    setProcForm({
      service_id: String(f.service_id || defaultServiceId()),
      numero_multa: f.numero_multa || '',
      vehicle_id: f.vehicle_id || '',
      vehicle_plate: f.vehicle_plate || '',
      organ: f.organ || '',
      status: f.status || 'APRS DEFESA PREVIA',
      due_date: toInputDate(f.due_date),
      notes: f.notes || '',
    });
    setModalError(null);
    setShowProcModal(true);
  };
  // Ao escolher veículo, preenche a placa (continua editável; placa manual permitida)
  const onSelectVehicle = (vehicleId) => {
    const v = vehicles.find(x => x.id === vehicleId);
    setProcForm(prev => ({ ...prev, vehicle_id: vehicleId, vehicle_plate: v?.plate || prev.vehicle_plate }));
  };
  const saveProc = async (e) => {
    e.preventDefault();
    setModalError(null);
    if (!procForm.service_id) { setModalError('Selecione o tipo de serviço.'); return; }
    if (!procForm.status)     { setModalError('Selecione o andamento.'); return; }
    try {
      setSaving(true);
      const payload = {
        company_id: companyId,
        vehicle_id: procForm.vehicle_id || null,
        service_id: procForm.service_id,
        numero_multa: procForm.numero_multa,
        vehicle_plate: procForm.vehicle_plate,
        organ: procForm.organ || null,
        status: procForm.status,
        due_date: procForm.due_date || null,
        notes: procForm.notes,
      };
      if (editingProc) await updateContract(editingProc.id, payload);
      else             await createContract(payload);
      setShowProcModal(false);
      load();
    } catch (err) { setModalError(err.message); } finally { setSaving(false); }
  };
  const removeProc = async (f) => {
    if (!confirm('Excluir este processo?')) return;
    try { await deleteContract(f.id); load(); }
    catch (err) { setError(err.message); }
  };

  const setC = (field) => (e) => {
    let v = e.target.value;
    if (field === 'cnpj') v = maskCnpj(v);
    if (field === 'phone') v = maskPhone(v);
    setCompanyForm(prev => ({ ...prev, [field]: v }));
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: 14 }}>
      <div className="loading-spinner" style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#751518' }} />
      <p style={{ color: '#94a3b8', fontSize: 14 }}>Carregando empresa...</p>
    </div>
  );
  if (!company) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
      Empresa não encontrada. <button className="btn-secondary" onClick={() => router.push('/dashboard?module=multas&tab=companies')}>Voltar</button>
    </div>
  );

  const activeVehicles = vehicles.filter(v => v.status !== 'inativo');

  return (
    <div className="client-detail-page" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Voltar + cabeçalho */}
      <div>
        <button onClick={() => router.push('/dashboard?module=multas&tab=companies')} className="btn-secondary" style={{ marginBottom: 14 }}>
          ← Empresas
        </button>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(117,21,24,0.1)', color: '#751518', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, flexShrink: 0 }}>
            {company.razao_social?.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>{company.razao_social}</h1>
              <span className={`client-status-badge ${company.status === 'inativo' ? 'negociacao' : 'fechado'}`}>
                {company.status === 'inativo' ? 'Inativo' : 'Ativo'}
              </span>
            </div>
            {company.nome_fantasia && <p style={{ color: '#64748b', fontSize: 13, margin: '2px 0 0' }}>{company.nome_fantasia}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginTop: 12, fontSize: 13, color: '#475569' }}>
              <div><strong>CNPJ:</strong> {maskCnpj(company.cnpj) || '—'}</div>
              <div><strong>Responsável:</strong> {company.responsavel || '—'}</div>
              <div><strong>Telefone:</strong> {company.phone || '—'}</div>
              <div><strong>E-mail:</strong> {company.email || '—'}</div>
              <div style={{ gridColumn: '1 / -1' }}><strong>Endereço:</strong> {company.address || '—'}</div>
              {company.notes && <div style={{ gridColumn: '1 / -1' }}><strong>Obs.:</strong> {company.notes}</div>}
            </div>
          </div>
          <button onClick={openCompanyEdit} className="btn-primary">Editar empresa</button>
        </div>
      </div>

      {error && (
        <div className="error-message" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0 }}>{error}</p>
          <button onClick={() => setError(null)} className="btn-close">✕</button>
        </div>
      )}

      {/* Veículos */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>Veículos / Frota</h2>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>{vehicles.length} veículo(s)</p>
          </div>
          <button onClick={openVehicleNew} className="btn-primary">+ Veículo</button>
        </div>
        {vehicles.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Nenhum veículo cadastrado.</div>
        ) : (
          <table className="data-table" style={{ border: 'none', borderRadius: 0 }}>
            <thead>
              <tr><th>Placa</th><th>Marca/Modelo</th><th>Ano</th><th>RENAVAM</th><th>Status</th><th style={{ width: 110 }}>Ações</th></tr>
            </thead>
            <tbody>
              {vehicles.map(v => (
                <tr key={v.id} style={v.status === 'inativo' ? { opacity: 0.55 } : undefined}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v.plate || '—'}</td>
                  <td>{[v.brand, v.model].filter(Boolean).join(' ') || '—'}</td>
                  <td>{v.year || '—'}</td>
                  <td style={{ color: '#475569' }}>{v.renavam || '—'}</td>
                  <td><span className={`client-status-badge ${v.status === 'inativo' ? 'negociacao' : 'fechado'}`}>{v.status === 'inativo' ? 'Inativo' : 'Ativo'}</span></td>
                  <td>
                    <div className="actions-cell">
                      <button onClick={() => openVehicleEdit(v)} className="btn-icon" title="Editar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => toggleVehicleStatus(v)} className="btn-icon" title={v.status === 'inativo' ? 'Ativar' : 'Inativar'}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.36 6.64A9 9 0 1 1 5.64 6.64"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
                      </button>
                      <button onClick={() => removeVehicle(v)} className="btn-icon danger" title="Excluir">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Processos vinculados */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>Processos / Multas</h2>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>{fines.length} processo(s) vinculado(s)</p>
          </div>
          <button onClick={openProcNew} className="btn-primary">+ Processo</button>
        </div>
        {fines.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Nenhum processo vinculado a esta empresa.</div>
        ) : (
          <table className="data-table" style={{ border: 'none', borderRadius: 0 }}>
            <thead>
              <tr><th>Nº Auto/Processo</th><th>Placa</th><th>Órgão</th><th>Prazo</th><th>Andamento</th><th>Serviço</th><th style={{ width: 80 }}>Ações</th></tr>
            </thead>
            <tbody>
              {fines.map(f => (
                <tr key={f.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{f.numero_multa || '—'}</td>
                  <td>{f.vehicle_plate || '—'}</td>
                  <td>{f.organ || '—'}</td>
                  <td style={{ fontSize: 13, ...getPrazoStyle(f.due_date) }}>{formatDate(f.due_date)}</td>
                  <td><span className="service-status-badge" style={getStatusStyle(f.status)}>{getStatusLabel(f.status)}</span></td>
                  <td style={{ color: '#64748b', fontSize: 13 }}>{f.service_name || '—'}</td>
                  <td>
                    <div className="actions-cell">
                      <button onClick={() => openProcEdit(f)} className="btn-icon" title="Editar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => removeProc(f)} className="btn-icon danger" title="Excluir">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Empresa */}
      {showCompanyModal && (
        <div className="modal-overlay" onClick={() => setShowCompanyModal(false)}>
          <div className="modal-content" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Editar Empresa</h2>
              <button type="button" onClick={() => setShowCompanyModal(false)} className="btn-close">✕</button>
            </div>
            {modalError && <div className="error-message" style={{ margin: '0 0 12px', fontSize: 13 }}>{modalError}</div>}
            <form onSubmit={saveCompany} className="modal-form">
              <div className="form-group"><label>Razão Social *</label><input value={companyForm.razao_social || ''} onChange={setC('razao_social')} required /></div>
              <div className="form-row">
                <div className="form-group"><label>Nome Fantasia</label><input value={companyForm.nome_fantasia || ''} onChange={setC('nome_fantasia')} /></div>
                <div className="form-group"><label>CNPJ *</label><input value={companyForm.cnpj || ''} onChange={setC('cnpj')} inputMode="numeric" required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Responsável</label><input value={companyForm.responsavel || ''} onChange={setC('responsavel')} /></div>
                <div className="form-group"><label>Telefone</label><input value={companyForm.phone || ''} onChange={setC('phone')} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>E-mail</label><input type="email" value={companyForm.email || ''} onChange={setC('email')} /></div>
                <div className="form-group"><label>Status *</label>
                  <select value={companyForm.status || 'ativo'} onChange={setC('status')}>
                    <option value="ativo">Ativo</option><option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>
              <div className="form-group"><label>Endereço</label><input value={companyForm.address || ''} onChange={setC('address')} /></div>
              <div className="form-group"><label>Observações</label><textarea rows={2} value={companyForm.notes || ''} onChange={setC('notes')} /></div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCompanyModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Veículo */}
      {showVehicleModal && (
        <div className="modal-overlay" onClick={() => setShowVehicleModal(false)}>
          <div className="modal-content" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{editingVehicle ? 'Editar Veículo' : 'Novo Veículo'}</h2>
              <button type="button" onClick={() => setShowVehicleModal(false)} className="btn-close">✕</button>
            </div>
            {modalError && <div className="error-message" style={{ margin: '0 0 12px', fontSize: 13 }}>{modalError}</div>}
            <form onSubmit={saveVehicle} className="modal-form">
              <div className="form-row">
                <div className="form-group"><label>Placa</label><input value={vehicleForm.plate} onChange={e => setVehicleForm(p => ({ ...p, plate: e.target.value.toUpperCase() }))} placeholder="ABC1D23" /></div>
                <div className="form-group"><label>Ano</label><input value={vehicleForm.year} onChange={e => setVehicleForm(p => ({ ...p, year: e.target.value.replace(/\D/g,'').slice(0,4) }))} inputMode="numeric" placeholder="2020" /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Marca</label><input value={vehicleForm.brand} onChange={e => setVehicleForm(p => ({ ...p, brand: e.target.value }))} /></div>
                <div className="form-group"><label>Modelo</label><input value={vehicleForm.model} onChange={e => setVehicleForm(p => ({ ...p, model: e.target.value }))} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>RENAVAM</label><input value={vehicleForm.renavam} onChange={e => setVehicleForm(p => ({ ...p, renavam: e.target.value.replace(/\D/g,'') }))} inputMode="numeric" /></div>
                <div className="form-group"><label>Status</label>
                  <select value={vehicleForm.status} onChange={e => setVehicleForm(p => ({ ...p, status: e.target.value }))}>
                    <option value="ativo">Ativo</option><option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>
              <div className="form-group"><label>Observações</label><textarea rows={2} value={vehicleForm.notes} onChange={e => setVehicleForm(p => ({ ...p, notes: e.target.value }))} /></div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowVehicleModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Processo */}
      {showProcModal && (
        <div className="modal-overlay" onClick={() => setShowProcModal(false)}>
          <div className="modal-content" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{editingProc ? 'Editar Processo' : 'Novo Processo'}</h2>
              <button type="button" onClick={() => setShowProcModal(false)} className="btn-close">✕</button>
            </div>
            {modalError && <div className="error-message" style={{ margin: '0 0 12px', fontSize: 13 }}>{modalError}</div>}
            <form onSubmit={saveProc} className="modal-form">
              <div className="form-row">
                <div className="form-group"><label>Tipo de Serviço *</label>
                  <select value={procForm.service_id} onChange={e => setProcForm(p => ({ ...p, service_id: e.target.value }))} required>
                    <option value="">Selecione...</option>
                    {serviceTypes.map(s => <option key={s.id} value={String(s.id)}>{s.label || s.code}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Nº Auto / Processo</label><input value={procForm.numero_multa} onChange={e => setProcForm(p => ({ ...p, numero_multa: e.target.value }))} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Veículo</label>
                  <select value={procForm.vehicle_id} onChange={e => onSelectVehicle(e.target.value)}>
                    <option value="">— Nenhum —</option>
                    {activeVehicles.map(v => <option key={v.id} value={v.id}>{v.plate || '(sem placa)'} {v.model ? `· ${v.model}` : ''}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Placa</label><input value={procForm.vehicle_plate} onChange={e => setProcForm(p => ({ ...p, vehicle_plate: e.target.value.toUpperCase() }))} placeholder="ABC1D23" /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Órgão Autuador</label>
                  <select value={procForm.organ} onChange={e => setProcForm(p => ({ ...p, organ: e.target.value }))}>
                    <option value="">Selecione...</option>
                    {getOrganOptions(procForm.organ).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Prazo</label><input type="date" value={procForm.due_date} onChange={e => setProcForm(p => ({ ...p, due_date: e.target.value }))} /></div>
              </div>
              <div className="form-group"><label>Andamento *</label>
                <select value={procForm.status} onChange={e => setProcForm(p => ({ ...p, status: e.target.value }))} required>
                  <option value="">Selecione...</option>
                  {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Observações</label><textarea rows={2} value={procForm.notes} onChange={e => setProcForm(p => ({ ...p, notes: e.target.value }))} /></div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowProcModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
