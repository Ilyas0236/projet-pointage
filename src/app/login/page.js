/* eslint-disable */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password,
      });

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error || 'Email ou mot de passe incorrect'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        background: '#09090b',
      }}
    >
      {/* Animated gradient blobs */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: '-10%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(14,165,233,0.15) 0%, transparent 70%)',
        filter: 'blur(60px)',
        animation: 'float1 8s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        right: '-10%',
        width: '450px',
        height: '450px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
        filter: 'blur(60px)',
        animation: 'float2 10s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(14,165,233,0.06) 0%, transparent 70%)',
        filter: 'blur(40px)',
      }} />

      <style jsx>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-25px, 25px) scale(1.05); }
          66% { transform: translate(30px, -15px) scale(0.95); }
        }
      `}</style>

      <div
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '44px 36px',
          background: 'rgba(24, 24, 27, 0.7)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '36px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
            color: 'white',
            borderRadius: '14px',
            width: '52px',
            height: '52px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '800',
            fontSize: '1.1rem',
            marginBottom: '20px',
            boxShadow: '0 8px 24px rgba(14,165,233,0.3)',
            letterSpacing: '-0.02em',
            fontFamily: 'var(--font-heading)',
          }}>ST</div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '8px', color: '#fafafa', letterSpacing: '-0.03em', fontFamily: 'var(--font-heading)' }}>
            Connexion
          </h2>
          <p style={{ color: '#a1a1aa', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Connectez-vous pour accéder à votre espace
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(239,68,68,0.1)',
              color: '#ef4444',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '10px',
              fontSize: '0.85rem',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Adresse Email
            </label>
            <input
              type="email"
              placeholder="nom@entreprise.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'rgba(39,39,42,0.6)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                color: '#fafafa',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#0ea5e9'; e.target.style.boxShadow = '0 0 0 3px rgba(14,165,233,0.15)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Mot de Passe
              </label>
              <span style={{ fontSize: '0.8rem', color: '#0ea5e9', cursor: 'pointer', fontWeight: 500 }}>
                Oublié ?
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 44px 12px 14px',
                  background: 'rgba(39,39,42,0.6)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  color: '#fafafa',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#0ea5e9'; e.target.style.boxShadow = '0 0 0 3px rgba(14,165,233,0.15)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#71717a',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                }}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              marginTop: '4px',
              background: loading ? 'rgba(14,165,233,0.5)' : 'linear-gradient(135deg, #0ea5e9, #0284c7)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 16px rgba(14,165,233,0.25)',
              letterSpacing: '0.01em',
            }}
            onMouseEnter={(e) => { if (!loading) { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 6px 24px rgba(14,165,233,0.35)'; } }}
            onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 16px rgba(14,165,233,0.25)'; }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                Vérification...
              </span>
            ) : 'Se connecter'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.875rem' }}>
            <span style={{ color: '#71717a' }}>Vous n&apos;avez pas de compte ?{' '}</span>
            <Link href="/register" style={{ color: '#0ea5e9', fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s' }}>
              S&apos;inscrire
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
