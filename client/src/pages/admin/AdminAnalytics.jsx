import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import api from '../../services/api';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-stage border border-marquee/30 rounded-lg px-3 py-2 text-xs">
      <p className="text-ink/60 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-marquee font-medium">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get('/analytics').then((res) => setData(res.data)).catch(() => setError('Failed to load analytics.'));
  }, []);
  if (error) return <p className="px-8 py-12 text-red-400 text-sm">{error}</p>;
  if (!data) return <p className="px-8 py-12 text-ink/50 text-sm">Loading…</p>;
  const topEvent = [...data.perEvent].sort((a, b) => b.revenue - a.revenue)[0];
  return (
    <div className="px-8 py-12 max-w-4xl mx-auto">
      <h1 className="text-3xl mb-8">Analytics</h1>
      <div className="grid sm:grid-cols-4 gap-4 mb-10">
        <div className="border border-white/10 bg-surface rounded-xl p-5">
          <p className="text-xs text-ink/50 uppercase tracking-wide">Total Revenue</p>
          <p className="text-2xl mt-1 text-marquee">₹{data.totalRevenue}</p>
        </div>
        <div className="border border-white/10 bg-surface rounded-xl p-5">
          <p className="text-xs text-ink/50 uppercase tracking-wide">Active Bookings</p>
          <p className="text-2xl mt-1">{data.totalBookings}</p>
        </div>
        <div className="border border-white/10 bg-surface rounded-xl p-5">
          <p className="text-xs text-ink/50 uppercase tracking-wide">Cancelled</p>
          <p className="text-2xl mt-1 text-velvet">{data.totalCancelled}</p>
        </div>
        <div className="border border-marquee/30 bg-stageLight rounded-xl p-5">
          <p className="text-xs text-marquee/70 uppercase tracking-wide">Top event</p>
          <p className="text-lg mt-1 truncate">{topEvent?.title || '—'}</p>
        </div>
      </div>
      <h2 className="text-xl mb-4">Revenue by event</h2>
      <div className="h-64 mb-10 bg-surface border border-white/10 rounded-xl p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.perEvent}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFD447" stopOpacity={1} />
                <stop offset="100%" stopColor="#F2841B" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="title" tick={{ fontSize: 12, fill: 'rgba(245,241,234,0.5)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: 'rgba(245,241,234,0.5)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(242,183,5,0.06)' }} />
            <Bar dataKey="revenue" fill="url(#revenueGrad)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <h2 className="text-xl mb-4">Occupancy by event (%)</h2>
      <div className="h-64 mb-10 bg-surface border border-white/10 rounded-xl p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.perEvent}>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="title" tick={{ fontSize: 12, fill: 'rgba(245,241,234,0.5)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: 'rgba(245,241,234,0.5)' }} domain={[0, 100]} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(242,183,5,0.06)' }} />
            <Bar dataKey="occupancy" fill="#5B4EE5" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <h2 className="text-xl mb-4">Bookings over time</h2>
      <div className="h-64 bg-surface border border-white/10 rounded-xl p-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.bookingsOverTime}>
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F2B705" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#F2B705" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgba(245,241,234,0.5)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: 'rgba(245,241,234,0.5)' }} allowDecimals={false} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="count" stroke="#F2B705" strokeWidth={2} fill="url(#lineGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}