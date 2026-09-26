import { useEffect, useState } from 'react';
export default function Countdown({ expiresAt, onExpire }) {
  const [remaining, setRemaining] = useState(expiresAt - Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      const left = expiresAt - Date.now();
      setRemaining(left);
      if (left <= 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);
  const minutes = Math.max(0, Math.floor(remaining / 60000));
  const seconds = Math.max(0, Math.floor((remaining % 60000) / 1000));
  return (
    <span className={`font-medium ${remaining < 60000 ? 'text-red-600' : 'text-ink'}`}>
      {minutes}:{seconds.toString().padStart(2, '0')}
    </span>
  );
}