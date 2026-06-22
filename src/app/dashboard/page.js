/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

export default function EmployeeDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Live Timer States
  const [activeSession, setActiveSession] = useState(null);
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = res.data;
        setStats(data);
        
        // Check for active session today
        if (data.historique && data.historique.length > 0) {
          const todayStr = new Date().toDateString();
          const todaysPointages = data.historique.filter(p => new Date(p.date).toDateString() === todayStr);
          if (todaysPointages.length > 0) {
            const last = todaysPointages[0]; // First in array is the most recent
            if (last.type === 'entree' || last.type === 'ENTREE') {
              // Construct Date object from pointage date and heure
              const datePart = last.date.split('T')[0];
              setActiveSession(new Date(`${datePart}T${last.heure}:00`));
            } else {
              setActiveSession(null);
            }
          }
        }
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

  // Live Stopwatch Effect
  useEffect(() => {
    let interval;
    if (stats) {
      const baseMs = stats.heuresAujourdhuiMs || 0;
      
      const tick = () => {
        let totalMs = baseMs;
        if (activeSession) {
          const diffMs = new Date() - activeSession;
          if (diffMs > 0) totalMs += diffMs;
        }

        if (totalMs > 0) {
          const h = Math.floor(totalMs / 3600000).toString().padStart(2, '0');
          const m = Math.floor((totalMs % 3600000) / 60000).toString().padStart(2, '0');
          const s = Math.floor((totalMs % 60000) / 1000).toString().padStart(2, '0');
          setElapsed(`${h}:${m}:${s}`);
        } else {
          setElapsed('00:00:00');
        }
      };
      
      tick();
      interval = setInterval(tick, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession, stats]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
      </div>
    );
  }

  // Calculate dynamic weekly presence based on stats (mocked if not enough data)
  const presenceSemaine = stats?.presenceSemaine || [
    { name: 'Lun', heures: 8 },
    { name: 'Mar', heures: 8.5 },
    { name: 'Mer', heures: 7.5 },
    { name: 'Jeu', heures: 8 },
    { name: 'Ven', heures: 0 },
  ];

  const goal = 151;
  const tracked = stats?.heuresCeMois || 0;
  const remaining = Math.max(0, goal - tracked);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Mon Espace</h1>
          <p className="text-muted-foreground mt-1">Bienvenue sur votre tableau de bord personnel</p>
        </div>
        <button 
          className="btn-primary flex items-center gap-2"
          onClick={() => router.push('/pointer')}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Pointer
        </button>
      </div>

      {/* DAILY SUMMARY (NEW) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 border-l-4 border-l-primary flex flex-col justify-center">
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Statut Actuel</p>
          <p className="text-lg font-bold text-foreground truncate">{stats?.statutActuel || 'Chargement...'}</p>
        </div>
        <div className="card p-4 border-l-4 border-l-emerald-500 flex flex-col justify-center">
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Pointages (Jour)</p>
          <p className="text-xl font-bold text-foreground">{stats?.pointagesAujourdhui !== undefined ? stats.pointagesAujourdhui : '-'}</p>
        </div>
        <div className="card p-4 border-l-4 border-l-amber-500 flex flex-col justify-center">
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Pointages Restants</p>
          <p className="text-xl font-bold text-foreground">{stats?.pointagesRestants !== undefined ? stats.pointagesRestants : '-'}</p>
        </div>
        <div className="card p-4 border-l-4 border-l-rose-500 flex flex-col justify-center">
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Dernier Pointage</p>
          <p className="text-sm font-bold text-foreground truncate">
            {stats?.dernierPointage ? (
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${stats.dernierPointage.type === 'ENTREE' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                {stats.dernierPointage.heure} ({stats.dernierPointage.type === 'ENTREE' ? 'Entrée' : 'Sortie'})
              </span>
            ) : 'Aucun pointage'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* TRACK TIME (Live Stopwatch) */}
        <div className={`card p-6 md:col-span-4 border-t-4 ${activeSession ? 'border-t-amber-500 bg-amber-500/5' : 'border-t-primary'}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Temps Réel</h3>
            <svg className={`w-5 h-5 ${activeSession ? 'text-amber-500' : 'text-muted-foreground'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className={`mt-4 text-4xl font-mono font-bold tracking-tighter ${activeSession ? 'text-amber-500' : 'text-foreground'}`}>
            {elapsed}
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground font-medium">
            {activeSession ? (
              <>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                Démarré à {activeSession.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </>
            ) : (
              stats?.pointagesAujourdhui >= 4 
                ? 'Journée terminée' 
                : 'En attente de pointage (Entrée)'
            )}
          </div>
        </div>

        {/* ATTENDANCE BALANCE */}
        <div className="card p-6 md:col-span-8 border-t-4 border-t-cyan-500">
          <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase mb-6">Bilan Mensuel</h3>
          <div className="flex flex-col sm:flex-row justify-around items-center gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-foreground">{tracked}<span className="text-xl text-muted-foreground font-normal ml-1">h</span></div>
              <div className="text-sm text-muted-foreground mt-1 font-medium">Réalisé</div>
            </div>
            <div className="hidden sm:block w-px h-16 bg-border"></div>
            <div className="text-center">
              <div className="text-4xl font-bold text-foreground">{goal}<span className="text-xl text-muted-foreground font-normal ml-1">h</span></div>
              <div className="text-sm text-muted-foreground mt-1 font-medium">Objectif</div>
            </div>
            <div className="hidden sm:block w-px h-16 bg-border"></div>
            <div className="text-center">
              <div className="text-4xl font-bold text-cyan-500">{remaining}<span className="text-xl text-muted-foreground font-normal ml-1">h</span></div>
              <div className="text-sm text-muted-foreground mt-1 font-medium">Restantes</div>
            </div>
          </div>
        </div>

        {/* CHART */}
        <div className="card p-6 md:col-span-8">
          <h2 className="text-lg font-bold text-foreground mb-6">Activité Graphique</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={presenceSemaine}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)' }} dx={-10} />
                <RechartsTooltip 
                  cursor={{ fill: 'var(--accent)' }} 
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                />
                <Bar dataKey="heures" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RECENT HISTORIQUE */}
        <div className="card p-6 md:col-span-4 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-foreground">Flux Récents</h2>
            <button className="btn-secondary h-8 px-3 text-xs" onClick={() => router.push('/historique')}>Voir tout</button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {stats?.historique?.length > 0 ? (
              stats.historique.slice(0, 5).map((p, idx) => (
                <div key={idx} className="flex items-center gap-4 group">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${(p.type === 'entree' || p.type === 'ENTREE') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      {(p.type === 'entree' || p.type === 'ENTREE')
                        ? <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        : <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      }
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {(p.type === 'entree' || p.type === 'ENTREE') ? 'Pointage Entrée' : 'Pointage Sortie'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {new Date(p.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="text-sm font-bold font-mono text-foreground">
                    {p.heure}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 border-2 border-dashed border-border rounded-xl">
                <svg className="w-8 h-8 text-muted-foreground mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-foreground">Aucun pointage</p>
                <p className="text-xs text-muted-foreground mt-1">Vous n'avez pas encore pointé aujourd'hui.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
