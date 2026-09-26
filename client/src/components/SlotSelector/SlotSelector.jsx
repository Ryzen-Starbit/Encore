import { useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext.jsx';

export default function SlotSelector({ event, onHold }) {
  const { currentUser } = useAuth();
  const [quantities, setQuantities] = useState({});
  const [submitting, setSubmitting] = useState(null);
  const [error, setError] = useState('');
  const [waitlisted, setWaitlisted] = useState({});
  const totalCapacity = event.timeSlots.reduce((sum, s) => sum + s.capacity, 0);
  const totalRemaining = event.timeSlots.reduce((sum, s) => sum + (s.remaining ?? s.capacity), 0);
  const occupancyPct = totalCapacity > 0 ? Math.round(((totalCapacity - totalRemaining) / totalCapacity) * 100) : 0;
  const setQty = (slotId, qty, max) => {
    const clamped = Math.max(0, Math.min(qty, max));
    setQuantities((prev) => ({ ...prev, [slotId]: clamped }));
  };
  const handleHold = async (slot) => {
    const quantity = quantities[slot.id] || 0;
    if (quantity < 1) return;
    setSubmitting(slot.id);
    setError('');
    try {
      const res = await api.post('/holds/slot', { eventId: event.id, slotId: slot.id, quantity });
      onHold({ type: 'slot', slotId: slot.id, quantity, expiresAt: res.data.expiresAt, holdId: res.data.holdId });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not hold those tickets.');
    } finally {
      setSubmitting(null);
    }
  };
  const handleWaitlist = async (slot) => {
    setError('');
    try {
      await api.post('/waitlist', { eventId: event.id, slotId: slot.id });
      setWaitlisted((prev) => ({ ...prev, [slot.id]: true }));
    } catch (err) {
      setError(err.response?.data?.error || 'Could not join the waitlist.');
    }
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="mb-2">
        <div className="flex justify-between text-xs text-ink/50 mb-1">
          <span>{occupancyPct}% full</span>
          <span>{totalRemaining} left overall</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-marquee transition-all" style={{ width: `${occupancyPct}%` }} />
        </div>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {event.timeSlots.map((slot) => {
        const remaining = slot.remaining ?? slot.capacity;
        const qty = quantities[slot.id] || 0;
        const soldOut = remaining === 0;
        const price = slot.effectivePrice ?? slot.price;
        const isSurging = price > slot.price;
        return (
          <div key={slot.id} className="flex items-center justify-between border border-white/10 rounded-lg px-4 py-3">
            <div>
              <p className="font-medium">{slot.label}</p>
              <p className="text-xs text-ink/50">
                {soldOut ? 'Sold out' : `${remaining} left`} · <span className={isSurging ? 'text-marquee' : ''}>₹{price}</span>
                {isSurging && <span className="text-ink/40"> (demand pricing)</span>}
              </p>
            </div>
            {soldOut ? (
              waitlisted[slot.id] ? (
                <span className="text-xs text-ink/50">You're on the waitlist</span>
              ) : (
                <button onClick={() => handleWaitlist(slot)} disabled={!currentUser} className="border border-marquee/40 text-marquee rounded-full px-4 py-2 text-xs font-medium disabled:opacity-40">
                  Join waitlist
                </button>
              )
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-white/15 rounded-full">
                  <button onClick={() => setQty(slot.id, qty - 1, remaining)} className="w-8 h-8 text-sm hover:bg-white/5 rounded-full">−</button>
                  <span className="w-6 text-center text-sm">{qty}</span>
                  <button onClick={() => setQty(slot.id, qty + 1, remaining)} className="w-8 h-8 text-sm hover:bg-white/5 rounded-full">+</button>
                </div>
                <button onClick={() => handleHold(slot)} disabled={qty < 1 || submitting === slot.id} className="glow-hover bg-marquee text-stage rounded-full px-4 py-2 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed">
                  {submitting === slot.id ? 'Holding…' : 'Book'}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}