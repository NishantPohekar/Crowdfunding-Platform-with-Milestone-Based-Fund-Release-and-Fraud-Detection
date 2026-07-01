import { useEffect, useMemo, useState } from 'react';
import { FiActivity, FiHeart, FiMessageSquare, FiSearch, FiTrendingUp } from 'react-icons/fi';
import PageTransition from '../../components/common/PageTransition.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import PaginationControls from '../../components/common/PaginationControls.jsx';
import DonationCard from '../../components/domain/DonationCard.jsx';
import NotificationCard from '../../components/domain/NotificationCard.jsx';
import { CategoryChart, TrendChart } from '../../components/charts/AnalyticsCharts.jsx';
import { dashboardService } from '../../services/dashboardService.js';
import { notificationService } from '../../services/notificationService.js';
import { chartDistributionToArray } from '../../utils/campaignUtils.js';
import { useToast } from '../../contexts/ToastContext.jsx';

const PAGE_SIZE = 10;

export default function DonorDashboard() {
  const [dashboard, setDashboard] = useState({ stats: {}, donations: [], charts: {} });
  const [notifications, setNotifications] = useState([]);
  const [donationSearch, setDonationSearch] = useState('');
  const [donationStatus, setDonationStatus] = useState('ALL');
  const [donationSort, setDonationSort] = useState('LATEST');
  const [donationPage, setDonationPage] = useState(0);
  const [notificationStatus, setNotificationStatus] = useState('UNREAD');
  const [notificationSort, setNotificationSort] = useState('LATEST');
  const [notificationPage, setNotificationPage] = useState(0);
  const [actionId, setActionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const { notify } = useToast();

  const loadDashboard = () => {
    setLoading(true);
    Promise.all([dashboardService.donor(), notificationService.list()])
      .then(([dashboardData, notificationData]) => {
        setDashboard(dashboardData);
        setNotifications(notificationData);
      })
      .catch((error) => notify(error.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
  }, [notify]);

  useEffect(() => {
    setDonationPage(0);
  }, [donationSearch, donationSort, donationStatus]);

  useEffect(() => {
    setNotificationPage(0);
  }, [notificationSort, notificationStatus]);

  const stats = dashboard.stats || {};
  const filteredDonations = useMemo(() => {
    const search = donationSearch.trim().toLowerCase();
    const visible = (dashboard.donations || []).filter((donation) => {
      const matchesSearch = !search || [
        donation.campaignTitle,
        donation.paymentStatus,
        donation.paymentMethod,
        String(donation.amount || '')
      ].some((value) => value?.toLowerCase().includes(search));
      const matchesStatus = donationStatus === 'ALL' || donation.paymentStatus === donationStatus;
      return matchesSearch && matchesStatus;
    });
    return [...visible].sort((a, b) => {
      const left = new Date(a.donatedAt || 0);
      const right = new Date(b.donatedAt || 0);
      if (donationSort === 'AMOUNT_HIGH') return Number(b.amount || 0) - Number(a.amount || 0);
      if (donationSort === 'AMOUNT_LOW') return Number(a.amount || 0) - Number(b.amount || 0);
      return donationSort === 'OLDEST' ? left - right : right - left;
    });
  }, [dashboard.donations, donationSearch, donationSort, donationStatus]);

  const pagedDonations = useMemo(() => {
    const start = donationPage * PAGE_SIZE;
    return filteredDonations.slice(start, start + PAGE_SIZE);
  }, [donationPage, filteredDonations]);

  const filteredNotifications = useMemo(() => {
    const visible = notificationStatus === 'ALL'
      ? notifications
      : notifications.filter((item) => item.status === notificationStatus);
    return [...visible].sort((a, b) => {
      const left = new Date(a.createdAt || 0);
      const right = new Date(b.createdAt || 0);
      return notificationSort === 'OLDEST' ? left - right : right - left;
    });
  }, [notificationSort, notificationStatus, notifications]);

  const pagedNotifications = useMemo(() => {
    const start = notificationPage * PAGE_SIZE;
    return filteredNotifications.slice(start, start + PAGE_SIZE);
  }, [filteredNotifications, notificationPage]);

  const markRead = async (item) => {
    setActionId(item.id);
    try {
      await notificationService.markRead(item.id);
      setNotifications((current) => current.map((notification) => (
        notification.id === item.id ? { ...notification, status: 'READ' } : notification
      )));
      notify('Notification marked as read', 'success');
      window.dispatchEvent(new Event('notifications-updated'));
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setActionId(null);
    }
  };

  return (
    <PageTransition>
      <section className="welcome-banner">
        <div>
          <p className="eyebrow">Donor Dashboard</p>
          <h2>Welcome back. Your capital is moving through verified milestones.</h2>
        </div>
      </section>
      <div className="stats-grid">
        <StatCard icon={FiHeart} label="Total Donations" value={stats.totalDonations || 0} prefix="INR " />
        <StatCard icon={FiTrendingUp} label="Campaigns Supported" value={stats.campaignsSupported || 0} tone="cyan" />
        <StatCard icon={FiActivity} label="Active Donations" value={stats.activeDonations || 0} tone="green" />
        <StatCard icon={FiMessageSquare} label="Grievances Raised" value={stats.complaintsRaised || 0} tone="amber" />
      </div>
      <div className="dashboard-grid two-col">
        <TrendChart title="Monthly Donation Trend" data={dashboard.charts?.trend} />
        <CategoryChart data={chartDistributionToArray(dashboard.charts?.statusDistribution)} />
      </div>
      <div className="dashboard-grid two-col">
        <section>
          <h2 className="block-title">My Donations</h2>
          <div className="filter-bar donor-hub-filter-bar">
            <label className="filter-search"><FiSearch /><input placeholder="Search my donations" value={donationSearch} onChange={(event) => setDonationSearch(event.target.value)} /></label>
            <select value={donationStatus} onChange={(event) => setDonationStatus(event.target.value)}>
              <option value="ALL">All Donations</option>
              <option value="SUCCESS">Successful</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
            <select value={donationSort} onChange={(event) => setDonationSort(event.target.value)}>
              <option value="LATEST">Latest First</option>
              <option value="OLDEST">Oldest First</option>
              <option value="AMOUNT_HIGH">Amount High-Low</option>
              <option value="AMOUNT_LOW">Amount Low-High</option>
            </select>
          </div>
          {!loading && <PaginationControls page={donationPage} pageSize={PAGE_SIZE} totalItems={filteredDonations.length} onPageChange={setDonationPage} />}
          <div className="stack-list">{pagedDonations.map((donation) => <DonationCard key={donation.id} donation={donation} />)}</div>
          {!loading && <PaginationControls page={donationPage} pageSize={PAGE_SIZE} totalItems={filteredDonations.length} onPageChange={setDonationPage} />}
          {!loading && filteredDonations.length === 0 && <p className="empty-state">No donations found.</p>}
        </section>
        <section>
          <h2 className="block-title">Notifications</h2>
          <div className="filter-bar donor-hub-filter-bar">
            <select value={notificationStatus} onChange={(event) => setNotificationStatus(event.target.value)}>
              <option value="UNREAD">Unread</option>
              <option value="ALL">All Notifications</option>
              <option value="READ">Read</option>
            </select>
            <select value={notificationSort} onChange={(event) => setNotificationSort(event.target.value)}>
              <option value="LATEST">Latest First</option>
              <option value="OLDEST">Oldest First</option>
            </select>
          </div>
          {!loading && <PaginationControls page={notificationPage} pageSize={PAGE_SIZE} totalItems={filteredNotifications.length} onPageChange={setNotificationPage} />}
          <div className="stack-list">{pagedNotifications.map((item) => (
            <NotificationCard
              key={item.id}
              notification={item}
              action={item.status === 'UNREAD' ? (
                <button className="btn btn-soft btn-small" type="button" disabled={actionId === item.id} onClick={() => markRead(item)}>Mark read</button>
              ) : <span className="action-state action-approved">Read</span>}
            />
          ))}</div>
          {!loading && <PaginationControls page={notificationPage} pageSize={PAGE_SIZE} totalItems={filteredNotifications.length} onPageChange={setNotificationPage} />}
          {!loading && filteredNotifications.length === 0 && <p className="empty-state">No notifications found.</p>}
        </section>
      </div>
    </PageTransition>
  );
}
