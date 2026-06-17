'use client';
import { useState, useEffect } from 'react';

// Un simple système d'Event Emitter pour déclencher les toasts de n'importe où
export const toastManager = {
  listeners: [],
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  },
  show(message, type = 'info') {
    this.listeners.forEach(listener => listener({ id: Date.now(), message, type }));
  }
};

export function toast(message, type = 'success') {
  toastManager.show(message, type);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe((newToast) => {
      setToasts(prev => [...prev, newToast]);
      // Remove toast after 4 seconds (matches CSS fadeOut)
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 4500);
    });
    return unsubscribe;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'success' && '✅ '}
          {t.type === 'error' && '❌ '}
          {t.type === 'warning' && '⚠️ '}
          {t.type === 'info' && 'ℹ️ '}
          {t.message}
        </div>
      ))}
    </div>
  );
}
