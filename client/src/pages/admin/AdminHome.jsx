import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const CARDS = [
  { to: '/admin/events', title: 'Manage events', desc: 'Create, edit, and remove shows and fares.', icon: '🎟️' },
  { to: '/admin/scanner', title: 'Check-in scanner', desc: 'Scan tickets at the venue entrance.', icon: '📷' },
  { to: '/admin/analytics', title: 'Analytics', desc: 'Revenue, occupancy, and booking trends.', icon: '📊' },
];

export default function AdminHome() {
  const [stats, setStats] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  useEffect(() => {
    api.get('/analytics').then((res) => setStats(res.data)).catch(() => {});
    api.get('/events', { params: { includePast: true } }).then((res) => {
      const sorted = [...res.data.events].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRecentEvents(sorted.slice(0, 5));
    });
  }, []);
  return (
    <div className="px-8 py-12 max-w-3xl mx-auto">
      <h1 className="text-3xl mb-2">Admin</h1>
      <p className="text-ink/50 text-sm mb-8">Manage the stage, one ticket at a time.</p>
      {stats && (
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="border border-white/10 bg-surface rounded-xl p-4">
            <p className="text-xs text-ink/50 uppercase tracking-wide">Revenue</p>
            <p className="text-xl mt-1 text-marquee">₹{stats.totalRevenue}</p>
          </div>
          <div className="border border-white/10 bg-surface rounded-xl p-4">
            <p className="text-xs text-ink/50 uppercase tracking-wide">Active bookings</p>
            <p className="text-xl mt-1">{stats.totalBookings}</p>
          </div>
          <div className="border border-white/10 bg-surface rounded-xl p-4">
            <p className="text-xs text-ink/50 uppercase tracking-wide">Cancelled</p>
            <p className="text-xl mt-1 text-velvet">{stats.totalCancelled}</p>
          </div>
        </div>
      )}
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        {CARDS.map((c) => (
          <Link
            key={c.to} to={c.to}
            className="group border border-white/10 bg-surface rounded-xl p-5 hover:border-marquee/40 hover:shadow-[0_0_24px_-8px_rgba(242,183,5,0.35)] hover:-translate-y-0.5 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-marquee/10 flex items-center justify-center text-lg mb-3 group-hover:bg-marquee/20 transition-colors">
              {c.icon}
            </div>
            <p className="font-medium mb-1">{c.title}</p>
            <p className="text-xs text-ink/50">{c.desc}</p>
          </Link>
        ))}
      </div>
      <h2 className="text-lg mb-3">Recently created events</h2>
      <div className="flex flex-col gap-2">
        {recentEvents.length === 0 && <p className="text-ink/50 text-sm">No events yet.</p>}
        {recentEvents.map((ev) => (
          <div key={ev.id} className="flex items-center justify-between border border-white/10 bg-surface rounded-lg px-4 py-3">
            <div>
              <p className="text-sm font-medium">{ev.title}</p>
              <p className="text-xs text-ink/50">{ev.type} · {ev.category} · {ev.city}</p>
            </div>
            <Link to="/admin/events" className="text-xs text-marquee hover:underline">Manage</Link>
          </div>
        ))}
      </div>
    </div>
  );
}