"use client";

import React, { useState, useEffect } from "react";
import { Wrench, Image as ImageIcon } from "lucide-react";
import { formatImageUrl, getTitleInitials } from "@/lib/api";
import { isImagePreloaded, markImageLoaded, preloadImage } from "@/lib/imageCache";

interface TableImageProps {
  src?: string;
  packageId?: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  fallbackIcon?: "wrench" | "image";
  showInitialsFallback?: boolean;
}

export function TableImage({
  src,
  packageId,
  alt = "Image",
  className = "w-full h-full object-cover group-hover:scale-110 transition-transform duration-300",
  containerClassName = "w-12 h-12 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0 group flex items-center justify-center relative",
  fallbackIcon = "wrench",
  showInitialsFallback = true,
}: TableImageProps) {
  const formattedUrl = formatImageUrl(src, packageId);
  const [hasError, setHasError] = useState(!formattedUrl);

  useEffect(() => {
    setHasError(!formattedUrl);
    if (formattedUrl) {
      preloadImage(formattedUrl);
    }
  }, [formattedUrl]);

  const IconComponent = fallbackIcon === "wrench" ? Wrench : ImageIcon;

  // 1. Not available or failed to load -> SHOW TEXT (or fallback icon)
  if (!formattedUrl || hasError) {
    if (showInitialsFallback && alt && alt !== "Image" && alt.trim()) {
      return (
        <div
          className={`${containerClassName} bg-gradient-to-br from-[#48073d] to-[#801C6E] text-white font-black text-xs select-none tracking-wider`}
        >
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

  // 2. Render image directly via native <img> with eager loading & async decoding for instant rendering
  return (
    <div className={`relative ${containerClassName}`}>
      <img
        src={formattedUrl}
        alt={alt}
        loading="eager"
        decoding="async"
        className={className}
        onLoad={() => {
          markImageLoaded(formattedUrl);
        }}
        onError={() => {
          setHasError(true);
        }}
      />
    </div>
  );
}
