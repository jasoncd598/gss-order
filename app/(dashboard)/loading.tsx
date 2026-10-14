// Skeleton shown while dashboard pages stream in (also the Suspense boundary
// required by cacheComponents for per-request Supabase data).
export default function DashboardLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="flex justify-between items-center pb-4 border-b border-zinc-200">
        <div className="space-y-2">
          <div className="h-5 w-56 bg-zinc-200 rounded" />
          <div className="h-3 w-40 bg-zinc-200 rounded" />
        </div>
        <div className="h-8 w-40 bg-zinc-200 rounded" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-lg border border-zinc-200 h-28" />
        ))}
      </div>
      <div className="bg-white border border-zinc-200 rounded-lg h-80" />
    </div>
  );
}
