/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function EmployeeProfile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    try {
      const currentUser = JSON.parse(userStr);
      setUser(currentUser);
      setNom(currentUser.nom);
      setEmail(currentUser.email);
    } catch (err) {
      console.error('Erreur parsing user localStorage', err);
      router.push('/login');
      return;
    }
    
    setLoading(false);
  }, [router]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    const token = localStorage.getItem('token');
    try {
      const response = await axios.put(
        '/api/profil',
        { nom, email, oldPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess(response.data.message);
      
      // Update local storage
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      
      // Clear password fields
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la mise à jour.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Chargement de votre profil...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '30px 20px', width: '100%' }}>
      {/* Back button */}
      <div style={{ marginBottom: '24px' }}>
        <button className="btn-secondary" onClick={() => router.push(user.role === 'ADMIN' ? '/admin' : '/dashboard')}>
          ← Retour à l'accueil
        </button>
      </div>

      <div className="glass-card animate-fade-in">
        <h2 className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '20px' }}>
          Mon Profil
        </h2>

        {error && (
          <div style={{ padding: '10px 14px', backgroundColor: 'var(--error-bg)', color: 'var(--error)', border: '1px solid var(--error-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ padding: '10px 14px', backgroundColor: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '16px' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Nom complet</label>
              <input
                type="text"
                className="form-input"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Adresse Email</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', background: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Matricule</label>
              <div style={{ fontWeight: 600, marginTop: '4px' }}>{user.matricule || 'N/A'}</div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Département</label>
              <div style={{ fontWeight: 600, marginTop: '4px' }}>{user.departement || 'N/A'}</div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Rôle</label>
              <div style={{ marginTop: '4px' }}>
                <span className="badge badge-info">{user.role}</span>
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '10px', color: 'var(--text-primary)' }}>
            Changer le mot de passe (Optionnel)
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ancien mot de passe</label>
              <input
                type="password"
                className="form-input"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Laissez vide pour ne pas modifier"
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Nouveau mot de passe</label>
              <input
                type="password"
                className="form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Laissez vide pour ne pas modifier"
              />
            </div>
          </div>

          <div style={{ marginTop: '10px' }}>
            <button type="submit" className="btn-primary" disabled={submitting} style={{ width: '100%' }}>
              {submitting ? 'Mise à jour...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
