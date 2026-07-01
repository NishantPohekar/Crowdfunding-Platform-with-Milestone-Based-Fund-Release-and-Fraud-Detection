import { useEffect, useMemo, useState } from 'react';
import { FiFilter, FiSearch } from 'react-icons/fi';
import PageTransition from '../../components/common/PageTransition.jsx';
import PaginationControls from '../../components/common/PaginationControls.jsx';
import CampaignCard from '../../components/domain/CampaignCard.jsx';
import { campaignService } from '../../services/campaignService.js';
import { normalizeCampaign, pageContent, sortCampaigns } from '../../utils/campaignUtils.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

const PAGE_SIZE = 15;

export default function CampaignListingPage() {
  const [status, setStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('LATEST');
  const [query, setQuery] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const { notify } = useToast();
  const { user } = useAuth();
  const isDonor = user?.role === 'DONOR';

  useEffect(() => {
    setLoading(true);
    const effectiveStatus = isDonor ? 'ACTIVE' : status;
    campaignService.list(effectiveStatus === 'ALL' ? { size: 1000 } : { status: effectiveStatus, size: 1000 })
      .then((data) => setCampaigns(sortCampaigns(pageContent(data).map(normalizeCampaign))))
      .catch((error) => notify(error.message, 'error'))
      .finally(() => setLoading(false));
  }, [isDonor, notify, status]);

  useEffect(() => {
    setPage(0);
  }, [query, sortBy, status]);

  const filtered = useMemo(() => {
    const visibleCampaigns = campaigns.filter((campaign) => {
      const text = `${campaign.title} ${campaign.creatorName} ${campaign.description || ''}`.toLowerCase();
      return text.includes(query.trim().toLowerCase());
    });
    return sortCampaigns(visibleCampaigns, sortBy);
  }, [campaigns, query, sortBy]);

  const pagedCampaigns = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  return (
    <PageTransition>
      <div className="page-head">
        <div>
          <p className="eyebrow">Campaign Module</p>
          <h2>Campaign Listing</h2>
        </div>
      </div>
      <div className="filter-bar">
        <FiFilter />
        <label className="filter-search"><FiSearch /><input placeholder="Search campaigns" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
        {isDonor ? (
          <span className="status-chip status-active">Approved Campaigns</span>
        ) : (
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
            <option value="DONE">Done</option>
          </select>
        )}
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="LATEST">Latest First</option>
          <option value="OLDEST">Oldest First</option>
          <option value="TITLE">Title A-Z</option>
        </select>
      </div>
      {!loading && (
        <PaginationControls page={page} pageSize={PAGE_SIZE} totalItems={filtered.length} onPageChange={setPage} />
      )}
      {loading ? <p className="empty-state">Loading campaigns...</p> : (
        <div className="campaign-grid">{pagedCampaigns.map((campaign, index) => <CampaignCard key={campaign.id} campaign={normalizeCampaign(campaign, page * PAGE_SIZE + index)} />)}</div>
      )}
      {!loading && (
        <PaginationControls page={page} pageSize={PAGE_SIZE} totalItems={filtered.length} onPageChange={setPage} />
      )}
      {!loading && filtered.length === 0 && <p className="empty-state">No campaigns found.</p>}
    </PageTransition>
  );
}
