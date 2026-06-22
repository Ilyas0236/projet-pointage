/* eslint-disable */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function AnomaliesEmployee() {
  const router = useRouter();
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAnomalies = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      const response = await axios.get('/api/anomalies', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnomalies(response.data || []);
    } catch (err) {
      console.error('Error fetching anomalies:', err);
      if (err.response?.status === 401) router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAnomalies();
  }, [fetchAnomalies]);

  const handleOpenModal = (anomaly) => {
    setSelectedAnomaly(anomaly);
    setMessage('');
    setFile(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedAnomaly(null);
  };

  const handleSubmitJustification = async (e) => {
    e.preventDefault();
    if (!selectedAnomaly) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('anomalyId', selectedAnomaly._id);
      formData.append('message', message);
      if (file) {
        formData.append('file', file);
      }

      await axios.post('/api/anomalies/justifier', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
        },
      });

      alert('Justificatif envoyé avec succès à l\'administrateur.');
      handleCloseModal();
      fetchAnomalies(); // Refresh list
    } catch (error) {
      console.error('Upload error', error);
      const errorMsg = error.response?.data?.error || 'Erreur lors de l\'envoi du justificatif.';
      alert(errorMsg);
    } finally {
      setIsSubmitting(false);
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
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Mes Anomalies</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>Consultez vos anomalies et justifiez-les.</p>
        </div>
      </div>

      <div className="bento-col-12 glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        {anomalies.length === 0 ? (
          <div className="empty-state">
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Aucune anomalie</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Vous n'avez aucune anomalie détectée. Beau travail !</p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Statut Justificatif</th>
                  <th>Résolu</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.map((a) => (
                  <tr key={a._id}>
                    <td style={{ fontWeight: 500 }}>
                      {new Date(a.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })}
                    </td>
                    <td>
                      <span className="badge badge-error">
                        {a.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{a.description}</td>
                    <td>
                      {a.statutJustification === 'AUCUNE' && <span className="badge" style={{background:'#333', color:'white'}}>Aucun</span>}
                      {a.statutJustification === 'EN_ATTENTE' && <span className="badge badge-warning">En attente</span>}
                      {a.statutJustification === 'ACCEPTEE' && <span className="badge badge-success">Acceptée</span>}
                      {a.statutJustification === 'REFUSEE' && <span className="badge badge-error">Refusée</span>}
                    </td>
                    <td>
                      <span className={`badge ${a.resolu ? 'badge-success' : 'badge-error'}`}>
                        {a.resolu ? 'Oui' : 'Non'}
                      </span>
                    </td>
                    <td>
                      {!a.resolu && a.statutJustification !== 'EN_ATTENTE' && a.statutJustification !== 'ACCEPTEE' && (
                        <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleOpenModal(a)}>
                          Justifier
                        </button>
                      )}
                      {a.commentaireAdmin && (
                        <div style={{ marginTop: '5px', fontSize: '0.8rem', color: 'var(--error)' }}>
                          <strong>Admin:</strong> {a.commentaireAdmin}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ padding: '24px', width: '100%', maxWidth: '500px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px' }}>Justifier l'anomalie</h2>
            <form onSubmit={handleSubmitJustification}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Message (optionnel)</label>
                <textarea 
                  className="input-field" 
                  rows="3" 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  placeholder="Expliquez la raison de cette anomalie..."
                ></textarea>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Fichier justificatif (certificat, photo...)</label>
                <input 
                  type="file" 
                  className="input-field" 
                  onChange={(e) => setFile(e.target.files[0])}
                  accept="image/*,.pdf,.doc,.docx"
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={handleCloseModal} disabled={isSubmitting}>Annuler</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Envoi...' : 'Envoyer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
