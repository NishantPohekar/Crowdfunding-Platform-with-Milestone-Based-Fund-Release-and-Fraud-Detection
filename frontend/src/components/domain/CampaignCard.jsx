import { Link } from 'react-router-dom';
import { FiArrowUpRight, FiClock, FiShield } from 'react-icons/fi';
import GlassCard from '../common/GlassCard.jsx';
import { campaignActionReason, campaignImageFor, money } from '../../utils/campaignUtils.js';

export default function CampaignCard({ campaign }) {
  const progress = campaign.targetAmount > 0 ? Math.min(Math.round((campaign.raisedAmount / campaign.targetAmount) * 100), 100) : 0;
  const riskLabel = campaign.riskLevel?.replaceAll('_', ' ') || 'LOW';
  const riskClass = riskLabel.toLowerCase().replaceAll(' ', '-');
  const actionReason = campaignActionReason(campaign);

  return (
    <GlassCard className="campaign-card">
      <img src={campaign.image} alt={campaign.title} onError={(event) => { event.currentTarget.src = campaignImageFor(campaign); }} />
      <div className="campaign-card-body">
        <div className="campaign-meta">
          <span>{campaign.category}</span>
          <span className={`risk-badge ${riskClass}`}><FiShield /> {riskLabel}</span>
        </div>
        <span className={`status-chip status-${campaign.status?.toLowerCase()}`}>{campaign.status}</span>
        <h3>{campaign.title}</h3>
        <p>{campaign.creatorName}</p>
        {actionReason && (
          <details className={`reason-dropdown action-reason-card action-${actionReason.tone}`}>
            <summary>{actionReason.label}</summary>
            <p>{actionReason.value}</p>
          </details>
        )}
        <div className="progress cfx-progress" aria-label="Campaign funding progress">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <div className="campaign-numbers">
          <span>INR {money(campaign.raisedAmount)}</span>
          <span>{progress}%</span>
        </div>
        <div className="campaign-footer">
          <span><FiClock /> {campaign.daysLeft} days left</span>
          <Link to={`/app/campaigns/${campaign.id}`} className="link-action">View <FiArrowUpRight /></Link>
        </div>
      </div>
    </GlassCard>
  );
}
