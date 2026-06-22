/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from '@/components/Toast';

export default function AdminConges() {
  const router = useRouter();
  const [conges, setConges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'history'
  const [actioningId, setActioningId] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'ADMIN') {
        router.push('/dashboard');
        return;
      }
    } catch {
      router.push('/login');
      return;
    }

    fetchConges();
  }, [router]);

  const fetchConges = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/conges', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConges(response.data.conges || []);
    } catch (err) {
      console.error('Error fetching conges:', err);
      if (err.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProcessLeave = async (id, status) => {
    setActioningId(id);
    try {
      await axios.put(`/api/conges/${id}`, { statut: status });
      toast('Demande traitée avec succès', 'success');
      await fetchConges();
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur lors du traitement de la demande.', 'error');
    } finally {
      setActioningId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
      </div>
    );
  }

  const pendingRequests = conges.filter((c) => c.statut === 'EN_ATTENTE');
  const historyRequests = conges.filter((c) => c.statut !== 'EN_ATTENTE');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header and Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button 
            className="btn-secondary flex items-center gap-2 mb-4" 
            onClick={() => router.push('/admin')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Espace Supervision
          </button>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestion des Congés</h1>
        </div>

        <div className="flex bg-muted/30 p-1 rounded-lg border border-border">
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'pending' 
                ? 'bg-card text-foreground shadow-sm ring-1 ring-border' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
            onClick={() => setActiveTab('pending')}
          >
            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            En attente ({pendingRequests.length})
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'history' 
                ? 'bg-card text-foreground shadow-sm ring-1 ring-border' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
            onClick={() => setActiveTab('history')}
          >
            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Historique ({historyRequests.length})
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="p-6 border-b border-border bg-card">
          <h3 className="text-lg font-bold text-foreground">
            {activeTab === 'pending' ? 'Demandes de Congés en Attente' : 'Historique des Demandes de Congés'}
          </h3>
        </div>

        {activeTab === 'pending' && pendingRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-card">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-500 text-3xl">
              🏖️
            </div>
            <h4 className="text-base font-semibold text-foreground">Aucune demande en attente</h4>
            <p className="text-sm text-muted-foreground mt-1">Toutes les demandes ont été traitées. Beau travail !</p>
          </div>
        ) : activeTab === 'history' && historyRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-card">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4 text-3xl">
              📜
            </div>
            <h4 className="text-base font-semibold text-foreground">Aucun historique disponible</h4>
            <p className="text-sm text-muted-foreground mt-1">Il n'y a eu aucune demande de congé traitée pour le moment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">Collaborateur</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Période</th>
                  <th className="px-6 py-4 font-semibold">Durée</th>
                  <th className="px-6 py-4 font-semibold">Motif</th>
                  {activeTab === 'history' && <th className="px-6 py-4 font-semibold">Traité par / le</th>}
                  {activeTab === 'history' && <th className="px-6 py-4 font-semibold">Statut</th>}
                  {activeTab === 'pending' && <th className="px-6 py-4 font-semibold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(activeTab === 'pending' ? pendingRequests : historyRequests).map((c) => {
                  const diffTime = Math.abs(new Date(c.date_fin) - new Date(c.date_debut));
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                  return (
                    <tr key={c._id} className="hover:bg-muted/50 transition-colors bg-card">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {c.employe?.nom ? c.employe.nom.substring(0, 2).toUpperCase() : '??'}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">{c.employe?.nom || 'Employé inconnu'}</div>
                            <div className="text-xs text-muted-foreground">{c.employe?.email || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="badge badge-info bg-cyan-500/10 text-cyan-500 border-cyan-500/20">{c.type}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span>{new Date(c.date_debut).toLocaleDateString('fr-FR')}</span>
                          <svg className="w-3 h-3 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                          <span>{new Date(c.date_fin).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-foreground">
                        {diffDays} jour{diffDays > 1 ? 's' : ''}
                      </td>
                      <td className="px-6 py-4 max-w-[200px] truncate text-muted-foreground" title={c.motif}>
                        {c.motif || <span className="italic opacity-50">Sans motif</span>}
                      </td>
                      
                      {activeTab === 'history' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {c.traite_par ? (
                            <div>
                              <div className="font-medium text-foreground">{c.traite_par.nom}</div>
                              <div className="text-xs text-muted-foreground">
                                {c.date_traitement ? new Date(c.date_traitement).toLocaleDateString('fr-FR') : '-'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      )}
                      
                      {activeTab === 'history' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {c.statut === 'VALIDE' && <span className="badge badge-success bg-emerald-500/10 text-emerald-500 border-emerald-500/20">VALIDÉ</span>}
                          {c.statut === 'REFUSE' && <span className="badge badge-error bg-rose-500/10 text-rose-500 border-rose-500/20">REFUSÉ</span>}
                          {c.statut === 'ANNULE' && <span className="badge bg-muted text-muted-foreground border-border">ANNULÉ</span>}
                        </td>
                      )}
                      
                      {activeTab === 'pending' && (
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleProcessLeave(c._id, 'VALIDE')}
                              disabled={actioningId === c._id}
                              className="px-3 py-1.5 text-xs font-semibold rounded-md border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                            >
                              {actioningId === c._id ? '...' : 'Accepter'}
                            </button>
                            <button
                              onClick={() => handleProcessLeave(c._id, 'REFUSE')}
                              disabled={actioningId === c._id}
                              className="px-3 py-1.5 text-xs font-semibold rounded-md border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                            >
                              {actioningId === c._id ? '...' : 'Refuser'}
                            </button>
                          </div>
                        </td>
                      )}
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
