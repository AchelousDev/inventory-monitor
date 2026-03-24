/**
 * notificationService.js — HTTP calls for the notifications feed.
 *
 * Split from productService.js so each file maps to one API resource. The
 * dashboard loads products and notifications separately: two GETs, two pieces
 * of React state in App—clear for learners tracing “where does this list come from?”
 *
 * Notifications are not embedded on Product on purpose: the backend keeps a
 * separate collection so the feed can grow and be queried without bloating
 * every product document.
 *
 * Uses fetch only (no axios).
 */

/** Same base URL as products; share VITE_API_URL with the rest of the app. */
const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3001";

/**
 * GET /notifications — latest items (server limits to 10, newest first).
 * @returns {Promise<Array<{ id: string; productId: string; productName: string; message: string; previousStatus: string; newStatus: string; createdAt: string }>>}
 */
export async function getNotifications() {
  const response = await fetch(`${API_BASE_URL}/notifications`);

  if (!response.ok) {
    throw new Error(`Could not load notifications (HTTP ${response.status}).`);
  }

  return response.json();
}
