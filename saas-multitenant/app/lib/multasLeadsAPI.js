import { apiRequest } from './api.js';

const BASE = '/api/multas-leads';

export const getMultasLeads = async () =>
  (await apiRequest(BASE)).data;

export const getMultasLeadsStats = async () =>
  (await apiRequest(`${BASE}/stats`)).data;

export const createMultasLead = async (data) =>
  (await apiRequest(BASE, { method: 'POST', body: data })).data;

export const updateMultasLead = async (id, data) =>
  (await apiRequest(`${BASE}/${id}`, { method: 'PUT', body: data })).data;

export const updateMultasLeadStatus = async (id, status) =>
  (await apiRequest(`${BASE}/${id}/status`, { method: 'PATCH', body: { status } })).data;

export const deleteMultasLead = async (id) =>
  (await apiRequest(`${BASE}/${id}`, { method: 'DELETE' })).data;
