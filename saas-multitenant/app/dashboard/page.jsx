'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';

// Leads
import LeadsOverview     from '../leads/Overview';
import LeadsAcquisition  from '../leads/Acquisition';
import LeadsPipeline     from '../leads/Pipeline';
import LeadsLeaderboard  from '../leads/Leaderboard';
import LeadsExport       from '../leads/Export';
import LeadsPerformance  from '../leads/Performance';
import LeadsReports      from '../leads/Reports';

// Multas
import MultasDashboard from '../multas/Dashboard';
import MultasClients   from '../multas/Clients';
import MultasHistory   from '../multas/History';
import MultasLeads     from '../multas/Leads';

// Settings
import SettingsPage from '../settings/page';

const ComingSoon = ({ moduleName }) => (
  <div className="coming-soon">
    <div style={{ marginBottom: 20 }}>
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    </div>
    <h2>{moduleName}</h2>
    <p>Esta seção está em desenvolvimento</p>
  </div>
);

const modulePages = {
  leads: {
    pages: {
      overview:    LeadsOverview,
      acquisition: LeadsAcquisition,
      pipeline:    LeadsPipeline,
      leaderboard: LeadsLeaderboard,
      export:      LeadsExport,
      performance: LeadsPerformance,
      reports:     LeadsReports,
    },
  },
  multas: {
    pages: {
      dashboard:  MultasDashboard,
      clients:    MultasClients,
      leads:      MultasLeads,
      defesa:     () => <ComingSoon moduleName="Defesa Prévia" />,
      instancia1: () => <ComingSoon moduleName="1ª Instância" />,
      instancia2: () => <ComingSoon moduleName="2ª Instância" />,
      calendario: () => <ComingSoon moduleName="Calendário" />,
      documents:  () => <ComingSoon moduleName="Documentos" />,
      history:    MultasHistory,
    },
  },
  settings: {
    pages: {
      general:      SettingsPage,
      team:         () => <ComingSoon moduleName="Equipe" />,
      integrations: () => <ComingSoon moduleName="Integrações" />,
    },
  },
};

const getDefaultTab = (module) => {
  const defaults = { leads: 'overview', multas: 'dashboard', settings: 'general' };
  return defaults[module] || 'overview';
};

function CachedTabs({ moduleKey, activeTab }) {
  const moduleData = modulePages[moduleKey] || modulePages.leads;
  const mountedRef = useRef({});

  return (
    <>
      {Object.entries(moduleData.pages).map(([key, Page]) => {
        const isActive = key === activeTab;
        if (!isActive && !mountedRef.current[key]) return null;
        mountedRef.current[key] = true;
        return (
          <div key={key} style={{ display: isActive ? 'block' : 'none' }}>
            <Page />
          </div>
        );
      })}
    </>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser]       = useState(null);
  const [tenant, setTenant]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const currentModule = searchParams.get('module') || 'multas';
  const activeTab     = searchParams.get('tab')    || getDefaultTab(currentModule);

  useEffect(() => {
    // Aceita token de localStorage (primário) ou cookie (fallback)
    const lsToken    = localStorage.getItem('auth-token') || localStorage.getItem('token');
    const cookieTok  = document.cookie.includes('auth-token');
    const hasToken   = !!(lsToken || cookieTok);
    const userData   = localStorage.getItem('user');
    const tenantData = localStorage.getItem('tenant');
    if (!hasToken || !userData) { router.push('/login'); return; }
    setUser(JSON.parse(userData));
    setTenant(JSON.parse(tenantData || '{}'));
    setLoading(false);
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (_) {}
    finally {
      ['user', 'tenant', 'token', 'auth-token', 'tenantId', 'tenant-id'].forEach(k => localStorage.removeItem(k));
      ['token', 'auth-token', 'tenantId'].forEach(k => {
        document.cookie = `${k}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC`;
      });
      router.push('/login');
    }
  };

  const handleNavigate = (moduleKey, tabKey) => {
    setMobileSidebarOpen(false);
    router.push(`/dashboard?module=${moduleKey}&tab=${tabKey}`);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Carregando ChronosTek...</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="sidebar-mobile-overlay"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <Sidebar
        currentModule={currentModule}
        currentTab={activeTab}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(v => !v)}
        mobileOpen={mobileSidebarOpen}
      />

      <div className={`shell-main${sidebarCollapsed ? ' sidebar-is-collapsed' : ''}`}>
        <PageHeader
          currentTab={activeTab}
          user={user}
          tenant={tenant}
          onLogout={handleLogout}
          onMobileMenuToggle={() => setMobileSidebarOpen(v => !v)}
        />
        <div className="shell-content">
          <CachedTabs moduleKey={currentModule} activeTab={activeTab} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Carregando...</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
