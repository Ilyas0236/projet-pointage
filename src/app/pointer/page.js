/* eslint-disable */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function PointerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('checking'); // checking, ok, error
  const [gpsError, setGpsError] = useState('');
  const [coords, setCoords] = useState(null);

  const [scannerActive, setScannerActive] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const [scanError, setScanError] = useState('');

  const [pointageResult, setPointageResult] = useState(null);

  const isSubmitting = useRef(false);

  const html5QrCodeInstance = useRef(null);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      setGpsError('La géolocalisation n\'est pas supportée.');
      return;
    }

    setGpsStatus('checking');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ latitude, longitude });
        setGpsStatus('ok');
        startScanner();
      },
      (error) => {
        console.error('GPS Error:', error);
        setGpsStatus('error');
        setGpsError('Accès GPS refusé.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };



  const startScanner = async () => {
    setScannerActive(true);
    setScanError('');
    setScanResult('');

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      
      setTimeout(() => {
        const scannerElement = document.getElementById('qr-reader-container');
        if (!scannerElement) return;

        const html5QrCode = new Html5Qrcode('qr-reader-container');
        html5QrCodeInstance.current = html5QrCode;

        html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            setScanResult(decodedText);
            stopScanner();
            submitPointage(decodedText);
          },
          (errorMessage) => {
            // Quietly handle scan errors
          }
        ).catch((err) => {
          console.error('Camera start error:', err);
          setScanError('Caméra inaccessible.');
        });
      }, 500);

    } catch (err) {
      console.error('Failed to import scanner package', err);
      setScanError('Erreur du scanner.');
    }
  };

  const stopScanner = () => {
    if (html5QrCodeInstance.current && html5QrCodeInstance.current.isScanning) {
      html5QrCodeInstance.current.stop().then(() => {
        setScannerActive(false);
      }).catch((err) => {
        console.error('Failed to stop scanner', err);
      });
    } else {
      setScannerActive(false);
    }
  };

  const submitPointage = async (scannedCode) => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        qrCode: scannedCode,
      };

      const response = await axios.post('/api/pointage', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPointageResult(response.data);
    } catch (err) {
      console.error('Pointage error:', err);
      let errorMsg = 'Pointage échoué.';
      if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.message) {
        errorMsg = `Erreur système : ${err.message}`;
      }
      setScanError(errorMsg);
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    requestLocation();

    return () => {
      stopScanner();
    };
  }, [router]);


  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100%', padding: '20px 0' }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '0', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-full)', color: 'var(--text-primary)', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => router.push('/dashboard')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Scanner QR Code</h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Validez votre présence via caméra</p>
          </div>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          

          {/* Status Checks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-hover)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ color: gpsStatus === 'ok' ? 'var(--success)' : 'var(--text-muted)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>Signal GPS</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {gpsStatus === 'checking' && <span className="skeleton skeleton-circle" style={{ width: '16px', height: '16px' }}></span>}
                {gpsStatus === 'ok' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                {gpsStatus === 'error' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>}
              </div>
            </div>

            </div>
          </div>

          {/* Camera Viewfinder */}
          {gpsStatus === 'ok' && !pointageResult && (
            <div>
              {scanError && (
                <div style={{ color: 'var(--error)', padding: '12px', background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'center' }}>
                  {scanError}
                </div>
              )}

              <div 
                id="qr-reader-container" 
                style={{ 
                  width: '100%', 
                  borderRadius: '16px', 
                  overflow: 'hidden',
                  display: scannerActive ? 'block' : 'none',
                  border: '1px solid var(--border-default)',
                  aspectRatio: '1/1',
                  background: 'black'
                }}
              ></div>

              {!scannerActive && !scanResult && (
                <div style={{ aspectRatio: '1/1', border: '1px dashed var(--border-glass-strong)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-hover)' }}>
                  <button 
                    className="btn-primary" 
                    onClick={startScanner}
                  >
                    Activer la Caméra
                  </button>
                </div>
              )}


            </div>
          )}

          {/* Results Screen */}
          {pointageResult && (
            <div style={{ padding: '32px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: pointageResult.pointage.type === 'ENTREE' ? 'var(--success-bg)' : 'var(--info-bg)', color: pointageResult.pointage.type === 'ENTREE' ? 'var(--success)' : 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>Pointage Validé</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                  Statut : <strong style={{ color: 'var(--text-primary)' }}>{pointageResult.pointage.type}</strong><br/>
                  Heure : <strong style={{ color: 'var(--text-primary)' }}>{pointageResult.pointage.heure}</strong>
                </p>
              </div>

              <button 
                className="btn-secondary"
                onClick={() => router.push('/dashboard')} 
                style={{ width: '100%', marginTop: '16px' }}
              >
                Retour au tableau de bord
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
