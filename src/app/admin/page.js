/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import axios from 'axios';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

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

    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
        if (error.response && error.response.status === 401) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/pointage', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const pointages = res.data;
      if (!pointages || pointages.length === 0) {
        alert("Aucun pointage à exporter");
        return;
      }

      const headers = ['Date', 'Heure', 'Employé', 'Matricule', 'Département', 'Type'];
      const csvRows = [headers.join(';')];

      pointages.forEach(p => {
        const date = new Date(p.date).toLocaleDateString('fr-FR');
        const heure = p.heure || '';
        const nom = p.employe?.nom || 'Inconnu';
        const matricule = p.employe?.matricule || 'N/A';
        const departement = p.employe?.departement || 'N/A';
        const type = p.type || '';
        
        const row = [date, heure, `"${nom}"`, `"${matricule}"`, `"${departement}"`, type];
        csvRows.push(row.join(';'));
      });

      const csvString = csvRows.join('\n');
      const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' }); // \uFEFF for Excel UTF-8 BOM
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `export_pointages_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Erreur lors de l'exportation:", error);
      alert("Une erreur est survenue lors de l'exportation.");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
      </div>
    );
  }

  const presenceData = stats?.chartData?.map(d => ({
    name: d.label.split(' ')[0], // short day name
    value: d.entrees || 0
  })) || [
    { name: 'Lun', value: 0 },
    { name: 'Mar', value: 0 },
    { name: 'Mer', value: 0 },
    { name: 'Jeu', value: 0 },
    { name: 'Ven', value: 0 },
  ];

  const totalEmp = stats?.counts?.totalEmployees || 0;
  const anomalies = stats?.counts?.unresolvedAnomalies || 0;

  const pieData = [
    { name: "Présents (Aujourd'hui)", value: stats?.counts?.pointagesToday || 0 },
    { name: 'Anomalies non résolues', value: anomalies },
  ];
  const COLORS = ['#6366F1', '#EF4444'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-foreground to-surface-400 font-heading">Supervision</h1>
          <p className="text-muted-foreground mt-2 font-medium">Vue d'ensemble de l'activité de l'entreprise</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="btn-secondary flex items-center gap-2"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            {isExporting ? 'Exportation...' : 'Exporter'}
          </button>
          <button 
            className="btn-primary flex items-center gap-2"
            onClick={() => router.push('/admin/qrcode')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nouveau QR
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI Cards */}
        <div className="card p-6 border-t-4 border-t-primary-500 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary-500/10 rounded-full blur-2xl group-hover:bg-primary-500/20 transition-all"></div>
          <div className="flex items-center justify-between relative z-10">
            <h3 className="text-[0.7rem] font-bold tracking-widest text-muted-foreground uppercase">Employés Actifs</h3>
            <div className="p-2 bg-primary-500/10 rounded-lg text-primary-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 text-4xl font-black text-foreground relative z-10">{totalEmp}</div>
          <div className="mt-1 text-sm text-emerald-400 font-medium relative z-10 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
            Total enregistrés
          </div>
        </div>
        
        <div className="card p-6 border-t-4 border-t-rose-500 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all"></div>
          <div className="flex items-center justify-between relative z-10">
            <h3 className="text-[0.7rem] font-bold tracking-widest text-muted-foreground uppercase">Anomalies</h3>
            <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 text-4xl font-black text-foreground relative z-10">{anomalies}</div>
          <div className="mt-1 text-sm text-rose-400 font-medium relative z-10 flex items-center gap-1">
            À traiter rapidement
          </div>
        </div>

        <div className="card p-6 border-t-4 border-t-cyan-500 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all"></div>
          <div className="flex items-center justify-between relative z-10">
            <h3 className="text-[0.7rem] font-bold tracking-widest text-muted-foreground uppercase">Pointages</h3>
            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 text-4xl font-black text-foreground relative z-10">{stats?.counts?.pointagesToday || 0}</div>
          <div className="mt-1 text-sm text-muted-foreground font-medium relative z-10">Opérations aujourd'hui</div>
        </div>

        <div className="card p-6 border-t-4 border-t-amber-500 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
          <div className="flex items-center justify-between relative z-10">
            <h3 className="text-[0.7rem] font-bold tracking-widest text-muted-foreground uppercase">Congés</h3>
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 text-4xl font-black text-foreground relative z-10">{stats?.counts?.pendingConges || 0}</div>
          <div className="mt-1 text-sm text-muted-foreground font-medium relative z-10">En attente de validation</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="card p-6 lg:col-span-2 flex flex-col">
          <h2 className="text-lg font-bold text-foreground mb-6 font-heading tracking-tight">Taux de Présence (Semaine)</h2>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={presenceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} dx={-10} />
                <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }} />
                <Bar dataKey="value" fill="url(#colorUv)" radius={[6, 6, 0, 0]} barSize={45}>
                  {/* Define gradient for the bar */}
                </Bar>
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={1}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Presence Pie Chart */}
        <div className="card p-6 lg:col-span-1">
          <h2 className="text-lg font-bold text-foreground mb-6">Répartition Aujourd'hui</h2>
          <div className="h-[220px] w-full flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  fill="#8884d8"
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={4}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-3 mt-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span className="text-sm font-medium text-foreground flex-1">Présents</span>
              <span className="text-sm font-bold">{pieData[0].value}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-destructive"></div>
              <span className="text-sm font-medium text-foreground flex-1">Absents/Retards</span>
              <span className="text-sm font-bold">{pieData[1].value}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Anomalies */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-lg font-bold text-foreground">Dernières Anomalies</h2>
          <button className="btn-secondary h-9 px-4 text-sm" onClick={() => router.push('/admin/anomalies')}>Traiter les anomalies</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-y border-border">
              <tr>
                <th scope="col" className="px-6 py-3 font-semibold">Statut</th>
                <th scope="col" className="px-6 py-3 font-semibold">Employé</th>
                <th scope="col" className="px-6 py-3 font-semibold">Type</th>
                <th scope="col" className="px-6 py-3 font-semibold">Date & Heure</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats?.recentAnomalies?.length > 0 ? (
                stats.recentAnomalies.slice(0, 5).map((anomalie, idx) => (
                  <tr key={idx} className="hover:bg-muted/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-2.5 w-2.5 rounded-full bg-amber-500 mr-2 animate-pulse"></div>
                        <span className="text-amber-500 font-medium">À vérifier</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">
                      {anomalie.user_id?.nom || 'Inconnu'}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      <span className="badge badge-error bg-rose-500/10 text-rose-500 border-rose-500/20">{anomalie.type}</span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      {new Date(anomalie.date).toLocaleDateString('fr-FR')} à {anomalie.heure}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-8 h-8 mb-2 text-emerald-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Aucune anomalie récente à signaler.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
