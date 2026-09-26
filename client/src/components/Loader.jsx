export default function Loader({ label = 'Loading' }) {
  return (
    <div className="flex items-center gap-3 text-sm text-ink/50">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-marquee animate-pulse"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
      {label}
    </div>
  );
}