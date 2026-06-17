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

      // Redirect based on role
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
        position: 'relative'
      }}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '40px 32px',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ 
            background: 'var(--primary)', 
            color: 'white', 
            borderRadius: '12px', 
            width: '48px', 
            height: '48px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontWeight: '800', 
            fontSize: '1.4rem',
            marginBottom: '16px',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
          }}>C</div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Connexion
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Connectez-vous pour accéder à votre espace
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--error-bg)',
              color: 'var(--error)',
              border: '1px solid var(--error-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem',
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

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label
              style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
              }}
            >
              Adresse Email
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="nom@entreprise.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                }}
              >
                Mot de Passe
              </label>
              <span style={{ fontSize: '0.8rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}>
                Oublié ?
              </span>
            </div>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '8px', padding: '12px' }}
          >
            {loading ? 'Vérification...' : 'Se connecter'}
          </button>
          
          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Vous n'avez pas de compte ? </span>
            <Link href="/register" style={{ color: 'var(--primary)', fontWeight: '500', textDecoration: 'none' }}>
              S'inscrire
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
