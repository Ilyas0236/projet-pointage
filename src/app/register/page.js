'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

export default function RegisterPage() {
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [matricule, setMatricule] = useState('');
  const [departement, setDepartement] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/register', {
        nom,
        email,
        password,
        role: 'EMPLOYE',
        matricule,
        departement,
      });

      setSuccess(response.data.message);
      
      // Optionally redirect to login after a few seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error || 'Erreur lors de la création du compte'
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
        padding: '20px',
      }}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '500px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2
            className="text-gradient"
            style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}
          >
            Inscription
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Créez votre compte employé
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--error-bg)',
              color: 'var(--error)',
              border: '1px solid var(--error-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9rem',
              marginBottom: '20px',
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--success-bg)',
              color: 'var(--success)',
              border: '1px solid var(--success-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9rem',
              marginBottom: '20px',
            }}
          >
            {success} Vous allez être redirigé vers la page de connexion.
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Nom Complet</label>
            <input
              type="text"
              className="form-input"
              placeholder="Jean Dupont"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Adresse Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="jean.dupont@entreprise.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Mot de Passe</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Matricule</label>
              <input
                type="text"
                className="form-input"
                placeholder="EMP001"
                value={matricule}
                onChange={(e) => setMatricule(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Département</label>
              <input
                type="text"
                className="form-input"
                placeholder="R&D"
                value={departement}
                onChange={(e) => setDepartement(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !!success}
            style={{ width: '100%', marginTop: '20px', padding: '14px' }}
          >
            {loading ? 'Inscription en cours...' : "S'inscrire"}
          </button>
          
          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Vous avez déjà un compte ? </span>
            <Link href="/login" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>
              Connectez-vous
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
