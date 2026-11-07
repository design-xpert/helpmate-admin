"use client";

const STORAGE_KEY = "helpmate_unopened_booking_ids";
const EVENT_NAME = "helpmate:new_booking_changed";

/**
 * Returns the set of booking IDs (or booking numbers) that are newly received
 * and haven't been opened/viewed by the admin yet.
 */
export function getUnopenedBookingIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  } catch {
    return new Set();
  }
}

/**
 * Returns true if a specific booking ID or booking number is unopened.
 */
export function isBookingUnopened(id?: string | null): boolean {
  if (!id) return false;
  const set = getUnopenedBookingIds();
  return set.has(String(id));
}

/**
 * Returns true if there is at least one new unopened booking.
 */
export function hasUnopenedBookings(): boolean {
  return getUnopenedBookingIds().size > 0;
}

/**
 * Marks a new booking ID as received/unopened and dispatches an update event.
 */
export function addNewBooking(id: string) {
  if (typeof window === "undefined" || !id) return;
  try {
    const set = getUnopenedBookingIds();
    set.add(String(id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { id, count: set.size } }));
  } catch (err) {
    console.error("addNewBooking error:", err);
  }
}

/**
 * Marks multiple new booking IDs as received/unopened.
 */
export function addNewBookings(ids: string[]) {
  if (typeof window === "undefined" || !ids || ids.length === 0) return;
  try {
    const set = getUnopenedBookingIds();
    ids.forEach((id) => {
      if (id) set.add(String(id));
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { count: set.size } }));
  } catch (err) {
    console.error("addNewBookings error:", err);
  }
}

/**
 * Marks a booking as opened/viewed by removing its ID from the unopened set.
 */
export function markBookingAsOpened(id?: string | null) {
  if (typeof window === "undefined" || !id) return;
  try {
    const set = getUnopenedBookingIds();
    const strId = String(id);
    if (set.has(strId)) {
      set.delete(strId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { removedId: strId, count: set.size } }));
    }
  } catch (err) {
    console.error("markBookingAsOpened error:", err);
  }
}

/**
 * Clears all unopened booking flags.
 */
export function clearAllUnopenedBookings() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { count: 0 } }));
  } catch (err) {
    console.error("clearAllUnopenedBookings error:", err);
  }
}

/**
 * Subscribes to new booking changes across the entire app and across tabs.
 */
export function subscribeToNewBookings(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}

