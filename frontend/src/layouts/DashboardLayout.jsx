import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { FiBell, FiBriefcase, FiCreditCard, FiFlag, FiGrid, FiLogOut, FiMenu, FiShield, FiTrendingUp, FiUser, FiUsers, FiX } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext.jsx';
import { notificationService } from '../services/notificationService.js';

const roleHome = {
  ADMIN: { to: '/app/admin', label: 'Admin Command' },
  CREATOR: { to: '/app/creator', label: 'Creator Studio' },
  DONOR: { to: '/app/donor', label: 'Donor Hub' }
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const home = roleHome[user?.role] || roleHome.DONOR;

  useEffect(() => {
    if (!user) return;
    const loadUnreadCount = () => notificationService.list()
      .then((items) => setUnreadCount(items.filter((item) => item.status === 'UNREAD').length))
      .catch(() => setUnreadCount(0));
    loadUnreadCount();
    window.addEventListener('notifications-updated', loadUnreadCount);
    return () => window.removeEventListener('notifications-updated', loadUnreadCount);
  }, [user]);

  const links = [
    { to: home.to, label: home.label, icon: FiGrid },
    ...(user?.role === 'CREATOR' ? [{ to: '/app/my-campaigns', label: 'My Campaigns', icon: FiBriefcase }] : []),
    ...(user?.role === 'DONOR' ? [{ to: '/app/my-donations', label: 'My Donations', icon: FiCreditCard }] : []),
    { to: '/app/campaigns', label: 'Campaigns', icon: FiBriefcase },
    ...(user?.role === 'ADMIN' ? [{ to: '/app/users', label: 'Users', icon: FiUsers }] : []),
    { to: '/app/escrow', label: 'Escrow Wallet', icon: FiCreditCard },
    ...(user?.role === 'CREATOR' || user?.role === 'ADMIN' ? [{ to: '/app/milestones', label: 'Milestones', icon: FiFlag }] : []),
    ...(user?.role === 'ADMIN' ? [{ to: '/app/fraud', label: 'Risk Monitor', icon: FiShield }] : []),
    { to: '/app/complaints', label: 'Grievances', icon: FiTrendingUp },
    { to: '/app/profile', label: 'Profile', icon: FiUser },
    { to: '/app/notifications', label: 'Notifications', icon: FiBell, badge: unreadCount }
  ];

  return (
    <div className="dashboard-shell">
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="sidebar-head">
          <span className="brand-mark">TrustFund</span>
          <button className="icon-btn mobile-only" type="button" onClick={() => setOpen(false)} aria-label="Close menu"><FiX /></button>
        </div>
        <div className="role-pill">{user?.role}</div>
        <nav className="sidebar-nav">
          {links.map(({ to, label, icon: Icon, badge }) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}>
              <Icon />
              <span>{label}</span>
              {badge > 0 && <strong className="side-badge">{badge > 99 ? '99+' : badge}</strong>}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="side-link side-logout" onClick={logout}>
          <FiLogOut />
          <span>Logout</span>
        </button>
      </aside>

      <main className="dashboard-main">
        <header className="topbar">
          <button className="icon-btn mobile-only" type="button" onClick={() => setOpen(true)} aria-label="Open menu"><FiMenu /></button>
          <div>
            <p className="eyebrow mb-1">Milestone Based Crowdfunding Platform</p>
            <h1>TrustFund</h1>
          </div>
          <div className="topbar-user">
            <span>{user?.name || user?.email}</span>
            <FiBell />
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
