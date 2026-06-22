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
  const coordsRef = useRef(null);

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
        coordsRef.current = { latitude, longitude };
        verifyZone(latitude, longitude);
      },
      (error) => {
        console.error('GPS Error:', error);
        setGpsStatus('error');
        setGpsError('Accès GPS refusé.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };
  const verifyZone = async (lat, lng) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        '/api/pointage/verifier-zone',
        { latitude: lat, longitude: lng },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.autorise) {
        setGpsStatus('ok');
        coordsRef.current = { latitude: lat, longitude: lng, zone_id: res.data.zone_id };
      } else {
        setGpsStatus('error');
        setGpsError(res.data.message || 'Vous êtes hors zone autorisée.');
      }
    } catch (err) {
      console.error('Zone verification error:', err);
      setGpsStatus('ok');
      coordsRef.current = { latitude: lat, longitude: lng };
    }
  };

  const startScanner = async () => {
    setScanError('');
    setScanResult('');
    setScannerActive(true);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');

      setTimeout(() => {
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
      const currentCoords = coordsRef.current || coords;
      const payload = {
        latitude: currentCoords.latitude,
        longitude: currentCoords.longitude,
        qrCode: scannedCode,
        zone_id: currentCoords.zone_id,
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
    <div className="flex justify-center items-center min-h-full py-5">
      <div className="card w-full max-w-[420px] p-0 overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center gap-4">
          <button
            className="bg-surface-800 border border-border rounded-full text-foreground w-9 h-9 flex items-center justify-center cursor-pointer hover:bg-surface-700 transition-colors"
            onClick={() => router.push('/dashboard')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </button>
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight font-heading">Scanner QR Code</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Validez votre présence via caméra</p>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-5">

          {/* Status Checks */}
          <div className="flex flex-col gap-3 bg-surface-800/50 p-4 rounded-xl border border-border">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`${gpsStatus === 'ok' ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </div>
                <div className="text-sm text-foreground font-medium">Signal GPS</div>
              </div>
              <div className="flex items-center">
                {gpsStatus === 'checking' && <span className="skeleton skeleton-circle w-4 h-4"></span>}
                {gpsStatus === 'ok' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                {gpsStatus === 'error' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>}
              </div>
            </div>
            {gpsStatus === 'error' && gpsError && (
              <div className="text-sm text-destructive mt-1">
                {gpsError}
              </div>
            )}
          </div>

          {/* Camera Viewfinder */}
          {gpsStatus === 'ok' && !pointageResult && (
            <div>
              {scanError && (
                <div className="text-destructive p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-sm mb-4 text-center">
                  {scanError}
                </div>
              )}

              <div 
                id="qr-reader-container" 
                className={`w-full rounded-2xl overflow-hidden border border-border aspect-square bg-black ${scannerActive ? 'block' : 'hidden'}`}
              ></div>

              {!scannerActive && !scanResult && (
                <div className="aspect-square border-2 border-dashed border-surface-600 rounded-2xl flex flex-col items-center justify-center bg-surface-800/30 gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-400">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </div>
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
            <div className="py-8 px-5 text-center flex flex-col items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${pointageResult.pointage.type === 'ENTREE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-cyan-500/10 text-cyan-500'}`}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2 font-heading">Pointage Validé</h3>
                <p className="text-muted-foreground text-sm">
                  Statut : <strong className="text-foreground">{pointageResult.pointage.type}</strong><br/>
                  Heure : <strong className="text-foreground">{pointageResult.pointage.heure}</strong>
                </p>
              </div>

              <button 
                className="btn-secondary w-full mt-4"
                onClick={() => router.push('/dashboard')} 
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
