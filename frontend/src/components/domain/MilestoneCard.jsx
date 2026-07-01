import { useState } from 'react';
import { FiCalendar, FiChevronDown, FiChevronUp, FiClock, FiExternalLink, FiFileText } from 'react-icons/fi';
import GlassCard from '../common/GlassCard.jsx';
import { formatDate, money } from '../../utils/campaignUtils.js';

export default function MilestoneCard({ milestone, action = null }) {
  const [expanded, setExpanded] = useState(false);
  const status = milestone.status?.toLowerCase().replaceAll(' ', '-').replaceAll('_', '-') || 'pending';
  const proofUrl = milestone.proofUrl?.trim();
  const proofHref = proofUrl && !/^https?:\/\//i.test(proofUrl) ? `https://${proofUrl}` : proofUrl;
  const releasedAmount = Number(milestone.releasedAmount || 0);

  return (
    <GlassCard className="milestone-card" hover={false}>
      <div className={`timeline-dot status-${status}`} />
      <div className="milestone-content">
        <div className="milestone-head">
          <div>
            <h3>{milestone.title}</h3>
            {milestone.campaignTitle && <p className="milestone-campaign">{milestone.campaignTitle}</p>}
          </div>
          <span className={`status-chip status-${status}`}>{milestone.status}</span>
        </div>
        <div className="milestone-grid">
          <span>Scheduled: INR {money(milestone.amount)}</span>
          <span>Released: INR {money(releasedAmount)}</span>
          <span><FiCalendar /> {milestone.dueDate || 'No due date'}</span>
          {proofHref ? (
            <a className="btn btn-proof btn-small" href={proofHref} target="_blank" rel="noreferrer">
              <FiExternalLink /> View Submitted Proof
            </a>
          ) : (
            <span><FiFileText /> No proof uploaded</span>
          )}
        </div>
        {milestone.proofNotes && <p className="proof-notes"><FiFileText /> {milestone.proofNotes}</p>}
        <div className="milestone-card-action">
          <button className="btn btn-soft btn-small milestone-detail-toggle" type="button" onClick={() => setExpanded(!expanded)}>
            {expanded ? <FiChevronUp /> : <FiChevronDown />} {expanded ? 'Hide Details' : 'View Details'}
          </button>
          {action}
        </div>
        {expanded && (
          <div className="milestone-detail-panel">
            <p><strong>Milestone amount:</strong> INR {money(milestone.amount)}</p>
            <p><strong>Proof submitted:</strong> {formatDate(milestone.proofSubmittedAt) || 'Not submitted'}</p>
            <p><strong>Released at:</strong> {formatDate(milestone.releasedAt) || 'Not released yet'}</p>
            <p><strong>Released by:</strong> {milestone.releasedByName || 'Not released yet'}</p>
            <p><FiClock /> Funds are released only after admin verification.</p>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
