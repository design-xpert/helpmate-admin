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
  const [hasError, setHasError] = useState(false);
  const formattedUrl = formatImageUrl(src, packageId);

  useEffect(() => {
    setHasError(false);
  }, [src, packageId]);

  const initials = getTitleInitials(title, fallback);

  if (formattedUrl && !hasError) {
    return (
      <img
        src={formattedUrl}
        alt={title}
        referrerPolicy="no-referrer"
        className={className}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#48073d] via-[#610c52] to-[#801C6E] text-white select-none ${containerClassName}`}
    >
      <div
        className={`${badgeSize} rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 text-white font-black flex items-center justify-center shadow-lg tracking-wider`}
      >
        {initials}
      </div>
    </div>
  );
}
