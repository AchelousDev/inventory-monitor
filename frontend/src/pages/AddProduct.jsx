/**
 * AddProduct.jsx — form that creates a product through POST /products.
 *
 * onAddProduct now performs a network request (via App → productService).
 * We use async/await in the submit handler so we can clear the form only
 * after the server succeeds, and show an error if the API is down.
 */
import { useState } from "react";

/**
 * @param {Object} props
 * @param {(payload: { name: string; url: string }) => Promise<void>} props.onAddProduct
 */
export function AddProduct({ onAddProduct }) {
  const [productName, setProductName] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [validationMessage, setValidationMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * handleSubmit — client-side trim check, then awaits the parent add handler.
   */
  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");

    const name = productName.trim();
    const url = productUrl.trim();

    if (!name || !url) {
      setValidationMessage("Please enter both a product name and a URL.");
      return;
    }

    setValidationMessage("");
    setIsSubmitting(true);

    try {
      await onAddProduct({ name, url });
      setProductName("");
      setProductUrl("");
    } catch {
      setSubmitError(
        "Could not reach the server. Is the backend running on port 3001?"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page">
      <div className="page__header">
        <h1 className="page__title">Add Product</h1>
        <p className="page__subtitle">
          The server sets <strong>Out of Stock</strong> and{" "}
          <strong>last checked</strong> when it creates the row.
        </p>
      </div>

      <form className="form-card" onSubmit={handleSubmit} noValidate>
        {validationMessage ? (
          <p className="form-error" role="alert">
            {validationMessage}
          </p>
        ) : null}
        {submitError ? (
          <p className="form-error" role="alert">
            {submitError}
          </p>
        ) : null}

        <label className="form-field">
          <span className="form-field__label">Product name</span>
          <input
            type="text"
            name="productName"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g. Wireless Mouse"
            autoComplete="off"
            disabled={isSubmitting}
          />
        </label>

        <label className="form-field">
          <span className="form-field__label">Product URL</span>
          <input
            type="url"
            name="productUrl"
            value={productUrl}
            onChange={(e) => setProductUrl(e.target.value)}
            placeholder="https://..."
            disabled={isSubmitting}
          />
        </label>

        <button
          type="submit"
          className="btn btn--primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving…" : "Add to monitor list"}
        </button>
      </form>
    </main>
  );
}
