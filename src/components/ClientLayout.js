/* eslint-disable */
'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { toast } from '@/components/Toast';

import axios from 'axios';

// Global axios configuration
axios.defaults.withCredentials = true;

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const [userName, setUserName] = useState('');
  const [userInitial, setUserInitial] = useState('U');
  const [userRole, setUserRole] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        if (userObj && userObj.nom) {
          setUserName(userObj.nom);
          setUserInitial(userObj.nom.charAt(0).toUpperCase());
          setUserRole(userObj.role === 'ADMIN' ? 'Admin' : 'Employé');
          fetchNotifications(); // Fetch notifications when user is loaded
        }
      } catch (e) {
        console.error('Error parsing user from local storage', e);
      }
    }
  }, [pathname]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data || []);
      setUnreadCount((res.data || []).filter(n => !n.lu).length);
    } catch (err) {
      console.error('Error fetching notifications', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/notifications', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => ({ ...n, lu: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking notifications as read', err);
    }
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
      markAllAsRead();
    }
  };

  // Do not show layout for login, register or root pages
  if (pathname === '/login' || pathname === '/register' || pathname === '/') {
    return <>{children}</>;
  }

  const today = new Date().toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 md:ml-64 transition-all duration-300">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-card/80 backdrop-blur-md px-4 sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-muted-foreground hover:text-foreground md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          {/* Search Bar (SaaS style) */}
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <form className="relative flex flex-1" action="#" method="GET">
              <label htmlFor="search-field" className="sr-only">Recherche</label>
              <svg className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-muted-foreground" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
              </svg>
              <input id="search-field" className="block h-full w-full border-0 py-0 pl-8 pr-0 bg-transparent text-foreground placeholder:text-muted-foreground focus:ring-0 sm:text-sm" placeholder="Rechercher..." type="search" name="search" />
            </form>
            
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Notification Bell */}
              <div className="relative">
                <button 
                  type="button"
                  onClick={handleNotificationClick}
                  className="-m-2.5 p-2.5 text-muted-foreground hover:text-foreground relative transition-colors"
                >
                  <span className="sr-only">Voir les notifications</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 flex h-3 w-3 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-white ring-2 ring-card">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowNotifications(false)}
                    ></div>
                    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-border bg-card shadow-2xl z-50 overflow-hidden animate-fade-in">
                      <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
                        <h3 className="font-semibold text-foreground">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">
                            {unreadCount} nouvelle(s)
                          </span>
                        )}
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-muted-foreground text-sm">
                            <svg className="w-8 h-8 mx-auto mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            Aucune notification
                          </div>
                        ) : (
                          <div className="divide-y divide-border">
                            {notifications.map(notif => (
                              <div key={notif._id} className={`p-4 transition-colors hover:bg-muted/50 ${!notif.lu ? 'bg-primary/5' : ''}`}>
                                <div className="flex gap-3 items-start">
                                  <div className="shrink-0 mt-0.5">
                                    {notif.type === 'AVERTISSEMENT' || notif.type === 'ALERTE' ? '⚠️' : 'ℹ️'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-semibold truncate ${notif.type === 'AVERTISSEMENT' || notif.type === 'ALERTE' ? 'text-destructive' : 'text-foreground'}`}>
                                      {notif.titre}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                                      {notif.message}
                                    </p>
                                    <p className="text-xs text-muted-foreground/60 mt-2">
                                      {new Date(notif.createdAt).toLocaleString('fr-FR')}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Separator */}
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" aria-hidden="true"></div>

              {/* User Profile */}
              <div className="flex items-center gap-x-4 cursor-default">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center text-white font-semibold text-xs shadow-sm ring-2 ring-primary-500/20">
                  {userInitial}
                </div>
                <div className="hidden lg:flex lg:flex-col lg:items-start lg:justify-center">
                  <span className="text-sm font-medium leading-5 text-foreground">{userName || 'Utilisateur'}</span>
                  <span className="text-xs font-medium leading-4 text-muted-foreground">{userRole}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
