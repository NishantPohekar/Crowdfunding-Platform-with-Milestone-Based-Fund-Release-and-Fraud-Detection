import { Link } from 'react-router-dom';
import { FiAlertTriangle, FiShield } from 'react-icons/fi';
import GlassCard from '../common/GlassCard.jsx';

export default function FraudAlertCard({ alert }) {
  const className = alert.riskLevel.toLowerCase().replaceAll(' ', '-');
  const reasons = (alert.reason || 'No reason available').split(';').map((reason) => reason.trim()).filter(Boolean);
  return (
    <GlassCard className={`fraud-card ${className}`}>
      <div className="fraud-card-head">
        <FiAlertTriangle />
        <span>{alert.riskLevel}</span>
      </div>
      <h3>{alert.campaignTitle}</h3>
      <div className="risk-meter">
        <div style={{ width: `${alert.riskScore}%` }} />
      </div>
      <div className="fraud-score">
        <strong>{alert.riskScore}</strong>
        <span>Risk Score</span>
      </div>
      <div className="risk-reasons">
        {reasons.map((reason) => <span key={reason}>{reason}</span>)}
      </div>
      <Link className="btn btn-proof btn-small" to={`/app/campaigns/${alert.campaignId}`}>Open Campaign</Link>
      <span className="fraud-foot"><FiShield /> Created from backend risk checks</span>
    </GlassCard>
  );
}
