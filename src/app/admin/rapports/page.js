/* eslint-disable */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function AdminRapports() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const exportToCSV = (filename, rows) => {
    const processRow = function (row) {
      let finalVal = '';
      for (let j = 0; j < row.length; j++) {
        let innerValue = row[j] === null ? '' : row[j].toString();
        if (row[j] instanceof Date) {
          innerValue = row[j].toLocaleString();
        }
        let result = innerValue.replace(/"/g, '""');
        if (result.search(/("|,|\n|;)/g) >= 0)
          result = '"' + result + '"';
        if (j > 0)
          finalVal += ';';
        finalVal += result;
      }
      return finalVal + '\n';
    };

    let csvFile = '';
    for (let i = 0; i < rows.length; i++) {
      csvFile += processRow(rows[i]);
    }

    const blob = new Blob(['\uFEFF' + csvFile], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleExportPointages = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.get('/api/pointage', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const pointages = response.data || [];
      if (pointages.length === 0) {
        setError('Aucun pointage trouvé à exporter.');
        return;
      }

      const rows = [
        ['Date', 'Heure', 'Collaborateur', 'Matricule', 'Département', 'Type', 'Zone', 'Latitude', 'Longitude', 'Validité']
      ];

      pointages.forEach(p => {
        rows.push([
          new Date(p.date).toLocaleDateString('fr-FR'),
          p.heure,
          p.employe?.nom || 'Inconnu',
          p.employe?.matricule || 'N/A',
          p.employe?.departement || 'N/A',
          p.type,
          p.zone?.nom || 'Locaux',
          p.latitude,
          p.longitude,
          p.valide ? 'Valide' : 'Invalide'
        ]);
      });

      exportToCSV('Rapport_Pointages_ScanTime.csv', rows);
      setSuccess('Exportation des pointages réussie !');
    } catch (err) {
      console.error(err);
      setError('Erreur lors de l\'exportation.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportAnomalies = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.get('/api/anomalies', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const anomalies = response.data || [];
      if (anomalies.length === 0) {
        setError('Aucune anomalie trouvée à exporter.');
        return;
      }

      const rows = [
        ['Date', 'Collaborateur', 'Matricule', 'Département', 'Type d\'Anomalie', 'Description', 'Heures Travaillées', 'État de résolution']
      ];

      anomalies.forEach(a => {
        rows.push([
          new Date(a.date).toLocaleDateString('fr-FR'),
          a.employe?.nom || 'Inconnu',
          a.employe?.matricule || 'N/A',
          a.employe?.departement || 'N/A',
          a.type,
          a.description,
          a.heuresTravaillees || 0,
          a.resolu ? 'Résolue' : 'Active'
        ]);
      });

      exportToCSV('Rapport_Anomalies_ScanTime.csv', rows);
      setSuccess('Exportation des anomalies réussie !');
    } catch (err) {
      console.error(err);
      setError('Erreur lors de l\'exportation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-foreground to-surface-400 font-heading">
            Rapports
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">Exportez vos données en format CSV pour Excel</p>
        </div>
        <button className="btn-secondary flex items-center gap-2" onClick={() => router.push('/admin')}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Supervision
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          {success}
        </div>
      )}

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Pointages Export */}
        <div className="card p-0 overflow-hidden group relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="p-8 flex flex-col items-center text-center relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-400 mb-5 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2 font-heading">Rapport de Pointages</h3>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              Extrait l'ensemble de l'historique d'audit des pointages (entrées, sorties, zones) pour tous les employés.
            </p>
            <button 
              className="btn-primary w-full flex items-center justify-center gap-2" 
              onClick={handleExportPointages} 
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                  Exportation...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Télécharger CSV
                </>
              )}
            </button>
          </div>
        </div>

        {/* Anomalies Export */}
        <div className="card p-0 overflow-hidden group relative">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="p-8 flex flex-col items-center text-center relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2 font-heading">Rapport d'Anomalies</h3>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              Extrait le registre complet des retards, absences, sorties anticipées et insuffisances horaires.
            </p>
            <button 
              className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 bg-gradient-to-b from-amber-500 to-amber-600 text-white shadow-[0_2px_8px_rgba(245,158,11,0.25)] hover:shadow-[0_4px_12px_rgba(245,158,11,0.35)] hover:-translate-y-[1px] active:scale-[0.98] h-10 px-5 py-2 gap-2"
              onClick={handleExportAnomalies} 
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                  Exportation...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Télécharger CSV
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
