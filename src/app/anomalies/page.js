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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-foreground to-surface-400 font-heading">
            Mes Anomalies
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">Consultez vos anomalies et justifiez-les.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-error text-sm px-3 py-1">{anomalies.length} anomalie{anomalies.length > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Table Card */}
      <div className="card p-0 overflow-hidden">
        {anomalies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-foreground mb-1">Aucune anomalie</h4>
            <p className="text-sm text-muted-foreground max-w-xs">Vous n'avez aucune anomalie détectée. Beau travail !</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Justificatif</th>
                  <th>Résolu</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.map((a) => (
                  <tr key={a._id}>
                    <td className="font-semibold text-foreground whitespace-nowrap">
                      {new Date(a.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })}
                    </td>
                    <td>
                      <span className="badge badge-error">
                        {a.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="text-muted-foreground max-w-[200px] truncate">{a.description}</td>
                    <td>
                      {a.statutJustification === 'AUCUNE' && <span className="badge bg-surface-700 text-surface-300 border-surface-600">Aucun</span>}
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
                        <button className="btn-primary h-8 px-3 text-xs" onClick={() => handleOpenModal(a)}>
                          Justifier
                        </button>
                      )}
                      {a.commentaireAdmin && (
                        <div className="mt-2 text-xs text-destructive flex items-start gap-1">
                          <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" /></svg>
                          <span><strong>Admin:</strong> {a.commentaireAdmin}</span>
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="card p-6 w-full max-w-lg animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground font-heading">Justifier l'anomalie</h2>
              <button onClick={handleCloseModal} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmitJustification}>
              <div className="mb-4">
                <label className="block mb-2 text-sm text-muted-foreground font-medium">Message (optionnel)</label>
                <textarea 
                  className="input-field min-h-[80px] resize-none" 
                  rows="3" 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  placeholder="Expliquez la raison de cette anomalie..."
                ></textarea>
              </div>
              <div className="mb-6">
                <label className="block mb-2 text-sm text-muted-foreground font-medium">Fichier justificatif (certificat, photo...)</label>
                <input 
                  type="file" 
                  className="input-field file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-primary-500/10 file:text-primary-400 file:font-medium file:text-sm hover:file:bg-primary-500/20 file:cursor-pointer" 
                  onChange={(e) => setFile(e.target.files[0])}
                  accept="image/*,.pdf,.doc,.docx"
                />
              </div>
              <div className="flex gap-3 justify-end">
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
