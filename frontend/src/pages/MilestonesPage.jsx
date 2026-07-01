import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCheckCircle, FiRefreshCw, FiSearch } from 'react-icons/fi';
import PageTransition from '../components/common/PageTransition.jsx';
import PaginationControls from '../components/common/PaginationControls.jsx';
import MilestoneCard from '../components/domain/MilestoneCard.jsx';
import { campaignService } from '../services/campaignService.js';
import { milestoneService } from '../services/milestoneService.js';
import { normalizeCampaign } from '../utils/campaignUtils.js';
import { useToast } from '../contexts/ToastContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

const PAGE_SIZE = 15;

export default function MilestonesPage() {
  const [milestones, setMilestones] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [sortBy, setSortBy] = useState('LATEST');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const { notify } = useToast();
  const { user } = useAuth();

  const loadMilestones = () => {
    setLoading(true);
    const request = user?.role === 'ADMIN' ? campaignService.list({ size: 1000 }) : campaignService.mine();
    request
      .then((data) => {
        const campaigns = Array.isArray(data) ? data : data.content || [];
        setMilestones(campaigns.map(normalizeCampaign).flatMap((campaign) => campaign.milestones.map((milestone) => ({
          ...milestone,
          campaignTitle: campaign.title,
          campaignCreatedAt: campaign.createdAt
        }))));
      })
      .catch((error) => notify(error.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMilestones();
  }, [user?.role]);

  useEffect(() => {
    setPage(0);
  }, [search, status, sortBy]);

  const filteredMilestones = useMemo(() => {
    const query = search.trim().toLowerCase();
    const visibleByStatus = status === 'ALL'
      ? milestones
      : milestones.filter((milestone) => milestone.status === status);
    const visible = !query ? visibleByStatus : visibleByStatus.filter((milestone) => [
      milestone.title,
      milestone.campaignTitle,
      milestone.description,
      milestone.status,
      milestone.proofNotes
    ].some((value) => value?.toLowerCase().includes(query)));
    const sorted = [...visible];
    if (sortBy === 'OLDEST') {
      return sorted.sort((a, b) => new Date(a.proofSubmittedAt || a.dueDate || a.campaignCreatedAt || 0) - new Date(b.proofSubmittedAt || b.dueDate || b.campaignCreatedAt || 0));
    }
    if (sortBy === 'TITLE') {
      return sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }
    return sorted.sort((a, b) => new Date(b.proofSubmittedAt || b.dueDate || b.campaignCreatedAt || 0) - new Date(a.proofSubmittedAt || a.dueDate || a.campaignCreatedAt || 0));
  }, [milestones, search, sortBy, status]);

  const pagedMilestones = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredMilestones.slice(start, start + PAGE_SIZE);
  }, [filteredMilestones, page]);

  const actOnMilestone = async (milestone, action) => {
    setActionId(`${action}-${milestone.id}`);
    try {
      if (action === 'verify') {
        await milestoneService.verify(milestone.id);
        notify('Milestone verified', 'success');
      } else if (action === 'undoVerify') {
        await milestoneService.undoVerify(milestone.id);
        notify('Milestone sent back for review', 'success');
      } else {
        await milestoneService.release(milestone.id);
        notify('Funds released', 'success');
      }
      loadMilestones();
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setActionId(null);
    }
  };

  return (
    <PageTransition>
      <div className="page-head">
        <div>
          <p className="eyebrow">Milestone Management</p>
          <h2>Timeline based proof, verification, and release control.</h2>
        </div>
      </div>
      <div className="filter-bar milestone-filter-bar">
        <label className="filter-search"><FiSearch /><input placeholder="Search milestones" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="ALL">All Milestones</option>
          <option value="PENDING">Pending</option>
          <option value="PROOF_SUBMITTED">Proof Submitted</option>
          <option value="VERIFIED">Verified</option>
          <option value="RELEASED">Released</option>
        </select>
        <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
          <option value="LATEST">Latest First</option>
          <option value="OLDEST">Oldest First</option>
          <option value="TITLE">Title A-Z</option>
        </select>
      </div>
      {!loading && <PaginationControls page={page} pageSize={PAGE_SIZE} totalItems={filteredMilestones.length} onPageChange={setPage} />}
      <div className="milestone-timeline">
        {pagedMilestones.map((milestone) => (
          <div className="milestone-row" key={milestone.id}>
            <MilestoneCard
              milestone={milestone}
              action={user?.role === 'CREATOR' && milestone.status === 'PENDING' ? (
                <Link className="btn btn-soft btn-small milestone-detail-toggle" to={`/app/campaigns/${milestone.campaignId}#proof-${milestone.id}`}>Submit Proof</Link>
              ) : null}
            />
            {user?.role === 'ADMIN' && ['PROOF_SUBMITTED', 'VERIFIED'].includes(milestone.status) && (
              <div className="table-actions milestone-actions">
                {milestone.status === 'PROOF_SUBMITTED' && (
                  <button className="btn btn-cfx btn-small" type="button" disabled={Boolean(actionId)} onClick={() => actOnMilestone(milestone, 'verify')}>
                    <FiCheckCircle /> Verify
                  </button>
                )}
                {milestone.status === 'VERIFIED' && (
                  <>
                    <button className="btn btn-soft btn-small" type="button" disabled={Boolean(actionId)} onClick={() => actOnMilestone(milestone, 'undoVerify')}>
                      <FiRefreshCw /> Redo Verification
                    </button>
                    <button className="btn btn-restart btn-small" type="button" disabled={Boolean(actionId)} onClick={() => actOnMilestone(milestone, 'release')}>
                      <FiRefreshCw /> Release
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {!loading && <PaginationControls page={page} pageSize={PAGE_SIZE} totalItems={filteredMilestones.length} onPageChange={setPage} />}
      {loading && <p className="empty-state">Loading milestones...</p>}
      {!loading && filteredMilestones.length === 0 && <p className="empty-state">No milestones available.</p>}
    </PageTransition>
  );
}
