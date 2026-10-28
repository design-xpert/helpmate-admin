"use client";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Attach store to window to ensure single source of truth across client navigation until browser refresh
function getStore(): Map<string, CacheEntry<any>> {
  if (typeof window !== "undefined") {
    if (!(window as any).__helpmate_module_cache__) {
      (window as any).__helpmate_module_cache__ = new Map<string, CacheEntry<any>>();
    }
    return (window as any).__helpmate_module_cache__;
  }
  return ssrStore;
}
const ssrStore = new Map<string, CacheEntry<any>>();

/**
 * Retrieve cached data for a module. Persists until browser refresh.
 */
export function getCachedModuleData<T>(moduleKey: string, _ttlMs?: number): T | null {
  const entry = getStore().get(moduleKey);
  if (entry && entry.data !== undefined && entry.data !== null) {
    return entry.data as T;
  }
  return null;
}

/**
 * Get cached module data (persists until browser refresh).
 */
export function getStoredModuleData<T>(moduleKey: string): T | null {
  const entry = getStore().get(moduleKey);
  return entry && entry.data !== undefined && entry.data !== null ? (entry.data as T) : null;
}

/**
 * Store latest API data for a module with current timestamp.
 */
export function setCachedModuleData<T>(moduleKey: string, data: T): void {
  if (data === undefined || data === null) return;
  getStore().set(moduleKey, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Check if the cache for a module has stored data (valid until page refresh).
 */
export function isModuleCacheFresh(moduleKey: string, _ttlMs?: number): boolean {
  const entry = getStore().get(moduleKey);
  if (!entry || entry.data === undefined || entry.data === null) {
    return false;
  }
  if (Array.isArray(entry.data) && entry.data.length === 0) {
    return false;
  }
  return true;
}

/**
 * Invalidate cache for a specific module or clear all.
 */
export function clearModuleCache(moduleKey?: string): void {
  if (moduleKey) {
    getStore().delete(moduleKey);
  } else {
    getStore().clear();
  }
}

