import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function TicketLookup({ bookings }) {
  const [query, setQuery] = useState('');
  const [match, setMatch] = useState(null);
  const [searched, setSearched] = useState(false);
  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    setSearched(true);
    if (!q) return setMatch(null);
    const found = bookings.find(
      (b) => b.id.toLowerCase().includes(q) || b.eventTitle.toLowerCase().includes(q)
    );
    setMatch(found || null);
  };

  return (
    <div className="bg-stageLight border border-marquee/20 rounded-2xl p-6">
      <p className="font-mono text-xs text-marquee/80 uppercase tracking-widest mb-3">Ticket lookup</p>
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Booking ID or event name"
          className="flex-1 bg-stage border border-marquee/30 rounded-lg px-4 py-2.5 text-sm text-ink placeholder:text-ink/40 font-mono focus:outline-none focus:border-marquee"
        />
        <button type="submit" className="glow-hover bg-marquee text-stage rounded-lg px-5 py-2.5 text-sm font-medium">
          Insert
        </button>
      </form>
      {searched && (
        <div className="mt-4 animate-[fadeIn_0.3s_ease]">
          {match ? (
            <Link to="/profile" className="flex items-center gap-3 bg-stage rounded-lg p-3 hover:border-marquee/40 border border-transparent transition-colors">
              <img src={match.qrCode} alt="" className="w-12 h-12 rounded" />
              <div>
                <p className="text-ink text-sm font-medium">{match.eventTitle}</p>
                <p className="text-ink/50 text-xs font-mono">#{match.id.slice(0, 8)}</p>
              </div>
            </Link>
          ) : (
            <p className="text-ink/50 text-sm">No matching ticket found.</p>
          )}
        </div>
      )}
    </div>
  );
}