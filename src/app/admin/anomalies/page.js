/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from '@/components/Toast';
import SkeletonLoader from '@/components/SkeletonLoader';

export default function AdminAnomalies() {
  const router = useRouter();
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterResolu, setFilterResolu] = useState('false');
  const [filterType, setFilterType] = useState('all');
  const [resolvingId, setResolvingId] = useState(null);

  // Commentaire / Avertissement
  const [commentModalId, setCommentModalId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [justifActionId, setJustifActionId] = useState(null);

  useEffect(() => {
    fetchAnomalies();
  }, [filterResolu, filterType]);

  const fetchAnomalies = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      let url = '/api/anomalies';
      const params = [];
      if (filterResolu !== 'all') {
        params.push(`resolu=${filterResolu}`);
      }
      if (filterType !== 'all') {
        params.push(`type=${filterType}`);
      }
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnomalies(response.data || []);
    } catch (err) {
      console.error('Error fetching anomalies:', err);
      if (err.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAnomaly = async (id) => {
    const token = localStorage.getItem('token');
    setResolvingId(id);
    try {
      await axios.put(
        '/api/anomalies',
        { anomalyId: id, resolu: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast('Anomalie marquée comme résolue', 'success');
      await fetchAnomalies();
    } catch (err) {
      toast(err.response?.data?.error || "Erreur lors de la résolution de l'anomalie.", 'error');
    } finally {
      setResolvingId(null);
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) {
      toast('Veuillez écrire un commentaire.', 'error');
      return;
    }

    const token = localStorage.getItem('token');
    setSendingComment(true);
    try {
      await axios.put(
        '/api/anomalies',
        { anomalyId: commentModalId, commentaireAdmin: commentText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast('Avertissement envoyé à l\'employé avec succès !', 'success');
      setCommentModalId(null);
      setCommentText('');
      await fetchAnomalies();
    } catch (err) {
      toast(err.response?.data?.error || "Erreur lors de l'envoi.", 'error');
    } finally {
      setSendingComment(false);
    }
  };

  const handleJustificationDecision = async (id, decision) => {
    const token = localStorage.getItem('token');
    setJustifActionId(id);
    try {
      await axios.put(
        '/api/anomalies',
        { anomalyId: id, statutJustification: decision },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast(`Justificatif ${decision === 'ACCEPTEE' ? 'accepté' : 'refusé'} avec succès.`, decision === 'ACCEPTEE' ? 'success' : 'error');
      await fetchAnomalies();
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur lors du traitement.', 'error');
    } finally {
      setJustifActionId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px', width: '100%' }}>
        <SkeletonLoader type="table" rows={5} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px', width: '100%' }}>
      {/* Modal Commentaire / Avertissement */}
      {commentModalId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}
        onClick={() => { setCommentModalId(null); setCommentText(''); }}
        >
          <div 
            className="glass-card animate-fade-in" 
            style={{ 
              width: '100%', maxWidth: '500px', padding: '28px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: 'var(--radius-full)',
                background: 'var(--warning-bg)', color: 'var(--warning)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem',
              }}>⚠️</div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Envoyer un avertissement
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  L&apos;employé recevra ce message dans ses notifications
                </p>
              </div>
            </div>

            <textarea
              className="form-input"
              rows={4}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Ex: Vous avez été en retard de 45 minutes ce matin. Veuillez respecter les horaires. Premier avertissement."
              style={{
                width: '100%', resize: 'vertical', marginBottom: '20px',
                fontSize: '0.9rem', lineHeight: '1.5',
              }}
            />

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="btn-secondary" 
                onClick={() => { setCommentModalId(null); setCommentText(''); }}
                style={{ padding: '10px 20px' }}
              >
                Annuler
              </button>
              <button 
                className="btn-primary" 
                onClick={handleSendComment}
                disabled={sendingComment || !commentText.trim()}
                style={{ 
                  padding: '10px 20px',
                  background: 'var(--warning)',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}
              >
                {sendingComment ? (
                  'Envoi en cours...'
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                    Envoyer l&apos;avertissement
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back button and filters */}
      <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <button className="btn-secondary" onClick={() => router.push('/admin')}>
            ← Espace Supervision
          </button>
        </div>

        {/* Filters Panel */}
        <div className="glass-card animate-fade-in" style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>État de résolution</label>
              <select
                className="form-input"
                value={filterResolu}
                onChange={(e) => setFilterResolu(e.target.value)}
                style={{ minWidth: '160px', padding: '8px 12px', background: 'rgba(0,0,0,0.05)' }}
              >
                <option value="false" style={{ background: 'var(--bg-surface)' }}>Non résolues ⚠️</option>
                <option value="true" style={{ background: 'var(--bg-surface)' }}>Résolues ✅</option>
                <option value="all" style={{ background: 'var(--bg-surface)' }}>Toutes</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Type d&apos;anomalie</label>
              <select
                className="form-input"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{ minWidth: '220px', padding: '8px 12px', background: 'rgba(0,0,0,0.05)' }}
              >
                <option value="all" style={{ background: 'var(--bg-surface)' }}>Tous les types</option>
                <option value="RETARD" style={{ background: 'var(--bg-surface)' }}>⏰ Retard</option>
                <option value="ABSENCE" style={{ background: 'var(--bg-surface)' }}>❌ Absence</option>
                <option value="ABSENCE_MATIN" style={{ background: 'var(--bg-surface)' }}>🌅 Absence matin</option>
                <option value="ABSENCE_APRES_MIDI" style={{ background: 'var(--bg-surface)' }}>🌇 Absence après-midi</option>
                <option value="SORTIE_ANTICIPEE" style={{ background: 'var(--bg-surface)' }}>🏃 Sortie anticipée</option>
                <option value="SORTIE_NON_AUTORISEE" style={{ background: 'var(--bg-surface)' }}>🚫 Sortie non autorisée</option>
                <option value="INCOHERENCE_JOURNEE" style={{ background: 'var(--bg-surface)' }}>⚠️ Incohérence journée</option>
                <option value="INSUFFISANCE_HEURES" style={{ background: 'var(--bg-surface)' }}>📉 Insuffisance d'heures</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Anomalies List */}
      <div className="glass-card animate-fade-in">
        <h3 style={{ marginBottom: '20px', fontSize: '1.2rem', fontWeight: 800 }}>
          Suivi des Anomalies ({anomalies.length})
        </h3>

        {anomalies.length === 0 ? (
          <div className="empty-state animate-fade-in">
            <div className="empty-state-icon">🎉</div>
            <h4>Aucune anomalie détectée</h4>
            <p>Tout fonctionne parfaitement. Les employés sont ponctuels !</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Collaborateur</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Justificatif</th>
                  <th>Commentaire Admin</th>
                  <th>État</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.map((a) => {
                  let typeBadgeClass = 'badge-pending'; // default warning
                  if (a.type === 'ABSENCE') typeBadgeClass = 'badge-error';
                  if (a.type === 'SORTIE_ANTICIPEE') typeBadgeClass = 'badge-info';
                  if (a.type === 'INSUFFISANCE_HEURES') typeBadgeClass = 'badge-info';

                  return (
                    <tr key={a._id}>
                      <td style={{ fontWeight: 600 }}>
                        {new Date(a.date).toLocaleDateString('fr-FR')}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{a.employe?.nom || 'Employé supprimé'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Matricule: {a.employe?.matricule || '-'}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${typeBadgeClass}`}>{a.type}</span>
                      </td>
                      <td style={{ maxWidth: '300px', whiteSpace: 'normal', fontSize: '0.85rem' }}>
                        {(() => {
                          const gpsMatch = a.description.match(/\(GPS:\s*([-\d.]+),\s*([-\d.]+)\)/);
                          if (gpsMatch) {
                            const descWithoutGps = a.description.replace(gpsMatch[0], '');
                            const lat = gpsMatch[1];
                            const lng = gpsMatch[2];
                            return (
                              <>
                                <span>{descWithoutGps}</span>
                                <div style={{ marginTop: '8px' }}>
                                  <a 
                                    href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      background: 'rgba(239, 68, 68, 0.1)',
                                      color: 'var(--error)',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      fontWeight: 600,
                                      textDecoration: 'none'
                                    }}
                                    title="Voir la position exacte sur Google Maps"
                                  >
                                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Voir la localisation ({Number(lat).toFixed(4)}, {Number(lng).toFixed(4)})
                                  </a>
                                </div>
                              </>
                            );
                          }
                          return a.description;
                        })()}
                      </td>
                      {/* Colonne Justificatif */}
                      <td style={{ maxWidth: '250px', whiteSpace: 'normal', fontSize: '0.85rem' }}>
                        {a.statutJustification === 'AUCUNE' && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Aucun</span>
                        )}
                        {a.statutJustification === 'EN_ATTENTE' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {a.justificationMessage && (
                              <div style={{ background: 'rgba(59,130,246,0.1)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--info)' }}>
                                💬 {a.justificationMessage}
                              </div>
                            )}
                            {a.justificationFichier && (
                              <a href={a.justificationFichier} download={`justificatif-${a.employe?.nom || 'employe'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>
                                📎 Télécharger le document
                              </a>
                            )}
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => handleJustificationDecision(a._id, 'ACCEPTEE')}
                                disabled={justifActionId !== null}
                                className="btn-primary"
                                style={{ padding: '4px 10px', fontSize: '0.7rem', background: 'var(--success)' }}
                              >
                                {justifActionId === a._id ? '...' : '✓ Accepter'}
                              </button>
                              <button
                                onClick={() => handleJustificationDecision(a._id, 'REFUSEE')}
                                disabled={justifActionId !== null}
                                className="btn-secondary"
                                style={{ padding: '4px 10px', fontSize: '0.7rem', color: 'var(--error)', borderColor: 'var(--error)' }}
                              >
                                ✗ Refuser
                              </button>
                            </div>
                          </div>
                        )}
                        {a.statutJustification === 'ACCEPTEE' && (
                          <span className="badge badge-success">✓ Accepté</span>
                        )}
                        {a.statutJustification === 'REFUSEE' && (
                          <span className="badge badge-error">✗ Refusé</span>
                        )}
                      </td>
                      <td style={{ maxWidth: '250px', whiteSpace: 'normal', fontSize: '0.85rem' }}>
                        {a.commentaireAdmin ? (
                          <div style={{
                            background: 'var(--warning-bg)',
                            border: '1px solid var(--warning)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '8px 12px',
                            color: 'var(--warning)',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                          }}>
                            ⚠️ {a.commentaireAdmin}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${a.resolu ? 'badge-success' : 'badge-pending'}`}>
                          {a.resolu ? 'Résolue' : 'Active'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          {/* Bouton Avertissement */}
                          <button
                            onClick={() => { 
                              setCommentModalId(a._id); 
                              if (a.commentaireAdmin) {
                                setCommentText(a.commentaireAdmin);
                              } else {
                                const dateStr = new Date(a.date).toLocaleDateString('fr-FR');
                                setCommentText(`Avertissement automatique.\nMotif : ${a.type} le ${dateStr}.\nDétails : ${a.description}\n\nVeuillez justifier cette anomalie dans les plus brefs délais.`);
                              }
                            }}
                            className="btn-secondary"
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.75rem',
                              borderRadius: 'var(--radius-sm)',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: 'var(--warning)',
                              borderColor: 'var(--warning)',
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5"></path>
                              <path d="M18 2l4 4-10 10H8v-4L18 2z"></path>
                            </svg>
                            Avertir
                          </button>

                          {/* Bouton Résoudre */}
                          {!a.resolu ? (
                            <button
                              onClick={() => handleResolveAnomaly(a._id)}
                              disabled={resolvingId !== null}
                              className="btn-primary"
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.75rem',
                                borderRadius: 'var(--radius-sm)',
                                fontWeight: 600,
                              }}
                            >
                              {resolvingId === a._id ? '...' : '✓ Résoudre'}
                            </button>
                          ) : (
                            <span style={{ color: 'var(--success)', fontSize: '1.1rem' }}>✓</span>
                          )}
                        </div>
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
