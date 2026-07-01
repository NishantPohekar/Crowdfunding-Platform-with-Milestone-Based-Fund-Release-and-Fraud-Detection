import { useEffect, useMemo, useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import PageTransition from '../components/common/PageTransition.jsx';
import PaginationControls from '../components/common/PaginationControls.jsx';
import CampaignCard from '../components/domain/CampaignCard.jsx';
import { campaignService } from '../services/campaignService.js';
import { normalizeCampaign, sortCampaigns } from '../utils/campaignUtils.js';
import { useToast } from '../contexts/ToastContext.jsx';

const PAGE_SIZE = 15;

export default function MyCampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('LATEST');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const { notify } = useToast();

  useEffect(() => {
    campaignService.mine()
      .then((data) => setCampaigns(data.map(normalizeCampaign)))
      .catch((error) => notify(error.message, 'error'))
      .finally(() => setLoading(false));
  }, [notify]);

  useEffect(() => {
    setPage(0);
  }, [query, sortBy, status]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return campaigns.filter((campaign) => {
      const matchesSearch = !search || [
        campaign.title,
        campaign.description,
        campaign.status,
        campaign.creatorName,
        campaign.pauseReason,
        campaign.rejectionReason
      ].some((value) => value?.toLowerCase().includes(search));
      const matchesStatus = status === 'ALL' || campaign.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [campaigns, query, status]);
  const sorted = useMemo(() => sortCampaigns(filtered, sortBy), [filtered, sortBy]);
  const paged = useMemo(() => sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE), [page, sorted]);

  return (
    <PageTransition>
      <section className="page-head">
        <div>
          <p className="eyebrow">Creator Studio</p>
          <h2>My Campaigns</h2>
        </div>
      </section>
      <div className="filter-bar queue-filter-bar">
        <label className="filter-search"><FiSearch /><input placeholder="Search my campaigns" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
          <option value="PENDING">Pending</option>
          <option value="REJECTED">Rejected</option>
          <option value="DONE">Done</option>
        </select>
        <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
          <option value="LATEST">Latest First</option>
          <option value="OLDEST">Oldest First</option>
          <option value="TITLE">Title A-Z</option>
        </select>
      </div>
      {!loading && <PaginationControls page={page} pageSize={PAGE_SIZE} totalItems={sorted.length} onPageChange={setPage} />}
      {loading ? <p className="empty-state">Loading campaigns...</p> : <div className="campaign-grid">{paged.map((campaign, index) => <CampaignCard key={campaign.id} campaign={normalizeCampaign(campaign, page * PAGE_SIZE + index)} />)}</div>}
      {!loading && <PaginationControls page={page} pageSize={PAGE_SIZE} totalItems={sorted.length} onPageChange={setPage} />}
      {!loading && sorted.length === 0 && <p className="empty-state">No campaigns created yet.</p>}
    </PageTransition>
  );
}
