"use client";

import { COMING_SOON_CONFIGS } from "@/lib/comingSoonConfig";

interface ComingSoonOverlayProps {
  path?: string;
  title?: string;
}

export function ComingSoonOverlay({ path, title }: ComingSoonOverlayProps) {
  const config = path ? COMING_SOON_CONFIGS[path] : undefined;
  const displayTitle = title || config?.title || "";

  return (
    <div className="fixed inset-0 lg:left-64 top-16 z-40 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center select-none pointer-events-auto animate-in fade-in duration-300">
      <div className="relative z-10 space-y-4 max-w-lg">
        <span className="text-[11px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-full bg-white/10 text-white/90 border border-white/20">
          Module Status
        </span>
        <h1 className="text-4xl sm:text-5xl md:text-5xl font-black text-white tracking-widest uppercase drop-shadow-2xl">
          Coming Soon
        </h1>
        {displayTitle && (
          <p className="text-xs sm:text-sm font-bold text-slate-300 tracking-[0.2em] uppercase pt-2">
            {displayTitle}
          </p>
        )}
      </div>
    </div>
  );
}
