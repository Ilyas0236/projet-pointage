/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function AdminPointages() {
  const router = useRouter();
  const [pointages, setPointages] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterDate, setFilterDate] = useState('');

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

    fetchEmployees();
  }, [router]);

  useEffect(() => {
    fetchPointages();
  }, [filterEmployee, filterDate]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/api/employes');
      setEmployees(response.data || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const fetchPointages = async () => {
    setLoading(true);
    try {
      let url = '/api/pointage';
      const params = [];
      if (filterEmployee) {
        params.push(`employe=${filterEmployee}`);
      }
      if (filterDate) {
        params.push(`date=${filterDate}`);
      }
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const response = await axios.get(url);
      setPointages(response.data || []);
    } catch (err) {
      console.error('Error fetching pointages:', err);
      if (err.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilterEmployee('');
    setFilterDate('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Back Button & Header */}
      <div className="flex flex-col gap-6">
        <div>
          <button 
            className="btn-secondary flex items-center gap-2" 
            onClick={() => router.push('/admin')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Espace Supervision
          </button>
        </div>

        {/* Filters Panel */}
        <div className="card p-4 sm:p-6 bg-muted/20 border border-border">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1 flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filtrer par employé</label>
              <select
                className="form-input bg-card"
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
              >
                <option value="">Tous les employés</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.nom} ({emp.matricule})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1 flex-1 min-w-[150px]">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filtrer par date</label>
              <input
                type="date"
                className="form-input bg-card"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>

            {(filterEmployee || filterDate) && (
              <button
                className="btn-secondary h-10 px-4 whitespace-nowrap"
                onClick={handleClearFilters}
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pointages List */}
      <div className="card p-0 overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center bg-card">
          <h3 className="text-lg font-bold text-foreground">
            Journal d'Audit des Pointages
          </h3>
          <span className="badge bg-primary/10 text-primary border-primary/20 font-bold px-3 py-1 text-sm">
            {pointages.length}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
          </div>
        ) : pointages.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-card">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h4 className="text-base font-semibold text-foreground">Aucun pointage trouvé</h4>
            <p className="text-sm text-muted-foreground mt-1">Modifiez vos critères de recherche.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">Employé</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Heure</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Statut</th>
                  <th className="px-6 py-4 font-semibold">GPS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pointages.map((p) => {
                  return (
                    <tr key={p._id} className="hover:bg-muted/50 transition-colors bg-card">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {p.employe?.nom ? p.employe.nom.substring(0, 2).toUpperCase() : '??'}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">{p.employe?.nom || 'Employé supprimé'}</div>
                            <div className="text-xs text-muted-foreground">
                              {p.employe?.matricule || '-'} • {p.employe?.departement || '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-foreground">
                        {new Date(p.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-base font-bold text-foreground bg-muted/50 px-2 py-1 rounded-md border border-border">
                          {p.heure}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {p.type === 'entree' || p.type === 'ENTREE' ? (
                          <span className="badge badge-success bg-emerald-500/10 text-emerald-500 border-emerald-500/20">ENTRÉE</span>
                        ) : (
                          <span className="badge badge-info bg-cyan-500/10 text-cyan-500 border-cyan-500/20">SORTIE</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {p.valide ? (
                          <span className="flex items-center gap-1.5 text-emerald-500 text-sm font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            Valide
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-rose-500 text-sm font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                            Invalide
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-muted-foreground">
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-primary transition-colors flex items-center gap-1"
                          title="Voir sur Google Maps"
                        >
                          {p.latitude?.toFixed(5)}, {p.longitude?.toFixed(5)}
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
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
