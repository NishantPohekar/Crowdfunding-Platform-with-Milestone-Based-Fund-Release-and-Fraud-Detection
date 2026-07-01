import { useEffect, useMemo, useState } from 'react';
import PageTransition from '../components/common/PageTransition.jsx';
import PaginationControls from '../components/common/PaginationControls.jsx';
import NotificationCard from '../components/domain/NotificationCard.jsx';
import { notificationService } from '../services/notificationService.js';
import { useToast } from '../contexts/ToastContext.jsx';

const PAGE_SIZE = 15;

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [status, setStatus] = useState('UNREAD');
  const [sortBy, setSortBy] = useState('LATEST');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [bulkReading, setBulkReading] = useState(false);
  const { notify } = useToast();

  const loadNotifications = () => {
    setLoading(true);
    notificationService.list()
      .then(setNotifications)
      .catch((error) => notify(error.message, 'error'))
      .finally(() => setLoading(false));
  };

  const filteredNotifications = useMemo(() => {
    const visible = status === 'ALL' ? notifications : notifications.filter((item) => item.status === status);
    return [...visible].sort((a, b) => {
      const left = new Date(a.createdAt || 0);
      const right = new Date(b.createdAt || 0);
      return sortBy === 'OLDEST' ? left - right : right - left;
    });
  }, [notifications, sortBy, status]);

  const pagedNotifications = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredNotifications.slice(start, start + PAGE_SIZE);
  }, [filteredNotifications, page]);

  useEffect(() => {
    setPage(0);
  }, [sortBy, status]);

  useEffect(() => {
    loadNotifications();
  }, [notify]);

  const markRead = async (notification) => {
    setActionId(notification.id);
    try {
      await notificationService.markRead(notification.id);
      notify('Notification marked as read', 'success');
      window.dispatchEvent(new Event('notifications-updated'));
      loadNotifications();
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setActionId(null);
    }
  };

  const markAllRead = async () => {
    setBulkReading(true);
    try {
      await notificationService.markAllRead();
      notify('All notifications marked as read', 'success');
      window.dispatchEvent(new Event('notifications-updated'));
      loadNotifications();
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setBulkReading(false);
    }
  };

  return (
    <PageTransition>
      <div className="page-head">
        <div>
          <p className="eyebrow">Notification Center</p>
          <h2>Real-time style activity across campaigns and funds.</h2>
        </div>
      </div>
      <div className="filter-bar notification-filter-bar">
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="ALL">All Notifications</option>
          <option value="UNREAD">Unread</option>
          <option value="READ">Read</option>
        </select>
        <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
          <option value="LATEST">Latest First</option>
          <option value="OLDEST">Oldest First</option>
        </select>
        <button className="btn btn-cfx btn-small" type="button" disabled={bulkReading || notifications.every((item) => item.status === 'READ')} onClick={markAllRead}>
          {bulkReading ? 'Marking...' : 'Read All'}
        </button>
      </div>
      {!loading && <PaginationControls page={page} pageSize={PAGE_SIZE} totalItems={filteredNotifications.length} onPageChange={setPage} />}
      <div className="stack-list">
        {pagedNotifications.map((item) => (
          <NotificationCard
            key={item.id}
            notification={item}
            action={item.status === 'UNREAD' ? (
              <button className="btn btn-soft btn-small" type="button" disabled={actionId === item.id} onClick={() => markRead(item)}>Mark read</button>
            ) : <span className="action-state action-approved">Read</span>}
          />
        ))}
      </div>
      {!loading && <PaginationControls page={page} pageSize={PAGE_SIZE} totalItems={filteredNotifications.length} onPageChange={setPage} />}
      {loading && <p className="empty-state">Loading notifications...</p>}
      {!loading && filteredNotifications.length === 0 && <p className="empty-state">No notifications yet.</p>}
    </PageTransition>
  );
}
