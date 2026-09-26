import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext.jsx';

export default function SeatMap({ event, onHold }) {
  const { currentUser } = useAuth();
  const { rows, seatsPerRow, price } = event.seatMap;
  const totalSeats = rows * seatsPerRow;
  const [selected, setSelected] = useState([]);
  const [unavailable, setUnavailable] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [waitlisted, setWaitlisted] = useState(false);
  const loadUnavailable = () => {
    api.get(`/holds/event/${event.id}/unavailable-seats`).then((res) => setUnavailable(res.data.seatIds));
  };
  useEffect(() => {
    loadUnavailable();
    const interval = setInterval(loadUnavailable, 10000);
    return () => clearInterval(interval);
  }, [event.id]);
  const seatId = (row, col) => `R${row}C${col}`;
  const occupancyPct = totalSeats > 0 ? Math.round((unavailable.length / totalSeats) * 100) : 0;
  const soldOut = unavailable.length >= totalSeats;
  const toggleSeat = (id) => {
    if (unavailable.includes(id)) return;
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };
  const handleHold = async () => {
    if (selected.length === 0) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/holds/seat', { eventId: event.id, seatIds: selected });
      onHold({ type: 'seat', seatIds: selected, expiresAt: res.data.expiresAt, holdIds: res.data.holdIds });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not hold those seats.');
      loadUnavailable();
      setSelected([]);
    } finally {
      setSubmitting(false);
    }
  };
  const handleWaitlist = async () => {
    setError('');
    try {
      await api.post('/waitlist', { eventId: event.id, slotId: null });
      setWaitlisted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not join the waitlist.');
    }
  };
  return (
    <div>
      <div className="mb-4">
        <div className="flex justify-between text-xs text-ink/50 mb-1">
          <span>{occupancyPct}% full</span>
          <span>{totalSeats - unavailable.length} seats left</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-marquee transition-all" style={{ width: `${occupancyPct}%` }} />
        </div>
      </div>
      {soldOut ? (
        <div className="text-center py-8">
          <p className="text-ink/70 mb-4">This show is sold out.</p>
          {waitlisted ? (
            <p className="text-sm text-ink/50">You're on the waitlist — we'll email you if a seat opens up.</p>
          ) : (
            <button onClick={handleWaitlist} disabled={!currentUser} className="border border-marquee/40 text-marquee rounded-full px-6 py-2.5 text-sm font-medium disabled:opacity-40">
              Join waitlist
            </button>
          )}
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center gap-2 mb-6">
            {Array.from({ length: rows }, (_, r) => (
              <div key={r} className="flex gap-1.5">
                {Array.from({ length: seatsPerRow }, (_, c) => {
                  const id = seatId(r + 1, c + 1);
                  const isUnavailable = unavailable.includes(id);
                  const isSelected = selected.includes(id);
                  return (
                    <button
                      key={id} disabled={isUnavailable} onClick={() => toggleSeat(id)}
                      className={`w-7 h-7 rounded text-[10px] flex items-center justify-center transition-colors ${
                        isUnavailable ? 'bg-white/5 text-ink/20 cursor-not-allowed'
                          : isSelected ? 'bg-marquee text-stage' : 'bg-white/10 hover:bg-white/20'
                      }`}
                      title={id}
                    >
                      {c + 1}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 text-xs text-ink/60 mb-4">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-white/10 inline-block" /> Available</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-marquee inline-block" /> Selected</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-white/5 inline-block" /> Taken</span>
          </div>
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink/60">{selected.length} seat{selected.length !== 1 && 's'} × ₹{price} = ₹{selected.length * price}</p>
            <button onClick={handleHold} disabled={selected.length === 0 || submitting} className="glow-hover bg-marquee text-stage rounded-full px-6 py-2.5 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed">
              {submitting ? 'Holding…' : 'Hold seats (8 min to pay)'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}