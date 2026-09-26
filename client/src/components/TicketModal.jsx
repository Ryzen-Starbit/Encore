import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';

export default function TicketModal({ booking, onClose }) {
  const ticketRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  if (!booking) return null;
  const dateLabel = new Date(booking.dateTime).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit',
  });
  const renderTicketCanvas = () =>
    html2canvas(ticketRef.current, { backgroundColor: '#14110F', scale: 2 });
  const handleDownload = async () => {
    if (!ticketRef.current) return;
    setDownloading(true);
    try {
      const canvas = await renderTicketCanvas();
      const link = document.createElement('a');
      link.download = `${booking.eventTitle.replace(/\s+/g, '-')}-ticket.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to generate ticket image:', err);
    } finally {
      setDownloading(false);
    }
  };
  const handleShare = async () => {
    if (!ticketRef.current) return;
    setSharing(true);
    try {
      const canvas = await renderTicketCanvas();
      canvas.toBlob(async (blob) => {
        const file = new File([blob], `${booking.eventTitle}-ticket.png`, { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: booking.eventTitle,
              text: `I'm going to ${booking.eventTitle}! 🎟️`,
            });
          } catch (err) {
            console.error('Failed to share ticket:', err);
          }
        } else {
          const link = document.createElement('a');
          link.download = file.name;
          link.href = URL.createObjectURL(blob);
          link.click();
        }
        setSharing(false);
      }, 'image/png');
    } catch (err) {
      console.error('Failed to share ticket:', err);
      setSharing(false);
    }
  };
  const eventPassed = new Date(booking.dateTime).getTime() < Date.now();
  const statusLabel = booking.status === 'cancelled' ? 'Cancelled'
    : booking.checkedIn ? 'Checked in'
    : eventPassed ? 'Expired'
    : 'Active';
  const statusColor = booking.status === 'cancelled' ? 'text-velvet bg-velvet/15'
    : booking.checkedIn ? 'text-green-400 bg-green-500/15'
    : eventPassed ? 'text-ink/50 bg-white/10'
    : 'text-marquee bg-marquee/15';
  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className="max-w-sm w-full">
        <div ref={ticketRef} className="bg-stage border border-marquee/30 rounded-2xl overflow-hidden">
          <div className="marquee-border h-[3px] w-full" />
          <div className="p-6 text-center">
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full mb-4 ${statusColor}`}>{statusLabel}</span>
            <p className="text-xs uppercase tracking-widest text-marquee/70 font-mono mb-1">Encore</p>
            <h2 className="text-2xl font-display mb-1">{booking.eventTitle}</h2>
            <p className="text-ink/60 text-sm">{booking.venueName}, {booking.city}</p>
            <p className="text-ink/50 text-xs mb-6">{dateLabel}</p>
            <img src={booking.qrCode} alt="Ticket QR" className="w-40 h-40 mx-auto rounded-lg bg-white p-2" />
            <div className="mt-6 pt-4 border-t border-dashed border-white/15 flex justify-between text-xs text-ink/60">
              <span className="font-mono">
                {booking.holdType === 'seat' ? `Seats: ${booking.seatIds?.join(', ')}` : `${booking.quantity} ticket(s)`}
              </span>
              <span>₹{booking.amount}</span>
            </div>
            <p className="text-[10px] text-ink/30 font-mono mt-2">#{booking.id}</p>
          </div>
          <div className="marquee-border h-[3px] w-full" />
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={handleDownload} disabled={downloading} className="glow-hover flex-1 bg-marquee text-stage rounded-full py-2.5 text-sm font-medium disabled:opacity-50">
            {downloading ? 'Preparing…' : 'Download'}
          </button>
          <button onClick={handleShare} disabled={sharing} className="flex-1 border border-marquee/40 text-marquee rounded-full py-2.5 text-sm font-medium disabled:opacity-50">
            {sharing ? 'Sharing…' : 'Share'}
          </button>
          <button onClick={onClose} className="border border-white/15 rounded-full px-5 py-2.5 text-sm">Close</button>
        </div>
      </div>
    </div>
  );
}