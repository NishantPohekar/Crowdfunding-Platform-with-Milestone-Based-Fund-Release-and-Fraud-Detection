import { FiBell } from 'react-icons/fi';
import GlassCard from '../common/GlassCard.jsx';
import { formatDate } from '../../utils/campaignUtils.js';

export default function NotificationCard({ notification, action = null }) {
  return (
    <GlassCard className="notification-card" hover={false}>
      <div className="notification-icon"><FiBell /></div>
      <div>
        <div className="notification-head">
          <h3>{notification.status}</h3>
          <span>{formatDate(notification.createdAt)}</span>
        </div>
        <p>{notification.message}</p>
      </div>
      <div className="notification-actions">
        <span className={`read-dot ${notification.status === 'UNREAD' ? 'unread' : ''}`} />
        {action}
      </div>
    </GlassCard>
  );
}
