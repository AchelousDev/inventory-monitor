/**
 * Navbar.jsx — top navigation for the whole app.
 *
 * Uses NavLink from React Router so the active route gets a visual hint.
 * Keeps navigation in one place instead of repeating links on every page.
 */
import { NavLink } from "react-router-dom";

/** Small style helper: active vs inactive link colors */
const linkClass = ({ isActive }) =>
  isActive ? "nav-link nav-link--active" : "nav-link";

export function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar__inner">
        <span className="navbar__brand">Inventory Monitor</span>
        <nav className="navbar__links" aria-label="Main">
          <NavLink to="/" end className={linkClass}>
            Dashboard
          </NavLink>
          <span className="navbar__sep" aria-hidden>
            |
          </span>
          <NavLink to="/add" className={linkClass}>
            Add Product
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
