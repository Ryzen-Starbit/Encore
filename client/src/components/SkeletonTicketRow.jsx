export default function SkeletonTicketRow() {
  return (
    <div className="flex gap-4 border border-white/10 rounded-xl p-4 bg-surface">
      <div className="skeleton w-20 h-20 rounded" />
      <div className="flex-1">
        <div className="skeleton h-4 w-1/2 rounded mb-2" />
        <div className="skeleton h-3 w-1/3 rounded mb-2" />
        <div className="skeleton h-3 w-1/4 rounded" />
      </div>
    </div>
  );
}