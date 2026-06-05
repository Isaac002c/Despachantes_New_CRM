'use client';

import { useState } from 'react';
import Image from 'next/image';

const Icons = {
  Dashboard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  Clients: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Shield: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Clock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.07 4.93a10 10 0 0 0-14.14 0M4.93 19.07a10 10 0 0 0 14.14 0M2 12h2M20 12h2M12 2v2M12 20v2"/>
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  Target: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  Tasks: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <polyline points="9 16 11 18 15 14"/>
    </svg>
  ),
  Approvals: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
  TrendingUp: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  BarChart: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  Award: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7"/>
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
    </svg>
  ),
  Download: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  File: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
  Layers: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
  Mail: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22 6 12 13 2 6"/>
    </svg>
  ),
};

// Itens com roles[] = visíveis apenas para essas roles. Sem roles[] = todos.
const sidebarConfig = {
  multas: {
    label: 'CR Recursos',
    items: [
      { key: 'dashboard',  label: 'Dashboard',  Icon: Icons.Dashboard,  tab: 'dashboard',  roles: ['admin'] },
      { key: 'clients',    label: 'Clientes',   Icon: Icons.Clients,    tab: 'clients' },
      { key: 'leads',      label: 'Leads',      Icon: Icons.Target,     tab: 'leads' },
      { key: 'tarefas',    label: 'Tarefas',    Icon: Icons.Tasks,      tab: 'tarefas' },
      { key: 'history',    label: 'Histórico',  Icon: Icons.Clock,      tab: 'history',    roles: ['admin'] },
      { key: 'approvals',  label: 'Aprovações', Icon: Icons.Approvals,  tab: 'approvals',  roles: ['admin'] },
    ],
  },
  leads: {
    label: 'Gestão de Leads',
    items: [
      { key: 'overview',    label: 'Overview',    Icon: Icons.Dashboard,  tab: 'overview' },
      { key: 'acquisition', label: 'Aquisição',   Icon: Icons.Target,     tab: 'acquisition' },
      { key: 'pipeline',    label: 'Pipeline',    Icon: Icons.TrendingUp, tab: 'pipeline' },
      { key: 'leaderboard', label: 'Ranking',     Icon: Icons.Award,      tab: 'leaderboard' },
      { key: 'performance', label: 'Performance', Icon: Icons.BarChart,   tab: 'performance' },
      { key: 'export',      label: 'Exportar',    Icon: Icons.Download,   tab: 'export' },
      { key: 'reports',     label: 'Relatórios',  Icon: Icons.File,       tab: 'reports' },
    ],
  },
  settings: {
    label: 'Configurações',
    items: [
      { key: 'general',      label: 'Geral',       Icon: Icons.Settings, tab: 'general' },
      { key: 'team',         label: 'Equipe',      Icon: Icons.Clients,  tab: 'team' },
      { key: 'integrations', label: 'Integrações', Icon: Icons.Layers,   tab: 'integrations' },
    ],
  },
};

const modules = [
  { key: 'multas', label: 'CR Recursos' },
];

function CRLogo({ collapsed }) {
  return (
    <div className="sidebar-logo">
      <div className="cr-logo-icon" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logos/cr-recursos.png"
          alt="CR Recursos"
          style={{ height: collapsed ? 28 : 32, width: 'auto', objectFit: 'contain' }}
          onError={e => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling.style.display = 'block';
          }}
        />
        {/* Fallback SVG quando PNG não encontrado */}
        <svg width="26" height="22" viewBox="0 0 44 36" fill="none" style={{ display: 'none' }}>
          <line x1="30" y1="2" x2="30" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="24" y1="5" x2="36" y2="5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M23 5 Q21 9 23 11 Q25 13 27 11 Q29 9 27 5" fill="none" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M33 5 Q31 9 33 11 Q35 13 37 11 Q39 9 37 5" fill="none" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M2 24 L4 19 Q6 16 9 16 L12 14 Q14 13 18 13 L26 14 Q27 14 28 16 L31 19 L33 24 Q33 27 31 27 L5 27 Q2 27 2 24Z" fill="currentColor" opacity="0.9"/>
          <circle cx="9" cy="27" r="3" fill="currentColor" opacity="0.7"/>
          <circle cx="25" cy="27" r="3" fill="currentColor" opacity="0.7"/>
        </svg>
      </div>
      {!collapsed && (
        <div className="sidebar-brand">
          <span className="sidebar-brand-name">CR Recursos</span>
          <span className="sidebar-brand-sub">Assessoria de Trânsito</span>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ currentModule, currentTab, onNavigate, collapsed, onToggleCollapse, mobileOpen, user }) {
  const config   = sidebarConfig[currentModule] || sidebarConfig.multas;
  const userRole = user?.role || 'seller';

  // Filtra itens visíveis para a role atual
  const visibleItems = config.items.filter(item =>
    !item.roles || item.roles.includes(userRole)
  );

  const classes = [
    'sidebar',
    collapsed ? 'sidebar-collapsed' : '',
    mobileOpen ? 'sidebar-mobile-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <aside className={classes}>
      <CRLogo collapsed={collapsed} />

      {collapsed && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />}

      {!collapsed && (
        <div className="sidebar-modules">
          {modules.map(m => (
            <button
              key={m.key}
              className={`sidebar-module-btn${currentModule === m.key ? ' active' : ''}`}
              onClick={() => onNavigate(m.key, sidebarConfig[m.key]?.items[0]?.tab || 'dashboard')}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      <div className="sidebar-divider" />

      <nav className="sidebar-nav">
        {!collapsed && <span className="sidebar-section-label">NAVEGAÇÃO</span>}
        {visibleItems.map(item => {
          const isActive = currentTab === item.tab;
          return (
            <button
              key={item.key}
              className={`sidebar-item${isActive ? ' active' : ''}`}
              onClick={() => onNavigate(currentModule, item.tab)}
              title={collapsed ? item.label : undefined}
            >
              <span className="sidebar-item-icon"><item.Icon /></span>
              {!collapsed && <span className="sidebar-item-label">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      {currentModule !== 'settings' && (
        <>
          <div className="sidebar-divider" />
          <button
            className="sidebar-item sidebar-item-settings"
            onClick={() => onNavigate('settings', 'general')}
            title={collapsed ? 'Configurações' : undefined}
          >
            <span className="sidebar-item-icon"><Icons.Settings /></span>
            {!collapsed && <span className="sidebar-item-label">Configurações</span>}
          </button>
        </>
      )}

      <div className="sidebar-footer">
        {!collapsed && (
          <div className="sidebar-footer-support">
            <span className="sidebar-footer-label">
              <Icons.Mail /> Suporte
            </span>
            <a href="mailto:contato@chronostek.com.br" className="sidebar-footer-email">
              contato@chronostek.com.br
            </a>
          </div>
        )}
        <button
          className="sidebar-collapse-btn"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <Icons.ChevronRight /> : <Icons.ChevronLeft />}
        </button>
      </div>
    </aside>
  );
}
