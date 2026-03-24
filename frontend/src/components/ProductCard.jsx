/**
 * ProductCard.jsx — one monitored product: status, change hint, history, actions.
 *
 * Props come from App via Dashboard (lifted state). We do not fetch here—the
 * parent owns the list and passes one product's fields down so all cards stay
 * consistent after PATCH /check returns a full updated document.
 *
 * When "Check Status" runs, onCheckStatus(id) updates App's products array;
 * React passes new props here, so status, lastChecked, history, and
 * statusChanged refresh without this component storing a duplicate copy.
 */
import { useState, useMemo } from "react";

/**
 * Maps API status strings to CSS suffixes for colored badges.
 * @param {string} status
 */
function statusToBadgeModifier(status) {
  switch (status) {
    case "In Stock":
    case "in_stock":
      return "in_stock";
    case "Out of Stock":
    case "out_of_stock":
      return "out_of_stock";
    case "Limited Stock":
      return "limited_stock";
    case "Unknown":
      return "unknown";
    default:
      return "unknown";
  }
}

/**
 * Normalizes legacy slug values to the same labels the API uses today.
 * @param {string} status
 */
function statusToLabel(status) {
  if (status === "in_stock") return "In Stock";
  if (status === "out_of_stock") return "Out of Stock";
  return status;
}

/**
 * @param {Object} props
 * @param {string} props.id
 * @param {string} props.name
 * @param {string} props.url
 * @param {string} props.status
 * @param {string} props.lastChecked
 * @param {boolean} [props.statusChanged]
 * @param {Array<{ previousStatus: string; newStatus: string; checkedAt: string }>} [props.history]
 * @param {(id: string) => Promise<void>} props.onDelete
 * @param {(id: string) => Promise<void>} props.onCheckStatus
 */
export function ProductCard({
  id,
  name,
  url,
  status,
  lastChecked,
  statusChanged = false,
  history = [],
  onDelete,
  onCheckStatus,
}) {
  const badgeModifier = statusToBadgeModifier(status);
  const label = statusToLabel(status);

  /**
   * Show the three newest entries: history grows at the end, so we take the
   * last three and reverse to list newest first in the UI.
   */
  const recentHistory = useMemo(() => {
    if (!Array.isArray(history) || history.length === 0) return [];
    return history.slice(-3).reverse();
  }, [history]);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const busy = isDeleting || isChecking;

  async function handleDeleteClick() {
    setIsDeleting(true);
    try {
      await onDelete(id);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleCheckClick() {
    setIsChecking(true);
    try {
      await onCheckStatus(id);
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <article className="product-card">
      <div className="product-card__body">
        <h2 className="product-card__title">{name}</h2>
        <p className="product-card__url">
          <span className="product-card__url-label">URL</span>
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="product-card__link"
            >
              {url}
            </a>
          ) : (
            <span className="product-card__url-missing">No URL</span>
          )}
        </p>
        <p className="product-card__meta">Last checked: {lastChecked}</p>
        {statusChanged ? (
          <p className="product-card__meta product-card__meta--highlight">
            Status changed on last check
          </p>
        ) : null}

        {recentHistory.length > 0 ? (
          <div className="product-card__history">
            <h3 className="product-card__history-title">Recent checks</h3>
            <ul className="product-card__history-list">
              {recentHistory.map((entry, index) => (
                <li key={`${entry.checkedAt}-${index}`} className="product-card__history-item">
                  <span className="product-card__history-transition">
                    {entry.previousStatus} → {entry.newStatus}
                  </span>
                  <span className="product-card__history-time">
                    Checked at: {entry.checkedAt}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="product-card__actions">
        <div className="product-card__badges">
          <span
            className={`product-card__badge product-card__badge--${badgeModifier}`}
            role="status"
          >
            {label}
          </span>
          {statusChanged ? (
            <span className="product-card__badge product-card__badge--changed">
              Changed
            </span>
          ) : null}
        </div>
        <div className="product-card__buttons">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={handleCheckClick}
            disabled={busy}
          >
            {isChecking ? "Checking…" : "Check Status"}
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={handleDeleteClick}
            disabled={busy}
          >
            {isDeleting ? "…" : "Delete"}
          </button>
        </div>
      </div>
    </article>
  );
}
