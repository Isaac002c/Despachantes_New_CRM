'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../lib/api.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      // Armazenar token em cookie HTTP-only (backend envia cookie)
      // Salva no localStorage para uso nas chamadas API
      if (data.token) {
        // Token em localStorage para o header Authorization nas chamadas API
        // O backend também envia cookie httpOnly via Set-Cookie (mais seguro)
        localStorage.setItem('token', data.token);
        localStorage.setItem('auth-token', data.token);
      }

      // Salvar dados do usuário
      const userData = {
        ...data.user,
        role: data.user.role || 'admin'
      };
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('tenant', JSON.stringify(data.tenant));
      
      localStorage.setItem('tenantId', data.tenant?.id || '');

      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      background: 'linear-gradient(160deg, #050708 0%, #1a0506 60%, #2d0a0b 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(117,21,24,0.3)',
        padding: '48px 40px',
        borderRadius: '16px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(117,21,24,0.15)',
        width: '100%',
        maxWidth: '420px'
      }}>
        {/* Logo CR */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            background: '#751518',
            borderRadius: '16px',
            marginBottom: '16px',
            boxShadow: '0 4px 24px rgba(117,21,24,0.5)'
          }}>
            <svg width="32" height="26" viewBox="0 0 44 36" fill="none">
              <line x1="30" y1="2" x2="30" y2="14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="24" y1="5" x2="36" y2="5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <path d="M23 5 Q21 9 23 11 Q25 13 27 11 Q29 9 27 5" fill="none" stroke="white" strokeWidth="1.5"/>
              <path d="M33 5 Q31 9 33 11 Q35 13 37 11 Q39 9 37 5" fill="none" stroke="white" strokeWidth="1.5"/>
              <path d="M2 24 L4 19 Q6 16 9 16 L12 14 Q14 13 18 13 L26 14 Q27 14 28 16 L31 19 L33 24 Q33 27 31 27 L5 27 Q2 27 2 24Z"
                    fill="white" opacity="0.9"/>
              <circle cx="9" cy="27" r="3" fill="white" opacity="0.7"/>
              <circle cx="25" cy="27" r="3" fill="white" opacity="0.7"/>
            </svg>
          </div>
          <h1 style={{
            fontSize: '26px',
            fontWeight: '700',
            color: '#ffffff',
            marginBottom: '4px',
            letterSpacing: '-0.5px'
          }}>
            CR Recursos
          </h1>
          <p style={{ color: '#d3cfc3', fontSize: '13px', opacity: 0.7 }}>
            Assessoria de Trânsito · Sistema de Gestão
          </p>
        </div>

        <form onSubmit={handleLogin}>
          {error && (
            <div style={{
              background: '#fef2f2',
              color: '#ef4444',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#d3cfc3',
              fontSize: '13px',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              E-mail
            </label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(117,21,24,0.4)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#d3cfc3',
              fontSize: '13px',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Senha
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(117,21,24,0.4)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#5e1012' : '#751518',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.8 : 1,
              fontSize: '15px',
              fontWeight: '600',
              letterSpacing: '0.3px',
              transition: 'background 0.2s, transform 0.1s',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(117,21,24,0.4)'
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: '24px',
          color: 'rgba(211,207,195,0.35)',
          fontSize: '11px',
          letterSpacing: '0.5px'
        }}>
          CR Recursos Assessoria de Trânsito
        </p>
      </div>
    </div>
  );
}
