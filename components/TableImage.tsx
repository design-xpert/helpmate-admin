"use client";

import React, { useState, useEffect } from "react";
import { Wrench, Image as ImageIcon } from "lucide-react";
import { formatImageUrl, getTitleInitials } from "@/lib/api";

interface TableImageProps {
  src?: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  fallbackIcon?: "wrench" | "image";
}

export function TableImage({
  src,
  alt = "Image",
  className = "w-full h-full object-cover group-hover:scale-110 transition-transform duration-300",
  containerClassName = "w-12 h-12 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0 group flex items-center justify-center relative",
  fallbackIcon = "wrench",
}: TableImageProps) {
  const [hasError, setHasError] = useState(false);
  const formattedUrl = formatImageUrl(src);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const IconComponent = fallbackIcon === "wrench" ? Wrench : ImageIcon;

  if (!formattedUrl || hasError) {
    if (alt && alt !== "Image" && alt.trim()) {
      return (
        <div className={`${containerClassName} bg-gradient-to-br from-[#48073d] to-[#801C6E] text-white font-black text-xs select-none tracking-wider`}>
          {getTitleInitials(alt)}
        </div>
      );
    }
    return (
      <div className={containerClassName}>
        <IconComponent className="w-5 h-5 text-slate-400" />
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      <img
        src={formattedUrl}
        alt={alt}
        loading="eager"
        decoding="async"
        referrerPolicy="no-referrer"
        className={className}
        onError={() => setHasError(true)}
      />
    </div>
  );
}
