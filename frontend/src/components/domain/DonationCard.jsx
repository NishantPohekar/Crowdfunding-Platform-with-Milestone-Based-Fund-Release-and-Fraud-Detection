import { FiCheckCircle, FiClock } from 'react-icons/fi';
import GlassCard from '../common/GlassCard.jsx';
import { formatDate, money } from '../../utils/campaignUtils.js';

export default function DonationCard({ donation }) {
  const success = donation.paymentStatus === 'SUCCESS';
  return (
    <GlassCard className="donation-card" hover={false}>
      <div className={`donation-status ${success ? 'success' : 'warning'}`}>
        {success ? <FiCheckCircle /> : <FiClock />}
      </div>
      <div>
        <h3>{donation.campaignTitle}</h3>
        <p>{formatDate(donation.donatedAt)}</p>
      </div>
      <strong>INR {money(donation.amount)}</strong>
    </GlassCard>
  );
}
