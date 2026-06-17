/* eslint-disable */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from '@/components/Toast';
import SkeletonLoader from '@/components/SkeletonLoader';

export default function EmployeeConges() {
  const router = useRouter();
  const [conges, setConges] = useState([]);
  const [balance, setBalance] = useState({ quota: 25, utilises: 0, solde: 25 });
  const [loading, setLoading] = useState(true);

  // Form states
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [type, setType] = useState('ANNUEL');
  const [motif, setMotif] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);


  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get('/api/conges', { headers });
      setConges(response.data.conges || []);
      setBalance(response.data.balance || { quota: 25, utilises: 0, solde: 25 });
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        '/api/conges',
        {
          date_debut: dateDebut,
          date_fin: dateFin,
          type,
          motif,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast(response.data.message || 'Demande soumise avec succès', 'success');
      // Reset form
      setDateDebut('');
      setDateFin('');
      setMotif('');
      // Reload lists and balance
      await fetchData();
    } catch (err) {
      console.error(err);
      toast(err.response?.data?.error || 'Erreur lors de la soumission de la demande.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async (id) => {
    if (!confirm('Voulez-vous vraiment annuler cette demande ?')) return;

    const token = localStorage.getItem('token');
    try {
      await axios.delete(`/api/conges/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast('Demande annulée', 'info');
      await fetchData();
    } catch (err) {
      toast(err.response?.data?.error || "Erreur lors de l'annulation de la demande.", 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="skeleton skeleton-circle" style={{ width: '40px', height: '40px' }}></div>
      </div>
    );
  }

  return (
    <div className="bento-container animate-fade-in">
      <div className="bento-col-12" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Congés & Absences</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>Gérez vos demandes et consultez votre solde.</p>
        </div>
      </div>

      {/* Left Column: Balance & Form */}
      <div className="bento-col-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Balance Card */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Solde Actuel</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{balance.solde}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Restants</div>
            </div>
            <div style={{ width: '1px', height: '40px', background: 'var(--border-default)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>{balance.utilises}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pris</div>
            </div>
            <div style={{ width: '1px', height: '40px', background: 'var(--border-default)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>{balance.quota}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</div>
            </div>
          </div>
        </div>

        {/* Request Form */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Nouvelle Demande</h3>

          <form onSubmit={handleCreateRequest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Début</label>
                <input
                  type="date"
                  className="form-input"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  required
                />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Fin</label>
                <input
                  type="date"
                  className="form-input"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Type de Congé</label>
              <select
                className="form-input"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="ANNUEL">Congé Annuel</option>
                <option value="MALADIE">Maladie</option>
                <option value="EXCEPTIONNEL">Exceptionnel</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Motif (Optionnel)</label>
              <textarea
                className="form-input"
                placeholder="Raison de l'absence..."
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                rows="2"
              ></textarea>
            </div>

            <button type="submit" className="btn-primary" disabled={submitting} style={{ width: '100%', marginTop: '8px', padding: '12px' }}>
              {submitting ? 'Envoi...' : 'Soumettre'}
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: History Table */}
      <div className="bento-col-8 glass-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Historique des Demandes</h3>
        </div>

        {conges.length === 0 ? (
          <div className="empty-state" style={{ flex: 1 }}>
            <svg className="empty-state-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Aucune demande</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Vos demandes de congés apparaîtront ici.</p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0, flex: 1 }}>
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Période</th>
                  <th>Durée</th>
                  <th>Type</th>
                  <th>Statut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {conges.map((c) => {
                  const diffTime = Math.abs(new Date(c.date_fin) - new Date(c.date_debut));
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                  let badgeClass = 'badge-pending';
                  if (c.statut === 'VALIDE') badgeClass = 'badge-success';
                  if (c.statut === 'REFUSE') badgeClass = 'badge-error';
                  if (c.statut === 'ANNULE') badgeClass = 'badge-info';

                  return (
                    <tr key={c._id}>
                      <td style={{ fontWeight: 500 }}>
                        <div style={{ color: 'var(--text-primary)' }}>{new Date(c.date_debut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>au {new Date(c.date_fin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{diffDays} jrs</td>
                      <td>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.type}</span>
                      </td>
                      <td>
                        <span className={`badge ${badgeClass}`}>{c.statut}</span>
                      </td>
                      <td>
                        {c.statut === 'EN_ATTENTE' ? (
                          <button
                            onClick={() => handleCancelRequest(c._id)}
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.75rem',
                              backgroundColor: 'var(--bg-hover)',
                              color: 'var(--error)',
                              border: '1px solid var(--border-default)',
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer',
                              fontWeight: 600,
                              transition: 'var(--transition-fast)'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = 'var(--error-bg)'; e.currentTarget.style.borderColor = 'var(--error-border)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'var(--border-default)'; }}
                          >
                            Annuler
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
