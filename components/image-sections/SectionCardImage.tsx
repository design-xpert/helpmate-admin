"use client";

import { useState, useEffect } from "react";
import { formatImageUrl, getTitleInitials } from "@/lib/api";

export function SectionCardImage({
  src,
  packageId,
  title,
  className = "w-full h-full object-cover",
  containerClassName = "",
  badgeSize = "w-12 h-12 text-xl",
  fallback = "HM",
}: {
  src?: string;
  packageId?: string;
  title: string;
  className?: string;
  containerClassName?: string;
  badgeSize?: string;
  fallback?: string;
}) {
  const formattedUrl = formatImageUrl(src, packageId);
  const [hasError, setHasError] = useState(!formattedUrl);

  useEffect(() => {
    setHasError(!formattedUrl);
  }, [formattedUrl]);

  const initials = getTitleInitials(title, fallback);

  // 1. If image is not available OR failed to load -> SHOW TEXT FALLBACK
  if (!formattedUrl || hasError) {
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#48073d] via-[#610c52] to-[#801C6E] text-white select-none animate-in fade-in duration-200 ${containerClassName}`}
      >
        <div
          className={`${badgeSize} rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 text-white font-black flex items-center justify-center shadow-lg tracking-wider`}
        >
          {initials}
        </div>
      </div>
    );
  }

  // 2. Render image directly without Next.js Image loader restrictions
  return (
    <div className={`relative w-full h-full overflow-hidden ${containerClassName}`}>
      <img
        src={formattedUrl}
        alt={title}
        className={className}
        onError={() => {
          setHasError(true);
        }}
      />
    </div>
  );
}
