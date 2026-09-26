import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import EventCard from '../components/EventCard.jsx';
import TicketLookup from '../components/TicketLookup.jsx';
import TicketModal from '../components/TicketModal.jsx';
import SkeletonCard from '../components/SkeletonCard.jsx';

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'poetry', label: 'Poetry' },
  { value: 'music', label: 'Music' },
  { value: 'book-fair', label: 'Book Fairs' },
  { value: 'anime-fair', label: 'Anime Fairs' },
];
function fuzzyMatch(query, text) {
  if (!query) return true;
  const q = query.toLowerCase();
  const t = (text || '').toLowerCase();
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}
export default function Home() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [myBookings, setMyBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  useEffect(() => {
    setLoading(true);
    const params = category ? { category } : {};
    api.get('/events', { params })
      .then((res) => setEvents(res.data.events))
      .catch((err) => {
        console.error('Failed to fetch events:', err);
        setError('Could not load events. Is the server running?');
      })
      .finally(() => setLoading(false));
  }, [category]);
  useEffect(() => {
    if (!currentUser) return;
    api.get('/bookings/mine').then((res) => setMyBookings(res.data.bookings));
  }, [currentUser]);
  const upcoming = myBookings.filter(
    (b) => b.status === 'confirmed' && new Date(b.dateTime).getTime() > Date.now()
  );
  const visibleEvents = events.filter(
    (e) => fuzzyMatch(search, e.title) || fuzzyMatch(search, e.city) || fuzzyMatch(search, e.venueName)
  );
  return (
    <div>
      <div className="bg-stage relative overflow-hidden">
        <div className="marquee-border animate-chase h-[3px] w-full" />
        <div className="px-8 py-16 max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="font-marquee text-6xl md:text-7xl leading-[0.95] text-ink tracking-wide">
              Sold-out<br />seats.<br />
              <span className="text-marquee">Sold-out</span><br />feelings.
            </h1>
            <p className="text-ink/60 mt-5 text-sm max-w-sm">
              Comedy, poetry, music, and fairs — reserved seating for shows,
              limited entry for fests, one stage.
            </p>
          </div>
          {currentUser ? (
            <TicketLookup bookings={myBookings} />
          ) : (
            <div className="bg-stageLight border border-marquee/20 rounded-2xl p-6">
              <p className="font-mono text-xs text-marquee/80 uppercase tracking-widest mb-2">Box office</p>
              <p className="text-ink/70 text-sm mb-4">
                Sign in to look up your tickets and see what's coming up next.
              </p>
              <a href="/login" className="glow-hover inline-block bg-marquee text-stage rounded-lg px-5 py-2.5 text-sm font-medium">
                Sign in
              </a>
            </div>
          )}
        </div>
        <div className="marquee-border animate-chase h-[3px] w-full" />
      </div>
      {upcoming.length > 0 && (
        <div className="px-8 py-8 max-w-5xl mx-auto border-b border-white/10">
          <p className="text-xs uppercase tracking-wide text-ink/40 mb-3">Your upcoming</p>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {upcoming.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBooking(b)}
                className="flex-shrink-0 w-56 border border-white/10 rounded-lg p-3 flex gap-3 bg-surface hover:border-marquee/40 transition-colors text-left"
              >
                <img src={b.qrCode} alt="" className="w-12 h-12 rounded" />
                <div>
                  <p className="text-sm font-medium truncate">{b.eventTitle}</p>
                  <p className="text-xs text-ink/50">
                    {new Date(b.dateTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="px-8 py-12 max-w-5xl mx-auto">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events, cities, venues…"
          className="w-full max-w-sm mb-4 bg-surface border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-marquee"
        />
        <div className="flex gap-2 mb-8 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                category === c.value ? 'bg-marquee text-stage border-marquee' : 'border-white/15 hover:border-white/40'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <>
            {!error && visibleEvents.length === 0 && (
              <p className="text-ink/50 text-sm">No events match your search.</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {visibleEvents.map((event) => <EventCard key={event.id} event={event} />)}
            </div>
          </>
        )}
      </div>
      <TicketModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
    </div>
  );
}