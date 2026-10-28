"use client";

import { formatImageUrl } from "@/lib/api";

// Maintain a set of loaded URLs and a map of HTMLImageElements in memory to keep decoded bitmaps warm in browser RAM
function getLoadedSet(): Set<string> {
  if (typeof window !== "undefined") {
    if (!(window as any).__helpmate_loaded_images__) {
      (window as any).__helpmate_loaded_images__ = new Set<string>();
    }
    return (window as any).__helpmate_loaded_images__;
  }
  return ssrLoadedSet;
}
const ssrLoadedSet = new Set<string>();

function getImageElementsMap(): Map<string, HTMLImageElement> {
  if (typeof window !== "undefined") {
    if (!(window as any).__helpmate_image_elements__) {
      (window as any).__helpmate_image_elements__ = new Map<string, HTMLImageElement>();
    }
    return (window as any).__helpmate_image_elements__;
  }
  return ssrImageElements;
}
const ssrImageElements = new Map<string, HTMLImageElement>();

function getDataUrlMap(): Map<string, string> {
  if (typeof window !== "undefined") {
    if (!(window as any).__helpmate_data_urls__) {
      (window as any).__helpmate_data_urls__ = new Map<string, string>();
    }
    return (window as any).__helpmate_data_urls__;
  }
  return ssrDataUrls;
}
const ssrDataUrls = new Map<string, string>();

/**
 * Check if an image URL has already been preloaded or loaded in the current browser session.
 */
export function isImagePreloaded(src?: string, packageId?: string): boolean {
  if (!src && !packageId) return false;
  const formatted = formatImageUrl(src, packageId);
  if (!formatted) return false;
  if (formatted.startsWith("data:") || formatted.startsWith("blob:")) return true;
  return getLoadedSet().has(formatted);
}

/**
 * Mark an image URL as successfully loaded.
 */
export function markImageLoaded(url: string): void {
  if (!url) return;
  getLoadedSet().add(url);
}

/**
 * Store a custom base64 or blob data URL in memory (e.g. for uploaded icons or previews)
 */
export function storeDataUrl(key: string, dataUrl: string): void {
  if (!key || !dataUrl) return;
  getDataUrlMap().set(key, dataUrl);
  markImageLoaded(dataUrl);
}

/**
 * Retrieve a stored custom data URL.
 */
export function getStoredDataUrl(key: string): string | null {
  return getDataUrlMap().get(key) || null;
}

/**
 * Fetch and store an image in memory as a base64 Data URL so it is permanently cached in memory
 * and renders with 0ms latency without any network call or reload.
 */
export async function cacheImageDataUrl(url?: string, key?: string): Promise<string | null> {
  if (typeof window === "undefined" || !url) return null;
  const formatted = formatImageUrl(url);
  if (!formatted) return null;

  if (formatted.startsWith("data:") || formatted.startsWith("blob:")) {
    if (key) storeDataUrl(key, formatted);
    return formatted;
  }

  const existing = getStoredDataUrl(formatted) || (key ? getStoredDataUrl(key) : null);
  if (existing) return existing;

  try {
    const res = await fetch(formatted);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (base64) {
          storeDataUrl(formatted, base64);
          if (key) storeDataUrl(key, base64);
          resolve(base64);
        } else {
          resolve(null);
        }
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Preload and decode a single image in the background.
 */
export function preloadImage(src?: string, packageId?: string): Promise<string | null> {
  if (typeof window === "undefined" || (!src && !packageId)) {
    return Promise.resolve(null);
  }

  const formatted = formatImageUrl(src, packageId);
  if (!formatted) return Promise.resolve(null);

  if (getLoadedSet().has(formatted)) {
    return Promise.resolve(formatted);
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      // Keep reference in element map so browser GC doesn't discard decoded raster
      getImageElementsMap().set(formatted, img);

      const onDone = () => {
        markImageLoaded(formatted);
        resolve(formatted);
      };

      img.onload = onDone;
      img.onerror = () => {
        // Resolve anyway so queue continues
        resolve(null);
      };

      img.src = formatted;

      // Use modern HTMLImageElement.decode() for non-blocking GPU rasterization
      if (typeof img.decode === "function") {
        img.decode().then(onDone).catch(() => {
          // If decode rejects, onload or onerror will handle it
        });
      }
    } catch {
      resolve(null);
    }
  });
}

/**
 * Batch preload a list of images in parallel with capped concurrency.
 */
export function preloadImages(
  items: (string | { src?: string; packageId?: string } | undefined | null)[]
): void {
  if (typeof window === "undefined" || !Array.isArray(items) || items.length === 0) return;

  const validItems = items.filter(Boolean);
  if (validItems.length === 0) return;

  // Process in small batches of 6 concurrent requests so network is never choked
  const BATCH_SIZE = 6;
  let index = 0;

  function runNextBatch() {
    if (index >= validItems.length) return;
    const batch = validItems.slice(index, index + BATCH_SIZE);
    index += BATCH_SIZE;

    Promise.all(
      batch.map((item) => {
        if (typeof item === "string") {
          return preloadImage(item);
        } else if (item && typeof item === "object") {
          return preloadImage(item.src, item.packageId);
        }
        return Promise.resolve(null);
      })
    ).then(() => {
      if (index < validItems.length) {
        if (typeof (window as any).requestIdleCallback === "function") {
          (window as any).requestIdleCallback(() => runNextBatch(), { timeout: 1000 });
        } else {
          setTimeout(runNextBatch, 50);
        }
      }
    });
  }

  runNextBatch();
}

/**
 * Clear preloaded image cache if needed.
 */
export function clearImageCache(): void {
  getLoadedSet().clear();
  getImageElementsMap().clear();
  getDataUrlMap().clear();
}
