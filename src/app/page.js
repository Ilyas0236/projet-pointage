'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
    } else {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      } catch (e) {
        localStorage.clear();
        router.push('/login');
      }
    }
  }, [router]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'var(--font-main)',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h2 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 800 }}>
          ScanTime
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          Chargement en cours...
        </p>
      </div>
    </div>
  );
}
