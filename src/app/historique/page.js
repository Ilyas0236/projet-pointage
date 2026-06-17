/* eslint-disable */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function EmployeeHistorique() {
  const router = useRouter();
  const [pointages, setPointages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPointages = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await axios.get('/api/pointage', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPointages(response.data || []);
    } catch (err) {
      console.error('Error fetching employee pointages:', err);
      if (err.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchPointages();
  }, [fetchPointages]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="skeleton skeleton-circle" style={{ width: '40px', height: '40px' }}></div>
      </div>
    );
  }

  const entriesCount = pointages.filter((p) => p.type === 'ENTREE').length;
  const exitsCount = pointages.filter((p) => p.type === 'SORTIE').length;

  return (
    <div className="bento-container animate-fade-in">
      <div className="bento-col-12" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Historique</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>Consultez la trace de tous vos pointages passés.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="bento-col-4 glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ background: 'var(--primary-soft)', color: 'var(--primary)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Pointages</span>
        </div>
        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{pointages.length}</div>
      </div>

      <div className="bento-col-4 glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
          </div>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Entrées</span>
        </div>
        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{entriesCount}</div>
      </div>

      <div className="bento-col-4 glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ background: 'var(--info-bg)', color: 'var(--info)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </div>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sorties</span>
        </div>
        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{exitsCount}</div>
      </div>

      {/* History Table */}
      <div className="bento-col-12 glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Journal des Activités</h3>
        </div>

        {pointages.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-state-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Aucun pointage</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Vos activités apparaîtront ici dès que vous commencerez à pointer.</p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Heure</th>
                  <th>Type</th>
                  <th>Localisation</th>
                  <th>Coordonnées</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {pointages.map((p) => {
                  return (
                    <tr key={p._id}>
                      <td style={{ fontWeight: 500 }}>
                        {new Date(p.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {p.heure}
                      </td>
                      <td>
                        <span className={`badge ${p.type === 'ENTREE' ? 'badge-success' : 'badge-info'}`}>
                          {p.type}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                          {p.zone?.nom || 'Locaux'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {p.latitude?.toFixed(4)}, {p.longitude?.toFixed(4)}
                      </td>
                      <td>
                        <span className={`badge ${p.valide ? 'badge-success' : 'badge-error'}`}>
                          {p.valide ? 'Valide' : 'Invalide'}
                        </span>
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
