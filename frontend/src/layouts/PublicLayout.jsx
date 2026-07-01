import { Outlet, Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';

export default function PublicLayout() {
  return (
    <div className="app-shell public-shell">
      <nav className="public-nav">
        <Link to="/" className="brand-mark">TrustFund</Link>
        <div className="public-nav-actions">
          <Link to="/login" className="nav-link-soft">Login</Link>
          <Link to="/register" className="btn btn-cfx btn-sm">Start <FiArrowRight /></Link>
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
