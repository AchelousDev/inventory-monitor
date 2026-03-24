/**
 * App.jsx — root layout, routing, and dashboard data synced with the API.
 *
 * We keep two lists in state: products (cards) and notifications (activity feed).
 * They are separate because the server stores them in different collections—
 * mirroring that split in React makes refreshes and mental models easier.
 *
 * After a successful PATCH check, we merge the updated product *and* refetch
 * notifications so a new “status changed” row appears without reloading the page.
 */
import { useState, useCallback, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Dashboard } from "./pages/Dashboard";
import { AddProduct } from "./pages/AddProduct";
import * as productService from "./services/productService";
import * as notificationService from "./services/notificationService";

export default function App() {
  /** Mirrors whatever GET /products returned last (plus merges after mutations). */
  const [products, setProducts] = useState([]);

  /** Latest rows from GET /notifications (server returns up to 10; UI may show 5). */
  const [notifications, setNotifications] = useState([]);

  /** True until the first successful product load (or failure) finishes. */
  const [isLoading, setIsLoading] = useState(true);

  /** User-visible API errors (load, add, delete, check). Cleared on the next success. */
  const [loadError, setLoadError] = useState(null);

  const refreshProducts = useCallback(async () => {
    setLoadError(null);
    setIsLoading(true);
    try {
      const list = await productService.getProducts();
      setProducts(list);
    } catch (err) {
      setLoadError(err.message ?? "Could not load products.");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * refreshNotifications — GET the feed. Called on mount and after a check
   * that might have created a new notification (status transition only).
   */
  const refreshNotifications = useCallback(async () => {
    try {
      const list = await notificationService.getNotifications();
      setNotifications(list);
    } catch (err) {
      console.error("[App] notifications fetch failed:", err);
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const addProduct = useCallback(async ({ name, url }) => {
    setLoadError(null);
    const created = await productService.addProduct({ name, url });
    setProducts((prev) => [...prev, created]);
  }, []);

  const deleteProduct = useCallback(async (id) => {
    setLoadError(null);
    try {
      await productService.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setLoadError(err.message ?? "Could not delete product.");
    }
  }, []);

  /**
   * checkProduct — PATCH the product, merge into state, then reload notifications.
   * The second fetch picks up a row only if the server detected a status change.
   */
  const checkProduct = useCallback(async (id) => {
    setLoadError(null);
    try {
      const updated = await productService.checkProductStatus(id);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? updated : p))
      );
      await refreshNotifications();
    } catch (err) {
      setLoadError(err.message ?? "Could not check product status.");
    }
  }, [refreshNotifications]);

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />
        {loadError ? (
          <div className="app-banner app-banner--error" role="alert">
            {loadError}
          </div>
        ) : null}
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                products={products}
                notifications={notifications}
                isLoading={isLoading}
                onDeleteProduct={deleteProduct}
                onCheckProduct={checkProduct}
              />
            }
          />
          <Route
            path="/add"
            element={<AddProduct onAddProduct={addProduct} />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
