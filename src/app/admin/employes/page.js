/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from '@/components/Toast';

export default function AdminEmployes() {
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [matricule, setMatricule] = useState('');
  const [departement, setDepartement] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/api/employes');
      setEmployees(response.data || []);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const response = await axios.post('/api/auth/register', {
        nom,
        email,
        password,
        role: 'EMPLOYE',
        matricule,
        departement,
      });

      toast(response.data.message || 'Employé créé avec succès', 'success');
      setNom('');
      setEmail('');
      setPassword('');
      setMatricule('');
      setDepartement('');
      await fetchEmployees();
    } catch (err) {
      console.error(err);
      toast(err.response?.data?.error || "Erreur lors de la création de l'employé.", 'error');
      setError(err.response?.data?.error || "Erreur lors de la création.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await axios.put(`/api/employes/${id}`, { actif: !currentStatus });
      toast("État de l'employé modifié avec succès", 'success');
      await fetchEmployees();
    } catch (err) {
      toast(err.response?.data?.error || "Erreur lors de la modification de l'état.", 'error');
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (!confirm('Voulez-vous désactiver cet employé ?')) return;

    try {
      await axios.delete(`/api/employes/${id}`);
      toast('Employé désactivé avec succès', 'success');
      await fetchEmployees();
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur lors de la désactivation.', 'error');
    }
  };

  const handleApproveEmployee = async (id) => {
    try {
      await axios.put(`/api/employes/${id}`, { approuve: true });
      toast('Employé approuvé avec succès', 'success');
      await fetchEmployees();
    } catch (err) {
      toast(err.response?.data?.error || "Erreur lors de l'approbation.", 'error');
    }
  };

  const handleRejectEmployee = async (id) => {
    if (!confirm("Voulez-vous rejeter cette demande d'inscription ?")) return;

    try {
      await axios.delete(`/api/employes/${id}`);
      toast('Inscription rejetée', 'success');
      await fetchEmployees();
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur lors du rejet.', 'error');
    }
  };

  const pendingEmployees = employees.filter(emp => emp.approuve === false);
  const approvedEmployees = employees.filter(emp => emp.approuve !== false);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Back to dashboard */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Register Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-bold text-foreground mb-6">Ajouter un Nouvel Employé</h3>

            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-md text-sm text-rose-500">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-sm text-emerald-500">
                {success}
              </div>
            )}

            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nom Complet</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Jean Dupont"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Adresse Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="jean.dupont@entreprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mot de Passe Provisoire</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Matricule</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="EMP001"
                    value={matricule}
                    onChange={(e) => setMatricule(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Département</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="R&D"
                    value={departement}
                    onChange={(e) => setDepartement(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary w-full mt-2" disabled={submitting}>
                {submitting ? 'Enregistrement...' : 'Créer le compte'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Employees List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-0 overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-bold text-foreground">Liste des Collaborateurs</h3>
            </div>

            {pendingEmployees.length > 0 && (
              <div className="p-6 bg-amber-500/5 border-b border-amber-500/10">
                <h4 className="text-sm font-bold text-amber-500 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Comptes en Attente ({pendingEmployees.length})
                </h4>
                <div className="overflow-x-auto rounded-lg border border-amber-500/20">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-amber-600 uppercase bg-amber-500/10">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Collaborateur</th>
                        <th className="px-6 py-3 font-semibold">Matricule</th>
                        <th className="px-6 py-3 font-semibold">Département</th>
                        <th className="px-6 py-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-500/10">
                      {pendingEmployees.map((emp) => (
                        <tr key={emp._id} className="hover:bg-amber-500/5 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-semibold text-foreground">{emp.nom}</div>
                            <div className="text-xs text-muted-foreground">{emp.email}</div>
                          </td>
                          <td className="px-6 py-4 font-bold text-foreground whitespace-nowrap">{emp.matricule}</td>
                          <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">{emp.departement}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleApproveEmployee(emp._id)}
                                className="px-3 py-1.5 text-xs font-semibold rounded-md border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                              >
                                Approuver
                              </button>
                              <button
                                onClick={() => handleRejectEmployee(emp._id)}
                                className="px-3 py-1.5 text-xs font-semibold rounded-md border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 transition-colors"
                              >
                                Rejeter
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {approvedEmployees.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h4 className="text-base font-semibold text-foreground">Aucun collaborateur</h4>
                <p className="text-sm text-muted-foreground mt-1">Commencez par ajouter un employé via le formulaire.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Collaborateur</th>
                      <th className="px-6 py-3 font-semibold">Matricule</th>
                      <th className="px-6 py-3 font-semibold">Département</th>
                      <th className="px-6 py-3 font-semibold">Statut</th>
                      <th className="px-6 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {approvedEmployees.map((emp) => (
                      <tr key={emp._id} className="hover:bg-muted/50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                              {emp.nom.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">{emp.nom}</div>
                              <div className="text-xs text-muted-foreground">{emp.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono font-medium text-foreground whitespace-nowrap">{emp.matricule}</td>
                        <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">{emp.departement}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {emp.actif ? (
                            <span className="badge badge-success bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Actif</span>
                          ) : (
                            <span className="badge badge-error bg-rose-500/10 text-rose-500 border-rose-500/20">Suspendu</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleToggleActive(emp._id, emp.actif)}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                                emp.actif 
                                  ? 'border-amber-500/30 text-amber-500 hover:bg-amber-500/10' 
                                  : 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10'
                              }`}
                            >
                              {emp.actif ? 'Suspendre' : 'Activer'}
                            </button>
                            {emp.actif && (
                              <button
                                onClick={() => handleDeleteEmployee(emp._id)}
                                className="px-3 py-1.5 text-xs font-semibold rounded-md border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 transition-colors"
                              >
                                Désactiver
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
