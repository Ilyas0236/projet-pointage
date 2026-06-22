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
        if (result.search(/("|,|\n)/g) >= 0)
          result = '"' + result + '"';
        if (j > 0)
          finalVal += ',';
        finalVal += result;
      }
      return finalVal + '\n';
    };

    let csvFile = '';
    for (let i = 0; i < rows.length; i++) {
      csvFile += processRow(rows[i]);
    }

    const blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
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
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '30px 20px', width: '100%' }}>
      {/* Back button */}
      <div style={{ marginBottom: '24px' }}>
        <button className="btn-secondary" onClick={() => router.push('/admin')}>
          ← Espace Supervision
        </button>
      </div>

      <div className="glass-card animate-fade-in">
        <h2 className="text-gradient" style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '20px' }}>
          Génération de Rapports (Excel/CSV)
        </h2>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '30px' }}>
          Exportez l'intégralité des données en format CSV pour les analyser dans Microsoft Excel ou d'autres logiciels de traitement de données.
        </p>

        {error && (
          <div style={{ padding: '10px 14px', backgroundColor: 'var(--error-bg)', color: 'var(--error)', border: '1px solid var(--error-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ padding: '10px 14px', backgroundColor: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '20px' }}>
            {success}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          
          <div style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏱️</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px' }}>Rapport de Pointages</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Extrait l'ensemble de l'historique d'audit des pointages (entrées, sorties, zones) pour tous les employés.
            </p>
            <button 
              className="btn-primary" 
              onClick={handleExportPointages} 
              disabled={loading}
              style={{ width: '100%', marginTop: 'auto' }}
            >
              {loading ? 'Exportation...' : 'Télécharger CSV'}
            </button>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px' }}>Rapport d'Anomalies</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Extrait le registre complet des retards, absences, sorties anticipées et insuffisances horaires.
            </p>
            <button 
              className="btn-primary" 
              onClick={handleExportAnomalies} 
              disabled={loading}
              style={{ width: '100%', marginTop: 'auto', background: 'linear-gradient(135deg, var(--warning) 0%, #d97706 100%)' }}
            >
              {loading ? 'Exportation...' : 'Télécharger CSV'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
