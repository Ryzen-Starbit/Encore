import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext.jsx';
import { STATES, citiesForState } from '../../data/indianCities';

const emptyShow = {
  title: '', description: '', category: 'comedy', type: 'show',
  venueName: '', state: '', city: '', dateTime: '',
  seatMap: { rows: 8, seatsPerRow: 10, price: 499 },
};
const emptyFare = {
  title: '', description: '', category: 'book-fair', type: 'fare',
  venueName: '', state: '', city: '', dateTime: '',
  timeSlots: [{ id: 'slot-1', label: '10 AM Batch', startTime: '', capacity: 100, price: 199 }],
};
function isEditLocked(dateTime) {
  return Date.now() > new Date(dateTime).getTime() - 24 * 60 * 60 * 1000;
}
export default function ManageEvents() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(emptyShow);
  const [status, setStatus] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [filterMine, setFilterMine] = useState(false);
  const loadEvents = () => {
    api.get('/events', { params: { includePast: true } }).then((res) => setEvents(res.data.events));
  };
  useEffect(loadEvents, []);
  const handleTypeSwitch = (type) => {
    setForm(type === 'show' ? emptyShow : emptyFare);
    setEditingId(null);
  };
  const handleStateChange = (state) => setForm({ ...form, state, city: '' });
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Saving…');
    try {
      if (editingId) {
        await api.put(`/events/${editingId}`, form);
        setStatus('Updated!');
      } else {
        await api.post('/events', form);
        setStatus('Created!');
      }
      handleTypeSwitch(form.type);
      loadEvents();
    } catch (err) {
      console.error(err);
      setStatus(err.response?.data?.details?.join(', ') || err.response?.data?.error || 'Failed to save event');
    }
  };
  const handleEdit = (ev) => {
    if (isEditLocked(ev.dateTime)) {
      setStatus('This event starts within 24 hours and can no longer be edited.');
      return;
    }
    setForm({ ...ev, dateTime: ev.dateTime?.slice(0, 16) });
    setEditingId(ev.id);
    setStatus('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handleDelete = async (id) => {
    if (!confirm('Delete this event?')) return;
    await api.delete(`/events/${id}`);
    loadEvents();
  };
  const cityOptions = form.state ? citiesForState(form.state) : [];
  const visibleEvents = filterMine ? events.filter((e) => e.createdBy === currentUser?.uid) : events;
  return (
    <div className="px-8 py-12 max-w-3xl mx-auto">
      <h1 className="text-3xl mb-8">{editingId ? 'Edit Event' : 'Manage Events'}</h1>
      <div className="flex gap-2 mb-6">
        <button onClick={() => handleTypeSwitch('show')} className={`px-4 py-2 rounded-full text-sm border ${form.type === 'show' ? 'bg-marquee text-stage border-marquee' : 'border-white/15'}`}>Show (reserved seating)</button>
        <button onClick={() => handleTypeSwitch('fare')} className={`px-4 py-2 rounded-full text-sm border ${form.type === 'fare' ? 'bg-marquee text-stage border-marquee' : 'border-white/15'}`}>Fare (limited entry)</button>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">Title
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </label>
        <label className="flex flex-col gap-1 text-sm">Description
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
        </label>
        <label className="flex flex-col gap-1 text-sm">Venue name
          <input value={form.venueName} onChange={(e) => setForm({ ...form, venueName: e.target.value })} required />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">State
            <select value={form.state} onChange={(e) => handleStateChange(e.target.value)} required>
              <option value="" disabled>Select state</option>
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">City
            <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required disabled={!form.state}>
              <option value="" disabled>{form.state ? 'Select city' : 'Select a state first'}</option>
              {cityOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">Category
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {form.type === 'show'
              ? ['comedy', 'poetry', 'music'].map((c) => <option key={c} value={c}>{c}</option>)
              : ['book-fair', 'anime-fair'].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">Date & time
          <input type="datetime-local" value={form.dateTime} min={new Date().toISOString().slice(0, 16)} onChange={(e) => setForm({ ...form, dateTime: e.target.value })} required />
        </label>
        {form.type === 'show' ? (
          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col gap-1 text-sm">Rows
              <input type="number" min={1} value={form.seatMap.rows} onChange={(e) => setForm({ ...form, seatMap: { ...form.seatMap, rows: +e.target.value } })} />
            </label>
            <label className="flex flex-col gap-1 text-sm">Seats per row
              <input type="number" min={1} value={form.seatMap.seatsPerRow} onChange={(e) => setForm({ ...form, seatMap: { ...form.seatMap, seatsPerRow: +e.target.value } })} />
            </label>
            <label className="flex flex-col gap-1 text-sm">Price per seat (₹)
              <input type="number" min={0} value={form.seatMap.price} onChange={(e) => setForm({ ...form, seatMap: { ...form.seatMap, price: +e.target.value } })} />
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">Slot label
              <input placeholder="e.g. 10 AM Batch" value={form.timeSlots[0].label} onChange={(e) => setForm({ ...form, timeSlots: [{ ...form.timeSlots[0], label: e.target.value }] })} />
            </label>
            <label className="flex flex-col gap-1 text-sm">Slot start time
              <input type="time" value={form.timeSlots[0].startTime} onChange={(e) => setForm({ ...form, timeSlots: [{ ...form.timeSlots[0], startTime: e.target.value }] })} />
            </label>
            <label className="flex flex-col gap-1 text-sm">Capacity (tickets)
              <input type="number" min={1} value={form.timeSlots[0].capacity} onChange={(e) => setForm({ ...form, timeSlots: [{ ...form.timeSlots[0], capacity: +e.target.value }] })} />
            </label>
            <label className="flex flex-col gap-1 text-sm">Price per ticket (₹)
              <input type="number" min={0} value={form.timeSlots[0].price} onChange={(e) => setForm({ ...form, timeSlots: [{ ...form.timeSlots[0], price: +e.target.value }] })} />
            </label>
          </div>
        )}
        <div className="flex gap-2 mt-2">
          <button type="submit" className="glow-hover flex-1 bg-marquee text-stage rounded-lg py-2.5 text-sm font-medium">{editingId ? 'Save changes' : 'Create event'}</button>
          {editingId && <button type="button" onClick={() => handleTypeSwitch(form.type)} className="px-4 py-2.5 text-sm border border-white/15 rounded-lg">Cancel edit</button>}
        </div>
        {status && <p className="text-sm text-ink/60">{status}</p>}
      </form>
      <hr className="my-8 border-white/10" />
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl">Existing events</h2>
        <div className="flex gap-2">
          <button onClick={() => setFilterMine(false)} className={`px-3 py-1 rounded-full text-xs border ${!filterMine ? 'bg-marquee text-stage border-marquee' : 'border-white/15'}`}>All events</button>
          <button onClick={() => setFilterMine(true)} className={`px-3 py-1 rounded-full text-xs border ${filterMine ? 'bg-marquee text-stage border-marquee' : 'border-white/15'}`}>Created by me</button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {visibleEvents.map((ev) => {
          const locked = isEditLocked(ev.dateTime);
          const mine = ev.createdBy === currentUser?.uid;
          return (
            <div key={ev.id} className="flex items-center justify-between border border-white/10 rounded-lg px-4 py-3">
              <div>
                <p className="font-medium">{ev.title}</p>
                <p className="text-xs text-ink/50">
                  {ev.type} · {ev.category} · {ev.city} · {mine ? 'you' : `admin ${ev.createdBy?.slice(0, 6)}`}
                  {locked && <span className="text-amber-400"> · editing locked (within 24h of event)</span>}
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleEdit(ev)} disabled={locked} className={`text-sm ${locked ? 'text-ink/30 cursor-not-allowed' : 'text-marquee hover:underline'}`}>Edit</button>
                <button onClick={() => handleDelete(ev.id)} className="text-velvet text-sm hover:underline">Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}