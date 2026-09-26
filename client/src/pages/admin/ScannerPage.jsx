import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../../services/api';

export default function ScannerPage() {
  const scannerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [result, setResult] = useState(null); // { type: 'success' | 'error', ...details }
  const startScanner = async () => {
    setStarting(true);
    const container = document.getElementById('qr-reader');
    if (container) container.innerHTML = '';
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          await scanner.pause(true);
          handleScan(decodedText);
        }
      );
      setIsScanning(true);
    } catch (err) {
      setResult({ type: 'error', message: 'Could not access camera: ' + err });
    } finally {
      setStarting(false);
    }
  };
  const stopScanner = async () => {
    const scanner = scannerRef.current;
    if (scanner?.isScanning) await scanner.stop().catch(() => {});
    scanner?.clear?.();
    setIsScanning(false);
    setResult(null);
  };
  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;
      if (scanner?.isScanning) scanner.stop().catch(() => {});
      scanner?.clear?.();
    };
  }, []);
  const handleScan = async (bookingId) => {
    try {
      const { data } = await api.post(`/bookings/${bookingId}/check-in`);
      setResult({ type: 'success', ...data });
    } catch (err) {
      setResult({ type: 'error', message: err.response?.data?.error || 'Invalid ticket.' });
    }
  };
  const scanNext = () => {
    setResult(null);
    scannerRef.current?.resume();
  };
  if (result) {
    const isSuccess = result.type === 'success';
    return (
      <div className={`min-h-[70vh] flex flex-col items-center justify-center px-8 text-center ${isSuccess ? 'bg-green-50' : 'bg-red-50'}`}>
        <p className="text-6xl mb-4">{isSuccess ? '✅' : '❌'}</p>
        <h1 className="text-2xl mb-2">{isSuccess ? 'Checked in' : 'Entry denied'}</h1>
        {isSuccess ? (
          <>
            <p className="text-lg font-medium mb-1">{result.eventTitle}</p>
            {result.seatIds && <p className="text-ink/60">Seats: {result.seatIds.join(', ')}</p>}
            {result.quantity && <p className="text-ink/60">Tickets: {result.quantity}</p>}
          </>
        ) : (
          <p className="text-ink/70 max-w-sm">{result.message}</p>
        )}
        <div className="flex gap-3 mt-8">
          <button onClick={scanNext} className="bg-ink text-canvas rounded-full px-6 py-3 text-sm font-medium">
            Scan next ticket
          </button>
          <button onClick={stopScanner} className="border border-ink/15 rounded-full px-6 py-3 text-sm font-medium">
            Stop scanner
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="px-8 py-12 max-w-md mx-auto">
      <h1 className="text-3xl mb-6">Check-in Scanner</h1>
      <div id="qr-reader" className="rounded-xl overflow-hidden mb-4" />
      {!isScanning ? (
        <button
          onClick={startScanner}
          disabled={starting}
          className="bg-ink text-canvas rounded-full px-6 py-3 text-sm font-medium disabled:opacity-50"
        >
          {starting ? 'Starting camera…' : 'Start scanner'}
        </button>
      ) : (
        <button
          onClick={stopScanner}
          className="border border-ink/15 rounded-full px-6 py-2.5 text-sm font-medium"
        >
          Stop scanner
        </button>
      )}
    </div>
  );
}