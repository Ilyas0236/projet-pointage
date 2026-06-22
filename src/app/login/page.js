/* eslint-disable */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password,
      });

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error || 'Email ou mot de passe incorrect'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background p-6">
      {/* Animated gradient blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,transparent_70%)] blur-[60px] animate-[float1_8s_ease-in-out_infinite]" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[450px] h-[450px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.12)_0%,transparent_70%)] blur-[60px] animate-[float2_10s_ease-in-out_infinite]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.06)_0%,transparent_70%)] blur-[40px]" />

      <style jsx>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-25px, 25px) scale(1.05); }
          66% { transform: translate(30px, -15px) scale(0.95); }
        }
      `}</style>

      <div className="relative z-10 w-full max-w-[420px] p-10 bg-surface-900/60 backdrop-blur-2xl border border-border/50 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.5),_inset_0_1px_0_rgba(255,255,255,0.1)] animate-fade-in">
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="bg-gradient-to-br from-primary-500 to-violet-500 text-white rounded-2xl w-14 h-14 flex items-center justify-center font-extrabold text-xl mb-5 shadow-[0_8px_24px_rgba(99,102,241,0.3)] tracking-tight font-heading">
            ST
          </div>
          <h2 className="text-3xl font-bold mb-2 text-foreground tracking-tight font-heading">
            Bon retour
          </h2>
          <p className="text-muted-foreground text-sm">
            Connectez-vous pour accéder à votre espace
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm animate-in slide-in-from-top-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[0.75rem] font-bold text-muted-foreground uppercase tracking-widest">
              Adresse Email
            </label>
            <input
              type="email"
              placeholder="nom@entreprise.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-surface-950/50 border border-border rounded-xl text-foreground text-sm outline-none transition-all duration-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 placeholder:text-surface-600"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-[0.75rem] font-bold text-muted-foreground uppercase tracking-widest">
                Mot de Passe
              </label>
              <span className="text-xs text-primary-400 hover:text-primary-300 cursor-pointer font-medium transition-colors">
                Oublié ?
              </span>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-4 pr-11 py-3 bg-surface-950/50 border border-border rounded-xl text-foreground text-sm outline-none transition-all duration-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 placeholder:text-surface-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 transition-colors p-1"
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-gradient-to-r from-primary-600 to-violet-600 hover:from-primary-500 hover:to-violet-500 text-white rounded-xl text-sm font-bold shadow-[0_4px_14px_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-[1px] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {loading ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                Connexion en cours...
              </>
            ) : 'Se connecter'}
          </button>

          <div className="text-center mt-2 text-xs">
            <span className="text-muted-foreground">Vous n'avez pas de compte ? </span>
            <Link href="/register" className="text-primary-400 hover:text-primary-300 font-bold transition-colors">
              S'inscrire
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
