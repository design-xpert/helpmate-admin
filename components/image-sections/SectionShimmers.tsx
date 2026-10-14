"use client";

export function ZoneCardShimmerGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm"
        >
          {/* Image Banner Shimmer */}
          <div className="h-40 bg-slate-200 dark:bg-slate-800 relative">
            <div className="absolute top-2 left-2 w-10 h-4 bg-slate-300 dark:bg-slate-700 rounded-full" />
            <div className="absolute top-2 right-2 w-12 h-4 bg-slate-300 dark:bg-slate-700 rounded-full" />
          </div>

          {/* Details Shimmer */}
          <div className="p-3 space-y-2.5">
            <div className="space-y-1.5">
              <div className="h-4 w-3/5 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="h-3 w-2/5 bg-slate-100 dark:bg-slate-800/80 rounded-md" />
            </div>

            <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800/60 rounded-md" />

            {/* Areas Tags */}
            <div className="flex gap-1.5 pt-1">
              <div className="h-4 w-14 bg-slate-100 dark:bg-slate-800 rounded-md" />
              <div className="h-4 w-12 bg-slate-100 dark:bg-slate-800 rounded-md" />
              <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded-md" />
            </div>
          </div>

          {/* Actions Bottom Bar */}
          <div className="px-3 pb-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800" />
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800" />
            <div className="w-12 h-6 rounded-lg bg-slate-100 dark:bg-slate-800" />
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TrendingCardShimmerGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm"
        >
          {/* Image Banner Shimmer */}
          <div className="h-36 bg-slate-200 dark:bg-slate-800 relative">
            <div className="absolute top-2 left-2 w-16 h-4 bg-slate-300 dark:bg-slate-700 rounded-full" />
            <div className="absolute top-2 right-2 w-12 h-4 bg-slate-300 dark:bg-slate-700 rounded-full" />
          </div>

          {/* Details Shimmer */}
          <div className="p-3 space-y-2">
            <div className="flex justify-between items-center">
              <div className="h-3 w-1/3 bg-slate-100 dark:bg-slate-800/80 rounded-md" />
              <div className="h-3 w-10 bg-slate-100 dark:bg-slate-800/80 rounded-md" />
            </div>

            <div className="h-3.5 w-4/5 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="space-y-1">
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800/60 rounded-md" />
              <div className="h-2.5 w-2/3 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
            </div>

            <div className="flex justify-between items-center pt-1">
              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="h-3 w-12 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
            </div>
          </div>

          {/* Actions Bottom Bar */}
          <div className="px-3 pb-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="w-14 h-6 rounded-lg bg-slate-100 dark:bg-slate-800" />
            <div className="w-16 h-6 rounded-lg bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function QuickServiceShimmerGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm"
        >
          {/* Image Banner Shimmer */}
          <div className="h-36 bg-slate-200 dark:bg-slate-800 relative">
            <div className="absolute top-2 left-2 w-16 h-4 bg-slate-300 dark:bg-slate-700 rounded-full" />
            <div className="absolute top-2 right-2 w-10 h-4 bg-slate-300 dark:bg-slate-700 rounded-full" />
          </div>

          {/* Details Shimmer */}
          <div className="p-3 space-y-2">
            <div className="flex justify-between items-center">
              <div className="h-3 w-1/3 bg-slate-100 dark:bg-slate-800/80 rounded-md" />
              <div className="h-3 w-10 bg-slate-100 dark:bg-slate-800/80 rounded-md" />
            </div>

            <div className="h-3.5 w-4/5 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="space-y-1">
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800/60 rounded-md" />
              <div className="h-2.5 w-2/3 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
            </div>

            <div className="flex justify-between items-center pt-1">
              <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="h-3 w-12 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
            </div>
          </div>

          {/* Actions Bottom Bar */}
          <div className="px-3 pb-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
            <div className="w-16 h-6 rounded-lg bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PackageRowShimmer({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2.5 w-full animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 shrink-0" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-36 h-3.5 bg-slate-200 dark:bg-slate-700 rounded-md" />
                <div className="w-16 h-3 bg-slate-100 dark:bg-slate-800 rounded-md" />
              </div>
              <div className="w-24 h-3 bg-slate-100 dark:bg-slate-800/80 rounded-md" />
            </div>
          </div>
          <div className="w-24 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function CategoryModalPackageShimmer({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2 w-full animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 shrink-0" />
            <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 shrink-0" />
            <div className="space-y-1.5">
              <div className="w-32 h-3.5 bg-slate-200 dark:bg-slate-700 rounded-md" />
              <div className="w-20 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-md" />
            </div>
          </div>
          <div className="w-14 h-5 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0" />
        </div>
      ))}
    </div>
  );
}
