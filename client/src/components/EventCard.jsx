import { Link } from 'react-router-dom';

export default function EventCard({ event }) {
  const dateLabel = new Date(event.dateTime).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  });
  return (
    <Link to={`/events/${event.id}`} className="ticket-tilt flex bg-surface border border-white/10 rounded-xl overflow-hidden">
      <div className="flex-1 p-5">
        <p className="text-xs uppercase tracking-wide text-marquee mb-2">{event.category?.replace('-', ' ')}</p>
        <h3 className="text-lg mb-1">{event.title}</h3>
        <p className="text-sm text-ink/60">{event.venueName}, {event.city}</p>
        <p className="text-sm text-ink/50 mt-2">{dateLabel}</p>
      </div>
      <div className="ticket-stub ticket-perforation w-20 flex flex-col items-center justify-center gap-1 bg-white/[0.03]">
        <span className="text-[10px] uppercase tracking-wide text-ink/40 rotate-90 whitespace-nowrap">
          {event.type === 'show' ? 'Seated' : 'Entry'}
        </span>
      </div>
    </Link>
  );
}