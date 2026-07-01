import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext.jsx';
import PublicLayout from '../layouts/PublicLayout.jsx';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import LandingPage from '../pages/LandingPage.jsx';
import LoginPage from '../pages/auth/LoginPage.jsx';
import RegisterPage from '../pages/auth/RegisterPage.jsx';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage.jsx';
import DonorDashboard from '../pages/dashboards/DonorDashboard.jsx';
import CreatorDashboard from '../pages/dashboards/CreatorDashboard.jsx';
import AdminDashboard from '../pages/dashboards/AdminDashboard.jsx';
import CampaignListingPage from '../pages/campaigns/CampaignListingPage.jsx';
import CampaignDetailsPage from '../pages/campaigns/CampaignDetailsPage.jsx';
import EscrowWalletPage from '../pages/EscrowWalletPage.jsx';
import MilestonesPage from '../pages/MilestonesPage.jsx';
import FraudMonitoringPage from '../pages/FraudMonitoringPage.jsx';
import NotificationsPage from '../pages/NotificationsPage.jsx';
import ComplaintsPage from '../pages/ComplaintsPage.jsx';
import AdminUsersPage from '../pages/AdminUsersPage.jsx';
import MyCampaignsPage from '../pages/MyCampaignsPage.jsx';
import MyDonationsPage from '../pages/MyDonationsPage.jsx';
import ProfilePage from '../pages/ProfilePage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';

function dashboardFor(role) {
  if (role === 'ADMIN') return '/app/admin';
  if (role === 'CREATOR') return '/app/creator';
  return '/app/donor';
}

function ProtectedRoute({ roles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={dashboardFor(user.role)} replace />;
  return children;
}

export default function AppRoutes() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={user ? <Navigate to={dashboardFor(user.role)} replace /> : <LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route path="/app" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to={user ? dashboardFor(user.role) : '/login'} replace />} />
          <Route path="donor" element={<ProtectedRoute roles={['DONOR']}><DonorDashboard /></ProtectedRoute>} />
          <Route path="creator" element={<ProtectedRoute roles={['CREATOR']}><CreatorDashboard /></ProtectedRoute>} />
          <Route path="admin" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="campaigns" element={<CampaignListingPage />} />
          <Route path="campaigns/:id" element={<CampaignDetailsPage />} />
          <Route path="my-campaigns" element={<ProtectedRoute roles={['CREATOR']}><MyCampaignsPage /></ProtectedRoute>} />
          <Route path="my-donations" element={<ProtectedRoute roles={['DONOR']}><MyDonationsPage /></ProtectedRoute>} />
          <Route path="users" element={<ProtectedRoute roles={['ADMIN']}><AdminUsersPage /></ProtectedRoute>} />
          <Route path="escrow" element={<EscrowWalletPage />} />
          <Route path="milestones" element={<ProtectedRoute roles={['CREATOR', 'ADMIN']}><MilestonesPage /></ProtectedRoute>} />
          <Route path="fraud" element={<ProtectedRoute roles={['ADMIN']}><FraudMonitoringPage /></ProtectedRoute>} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="complaints" element={<ComplaintsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
  );
}
