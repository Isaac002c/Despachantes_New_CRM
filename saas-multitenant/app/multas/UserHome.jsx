'use client';

import { useRouter } from 'next/navigation';

function CRResourcesLogo({ size = 80 }) {
  return (
    <svg width={size} height={size * 0.82} viewBox="0 0 100 82" fill="none">
      {/* Scales of justice */}
      <line x1="70" y1="4" x2="70" y2="32" stroke="#751518" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="58" y1="10" x2="82" y2="10" stroke="#751518" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M56 10 Q52 18 56 22 Q60 26 64 22 Q68 18 64 10" fill="none" stroke="#751518" strokeWidth="2"/>
      <path d="M76 10 Q72 18 76 22 Q80 26 84 22 Q88 18 84 10" fill="none" stroke="#751518" strokeWidth="2"/>
      <line x1="64" y1="32" x2="76" y2="32" stroke="#751518" strokeWidth="2" strokeLinecap="round"/>
      {/* Car silhouette */}
      <path d="M4 56 L7 46 Q10 40 16 39 L22 36 Q25 34 36 34 L60 36 Q64 37 66 40 L72 47 L76 56 Q76 61 72 61 L10 61 Q4 61 4 56Z"
            fill="#751518"/>
      <circle cx="18" cy="61" r="7" fill="#050708"/>
      <circle cx="60" cy="61" r="7" fill="#050708"/>
      <circle cx="18" cy="61" r="3.5" fill="#751518" opacity="0.6"/>
      <circle cx="60" cy="61" r="3.5" fill="#751518" opacity="0.6"/>
      <path d="M20 39 L27 48 L58 48 L65 39 Z" fill="white" opacity="0.2"/>
      {/* Ground line */}
      <line x1="0" y1="72" x2="100" y2="72" stroke="#d3cfc3" strokeWidth="1.5"/>
    </svg>
  );
}

const quickActionsConsultor = [
  {
    label: 'Leads',
    desc: 'Lista e cadastro de leads',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
      </svg>
    ),
    route: '/dashboard?module=multas&tab=leads',
    primary: true,
  },
  {
    label: 'Tarefas',
    desc: 'Quadro kanban operacional',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
        <polyline points="9 16 11 18 15 14"/>
      </svg>
    ),
    route: '/dashboard?module=multas&tab=tarefas',
  },
  {
    label: 'Clientes',
    desc: 'Lista de clientes cadastrados',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    route: '/dashboard?module=multas&tab=clients',
  },
];

export default function UserHome({ user }) {
  const router    = useRouter();
  const isAdmin   = user?.role === 'admin';
  const firstName = user?.name?.split(' ')[0] || 'bem-vindo';
  const greeting  = isAdmin ? `Olá, ${firstName}!` : `Olá, Consultor ${firstName}!`;
  const actions   = quickActionsConsultor;

  return (
    <div className="user-home">
      {/* Hero */}
      <div className="user-home-hero">
        <div className="user-home-logos">
          <CRResourcesLogo size={72} />
        </div>
        <div className="user-home-welcome">
          <p className="user-home-greeting">{greeting}</p>
          <h1 className="user-home-title">CR Recursos</h1>
          <p className="user-home-subtitle">Assessoria de Trânsito</p>
          <p className="user-home-desc">
            Selecione uma ação abaixo para começar ou use o menu lateral para navegar.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="user-home-actions-title">O que deseja fazer?</div>
      <div className="user-home-grid">
        {actions.map((action) => (
          <button
            key={action.label}
            className={`user-home-card${action.primary ? ' primary' : ''}`}
            onClick={() => router.push(action.route)}
          >
            <div className={`user-home-card-icon${action.primary ? ' primary' : ''}`}>
              {action.icon}
            </div>
            <div className="user-home-card-body">
              <span className="user-home-card-label">{action.label}</span>
              <span className="user-home-card-desc">{action.desc}</span>
            </div>
            <svg className="user-home-card-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="user-home-footer">
        <span>Powered by</span>
        <img src="/logoChronosTech.png" alt="ChronosTek" style={{ height: 20, opacity: 0.5 }} />
        <span>ChronosTek</span>
      </div>
    </div>
  );
}
