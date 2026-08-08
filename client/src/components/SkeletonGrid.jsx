export default function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card overflow-hidden animate-pulse">
          <div className="h-40 bg-cloud" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-cloud rounded w-2/3" />
            <div className="h-3 bg-cloud rounded w-1/2" />
            <div className="h-3 bg-cloud rounded w-full" />
            <div className="h-3 bg-cloud rounded w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
