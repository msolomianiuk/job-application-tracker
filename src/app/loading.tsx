export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 py-4 sm:py-8 px-4">
      <div className="max-w-7xl mx-auto flex flex-col gap-6" data-testid="page-skeleton">
        {/* Top navigation bar skeleton */}
        <div className="bg-slate-900 p-4 rounded-lg shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-auto">
            <div className="h-6 w-56 bg-slate-700 rounded animate-pulse" />
            <div className="h-3 w-80 max-w-full bg-slate-800 rounded animate-pulse mt-2 hidden md:block" />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-4 w-40 bg-slate-700 rounded animate-pulse hidden sm:block" />
            <div className="h-9 w-24 bg-slate-800 border border-slate-600 rounded-md animate-pulse" />
          </div>
        </div>

        {/* Form + list skeleton */}
        <div className="space-y-6">
          <div className="h-40 bg-white dark:bg-gray-800 rounded-lg shadow-md animate-pulse" />
          <div className="space-y-4">
            <div className="h-24 bg-white dark:bg-gray-800 rounded-lg shadow-md animate-pulse" />
            <div className="h-24 bg-white dark:bg-gray-800 rounded-lg shadow-md animate-pulse" />
            <div className="h-24 bg-white dark:bg-gray-800 rounded-lg shadow-md animate-pulse" />
          </div>
        </div>
      </div>
    </main>
  );
}
