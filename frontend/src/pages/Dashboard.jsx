/**
 * Dashboard.jsx — notifications panel, product search/filter, and product cards.
 *
 * App still owns the full `products` array from the API. Search text and the
 * status dropdown live here in local state because they are UI-only concerns:
 * they do not need to sync across routes or persist to the server yet.
 *
 * The list you see is *derived*: we filter `products` in memory on every render
 * when search or filter changes. That pattern keeps a single source of truth
 * (the prop) while the view reflects the user’s current query—no duplicate
 * “full list” state to keep in sync.
 *
 * Refresh the page (or trigger your own refetch) to see updates from the
 * backend’s scheduled checks—there is no WebSocket in this learning stack yet.
 */
import { useState, useMemo } from "react";
import { ProductCard } from "../components/ProductCard";

/** Status values must match what the API stores on each product. */
const STATUS_FILTER_OPTIONS = [
  "All",
  "In Stock",
  "Out of Stock",
  "Limited Stock",
  "Unknown",
];

/**
 * @param {Object} props
 * @param {Array<{ id: string; name: string; url?: string; status: string; lastChecked: string; statusChanged?: boolean; history?: Array<{ previousStatus: string; newStatus: string; checkedAt: string }> }>} props.products
 * @param {Array<{ id: string; message: string; createdAt: string }>} props.notifications
 * @param {boolean} props.isLoading
 * @param {(id: string) => Promise<void>} props.onDeleteProduct
 * @param {(id: string) => Promise<void>} props.onCheckProduct
 */
export function Dashboard({
  products,
  notifications,
  isLoading,
  onDeleteProduct,
  onCheckProduct,
}) {
  const isEmpty = !isLoading && products.length === 0;

  /**
   * searchQuery — controlled input value. Storing it in state lets React
   * re-render on each keystroke so we can recompute the filtered list immediately.
   */
  const [searchQuery, setSearchQuery] = useState("");

  /**
   * statusFilter — which status bucket to show, or "All". State (not a const)
   * is needed so selecting an option updates the UI and triggers filtering.
   */
  const [statusFilter, setStatusFilter] = useState("All");

  /** Server returns up to 10; dashboard shows only the five newest for readability. */
  const notificationsToShow = notifications.slice(0, 5);

  /**
   * filteredProducts — derived data: same `products` prop, narrowed by name + status.
   * useMemo skips rebuilding the array unless inputs change (keeps renders cheap).
   * Why derive instead of storing a second list? You avoid bugs where the “full”
   * list and “filtered” list drift after add/delete/check from the parent.
   */
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const nameMatch =
        q === "" ||
        product.name.toLowerCase().includes(q);

      const statusMatch =
        statusFilter === "All" || product.status === statusFilter;

      return nameMatch && statusMatch;
    });
  }, [products, searchQuery, statusFilter]);

  const hasProducts = !isLoading && products.length > 0;
  const noMatches =
    hasProducts && filteredProducts.length === 0;

  return (
    <main className="page">
      <div className="page__header">
        <h1 className="page__title">Dashboard</h1>
        <p className="page__subtitle">
          Data is stored in MongoDB via the Express API in <code>/backend</code>.
          The server also runs <strong>automatic mock checks every 1 minute</strong>{" "}
          on all products (same logic as <strong>Check Status</strong>). Status{" "}
          <strong>changes</strong> append to the notifications feed (mock alerts—no
          email yet). Use search and status below to narrow the list—filtering
          runs in the browser.
        </p>
      </div>

      <section
        className="notifications-panel"
        aria-label="Recent notifications"
      >
        <h2 className="notifications-panel__title">Recent notifications</h2>
        {notificationsToShow.length === 0 ? (
          <p className="notifications-panel__empty" role="status">
            No status-change alerts yet. When a check produces a new status,
            a message will appear here.
          </p>
        ) : (
          <ul className="notifications-panel__list">
            {notificationsToShow.map((n) => (
              <li key={n.id} className="notifications-panel__item">
                <p className="notifications-panel__message">{n.message}</p>
                <p className="notifications-panel__time">{n.createdAt}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isLoading ? (
        <p className="page__loading" role="status">
          Loading products…
        </p>
      ) : isEmpty ? (
        <div className="empty-state" role="status">
          <p className="empty-state__title">No products yet</p>
          <p className="empty-state__text">
            Use <strong>Add Product</strong> in the navbar to create a row via{" "}
            <code>POST /products</code>. It will show up here after the server
            saves it.
          </p>
        </div>
      ) : (
        <>
          <div className="dashboard-toolbar" aria-label="Filter products">
            <div className="dashboard-toolbar__row">
              <label className="dashboard-toolbar__field">
                <span className="dashboard-toolbar__label">Search by name</span>
                <input
                  type="search"
                  className="dashboard-toolbar__input"
                  placeholder="Type to filter…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoComplete="off"
                />
              </label>
              <label className="dashboard-toolbar__field dashboard-toolbar__field--filter">
                <span className="dashboard-toolbar__label">Status</span>
                <select
                  className="dashboard-toolbar__select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter by stock status"
                >
                  {STATUS_FILTER_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {noMatches ? (
            <div className="empty-state empty-state--inline" role="status">
              <p className="empty-state__title">No matching products</p>
              <p className="empty-state__text">
                Nothing matches your search and status filter. Try clearing the
                search box or choosing <strong>All</strong> to see every product.
              </p>
            </div>
          ) : (
            <section className="card-grid" aria-label="Monitored products">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  url={product.url ?? ""}
                  status={product.status}
                  lastChecked={product.lastChecked}
                  statusChanged={Boolean(product.statusChanged)}
                  history={product.history ?? []}
                  onDelete={onDeleteProduct}
                  onCheckStatus={onCheckProduct}
                />
              ))}
            </section>
          )}
        </>
      )}
    </main>
  );
}
