export default function SkeletonCard() {
  return (
    <div className="flex bg-surface border border-white/10 rounded-xl overflow-hidden">
      <div className="flex-1 p-5">
        <div className="skeleton h-3 w-16 rounded mb-3" />
        <div className="skeleton h-5 w-3/4 rounded mb-2" />
        <div className="skeleton h-3 w-1/2 rounded mb-2" />
        <div className="skeleton h-3 w-1/3 rounded" />
      </div>
      <div className="w-20 bg-white/[0.03]" />
    </div>
  );
}