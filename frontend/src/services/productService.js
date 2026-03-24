/**
 * productService.js — all HTTP calls to the inventory API in one place.
 *
 * Why a service layer?
 * - Components call small named functions (getProducts, checkProductStatus)
 *   instead of repeating fetch URLs, methods, and error parsing everywhere.
 * - When the API changes (path, headers), you update one file and every screen
 *   keeps working. PATCH /check returns the full product (history, change flags).
 *
 * Uses the browser fetch API (no axios), as required.
 *
 * Notification list: see notificationService.js (separate resource, separate file).
 */

/** Backend base URL. Override with Vite env for deployment if needed. */
const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3001";

/**
 * GET /products — load every monitored product for the Dashboard.
 * @returns {Promise<Array<{ id: string; name: string; url: string; status: string; lastChecked: string }>>}
 */
export async function getProducts() {
  const response = await fetch(`${API_BASE_URL}/products`);

  if (!response.ok) {
    throw new Error(`Could not load products (HTTP ${response.status}).`);
  }

  return response.json();
}

/**
 * POST /products — create a new row; server sets status and lastChecked.
 * @param {{ name: string; url: string }} payload
 * @returns {Promise<{ id: string; name: string; url: string; status: string; lastChecked: string }>}
 */
export async function addProduct(payload) {
  const response = await fetch(`${API_BASE_URL}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = `Could not add product (HTTP ${response.status}).`;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      /* ignore JSON parse errors */
    }
    throw new Error(message);
  }

  return response.json();
}

/**
 * PATCH /products/:id/check — simulate a stock check; server picks a random
 * status and updates lastChecked. Returns the updated product JSON.
 *
 * @param {string} id
 * @returns {Promise<{ id: string; name: string; url: string; status: string; lastChecked: string }>}
 */
export async function checkProductStatus(id) {
  const response = await fetch(
    `${API_BASE_URL}/products/${encodeURIComponent(id)}/check`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!response.ok) {
    let message = `Could not check status (HTTP ${response.status}).`;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      /* ignore JSON parse errors */
    }
    throw new Error(message);
  }

  return response.json();
}

/**
 * DELETE /products/:id — remove one product by id.
 * @param {string} id
 */
export async function deleteProduct(id) {
  const response = await fetch(
    `${API_BASE_URL}/products/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );

  if (response.status === 404) {
    throw new Error("Product not found.");
  }

  if (!response.ok) {
    throw new Error(`Could not delete product (HTTP ${response.status}).`);
  }
}
