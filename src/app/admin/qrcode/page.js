/* eslint-disable */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import QRCode from 'qrcode';
import { toast } from '@/components/Toast';

export default function AdminQRCode() {
  const router = useRouter();
  const [qrData, setQrData] = useState(null);
  const [qrImage, setQrImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0); // seconds left
  const [regenerating, setRegenerating] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchActiveQRCode();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fetchActiveQRCode = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await axios.get('/api/qrcode', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      setQrData(data);
      
      // Generate QR Code Image URL
      const dataUrl = await QRCode.toDataURL(data.code, {
        width: 300,
        margin: 2,
        color: {
          dark: '#ffffff', // White QR code
          light: '#0b1329', // Matching our slate background
        },
      });
      setQrImage(dataUrl);

      // Start countdown
      calculateTimeLeft(data.dateExpiration);
    } catch (err) {
      console.error('Error fetching QR Code:', err);
      if (err.response?.status === 404) {
        // No active QR code found, generate one automatically
        await handleRegenerate();
      } else if (err.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeLeft = (expirationDateStr) => {
    if (timerRef.current) clearInterval(timerRef.current);

    const updateTimer = () => {
      const difference = new Date(expirationDateStr) - new Date();
      if (difference <= 0) {
        setTimeLeft(0);
        clearInterval(timerRef.current);
      } else {
        setTimeLeft(Math.floor(difference / 1000));
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);
  };

  const handleRegenerate = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setRegenerating(true);
    try {
      const response = await axios.post('/api/qrcode', {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      setQrData(data);

      const dataUrl = await QRCode.toDataURL(data.code, {
        width: 300,
        margin: 2,
        color: {
          dark: '#ffffff',
          light: '#0b1329',
        },
      });
      setQrImage(dataUrl);
      calculateTimeLeft(data.dateExpiration);
      toast('Nouveau QR Code généré', 'success');
    } catch (err) {
      console.error('Error regenerating QR Code:', err);
      toast('Erreur lors de la régénération du QR Code.', 'error');
    } finally {
      setRegenerating(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Chargement du QR Code de sécurité...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px', width: '100%' }}>
      {/* Back button */}
      <div style={{ marginBottom: '24px' }}>
        <button className="btn-secondary" onClick={() => router.push('/admin')}>
          ← Espace Supervision
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', alignItems: 'center' }}>
        
        {/* Left Side: Instructions & Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card animate-fade-in">
            <h2 className="text-gradient" style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '14px' }}>
              QR Code de Présence Dynamique
            </h2>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '16px' }}>
              Ce QR Code est utilisé par vos collaborateurs pour certifier leur présence physique lors du pointage d'arrivée ou de départ.
            </p>

            <div style={{ background: 'rgba(0,0,0,0.02)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Génération :</span>
                <span style={{ fontWeight: 600 }}>
                  {qrData?.dateGeneration ? new Date(qrData.dateGeneration).toLocaleTimeString('fr-FR') : '-'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Expiration :</span>
                <span style={{ fontWeight: 600 }}>
                  {qrData?.dateExpiration ? new Date(qrData.dateExpiration).toLocaleTimeString('fr-FR') : '-'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Code Unique :</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>
                  {qrData?.code ? `${qrData.code.substring(0, 8)}...` : '-'}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <button
                className="btn-primary"
                onClick={handleRegenerate}
                disabled={regenerating}
                style={{ width: '100%' }}
              >
                {regenerating ? 'Régénération...' : '🔄 Régénérer le QR Code'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Large Display QR Code */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            className="glass-card animate-fade-in"
            style={{
              padding: '30px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 0 40px rgba(14, 165, 233, 0.15)',
              border: '1px solid rgba(14, 165, 233, 0.2)',
            }}
          >
            <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: 700 }}>
              Scannez pour Pointer
            </h3>

            {/* QR Code Frame */}
            <div
              style={{
                background: '#0b1329',
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-glass)',
                marginBottom: '20px',
                display: 'inline-block',
              }}
            >
              {qrImage ? (
                <img
                  src={qrImage}
                  alt="Pointage QR Code"
                  style={{
                    width: '260px',
                    height: '260px',
                    display: 'block',
                    borderRadius: 'var(--radius-sm)',
                  }}
                />
              ) : (
                <div style={{ width: '260px', height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>Génération...</p>
                </div>
              )}
            </div>

            {/* Timer Counter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Temps restant avant expiration
              </div>
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: timeLeft > 60 ? 'var(--primary)' : 'var(--error)',
                  fontFamily: 'monospace',
                }}
              >
                {timeLeft > 0 ? formatTime(timeLeft) : 'EXPIRÉ'}
              </div>
              <div>
                <span className={`badge ${timeLeft > 0 ? 'badge-success' : 'badge-error'}`}>
                  {timeLeft > 0 ? 'Actif' : 'Expiré / Veuillez régénérer'}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
