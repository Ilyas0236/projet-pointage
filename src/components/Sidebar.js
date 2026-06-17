/* eslint-disable */
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

// Professional SVG Icons (Linear/Stripe style)
const icons = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  employees: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  clock: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  calendar: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  alert: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  qrcode: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
      <rect x="14" y="14" width="4" height="4"/>
      <line x1="21" y1="14" x2="21" y2="21"/>
      <line x1="14" y1="21" x2="21" y2="21"/>
    </svg>
  ),
  report: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  camera: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  user: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  history: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
    </svg>
  ),
  logout: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
};

export default function Sidebar({ isOpen, setIsOpen }) {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setRole(user.role);
      } catch (err) {
        console.error('Erreur de parsing user', err);
      }
    }
  }, []);

  const adminLinks = [
    { label: 'Dashboard', path: '/admin', icon: icons.dashboard },
    { label: 'Employés', path: '/admin/employes', icon: icons.employees },
    { label: 'Pointages', path: '/admin/pointages', icon: icons.clock },
    { label: 'Congés', path: '/admin/conges', icon: icons.calendar },
    { label: 'Anomalies', path: '/admin/anomalies', icon: icons.alert },
    { label: 'QR Code', path: '/admin/qrcode', icon: icons.qrcode },
    { label: 'Rapports', path: '/admin/rapports', icon: icons.report },
  ];

  const employeeLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: icons.dashboard },
    { label: 'Pointer', path: '/pointer', icon: icons.camera },
    { label: 'Mes Congés', path: '/conges', icon: icons.calendar },
    { label: 'Historique', path: '/historique', icon: icons.history },
    { label: 'Mon Profil', path: '/profil', icon: icons.user },
  ];

  const links = role === 'ADMIN' ? adminLinks : employeeLinks;

  if (pathname === '/login' || pathname === '/register' || pathname === '/') return null;

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r border-border bg-card transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Close button (Mobile only) */}
        <div className="absolute top-0 right-0 -mr-12 pt-4 md:hidden">
          {isOpen && (
            <button
              type="button"
              className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setIsOpen(false)}
            >
              <span className="sr-only">Fermer le menu</span>
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg shadow-sm">
            C
          </div>
          <span className="font-heading font-bold text-lg tracking-tight text-foreground">Chronos</span>
          <span className="ml-auto inline-flex items-center rounded-full bg-primary-500/10 px-2 py-0.5 text-xs font-semibold text-primary tracking-wider uppercase ring-1 ring-inset ring-primary-500/20">
            Pro
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col overflow-y-auto px-4 pb-4 pt-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 px-2">
            Navigation
          </div>
          <ul role="list" className="-mx-2 space-y-1 flex-1">
            {links.map((link) => {
              const isActive = pathname === link.path;
              return (
                <li key={link.path}>
                  <button
                    onClick={() => {
                      router.push(link.path);
                      if (window.innerWidth < 768) setIsOpen(false);
                    }}
                    className={`group flex w-full items-center gap-x-3 rounded-md p-2 text-sm font-medium leading-6 transition-all ${
                      isActive 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <span className={`shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
                      {link.icon}
                    </span>
                    {link.label}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Logout */}
          <div className="mt-auto pt-6 pb-2 border-t border-border">
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                router.push('/login');
              }}
              className="group flex w-full items-center gap-x-3 rounded-md p-2 text-sm font-medium leading-6 text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
            >
              <span className="shrink-0 text-muted-foreground group-hover:text-destructive">
                {icons.logout}
              </span>
              Déconnexion
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}
