import { useEffect, useMemo, useState } from 'react';
import { FiCheckCircle, FiMessageSquare, FiSearch } from 'react-icons/fi';
import PageTransition from '../components/common/PageTransition.jsx';
import GlassCard from '../components/common/GlassCard.jsx';
import DataTable from '../components/common/DataTable.jsx';
import PaginationControls from '../components/common/PaginationControls.jsx';
import { complaintService } from '../services/complaintService.js';
import { campaignService } from '../services/campaignService.js';
import { useToast } from '../contexts/ToastContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { pageContent } from '../utils/campaignUtils.js';

const PAGE_SIZE = 5;

export default function ComplaintsPage() {
  const [rows, setRows] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignSearch, setCampaignSearch] = useState('');
  const [campaignPickerOpen, setCampaignPickerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('OPEN');
  const [sortBy, setSortBy] = useState('LATEST');
  const [page, setPage] = useState(0);
  const [form, setForm] = useState({ campaignId: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState(null);
  const { notify } = useToast();
  const { user } = useAuth();

  const loadComplaints = () => {
    setLoading(true);
    const request = user?.role === 'ADMIN' ? complaintService.list() : complaintService.mine();
    request
      .then(setRows)
      .catch((error) => {
        setRows([]);
        notify(error.message, 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadComplaints();
  }, [user?.role]);

  useEffect(() => {
    if (user?.role === 'ADMIN') return;
    campaignService.list({ size: 1000 })
      .then((data) => setCampaigns(pageContent(data).filter((campaign) => ['ACTIVE', 'PAUSED', 'DONE'].includes(campaign.status))))
      .catch((error) => notify(error.message, 'error'));
  }, [notify, user?.role]);

  const filteredCampaigns = useMemo(() => {
    const query = campaignSearch.trim().toLowerCase();
    if (!query) return campaigns;
    return campaigns.filter((campaign) => [
      campaign.title,
      campaign.creatorName,
      campaign.description,
      campaign.status
    ].some((value) => value?.toLowerCase().includes(query)));
  }, [campaignSearch, campaigns]);

  useEffect(() => {
    setPage(0);
  }, [query, sortBy, status]);

  const filteredRows = useMemo(() => {
    const search = query.trim().toLowerCase();
    const visible = rows.filter((row) => {
      const matchesSearch = !search || [
        row.campaignTitle,
        row.userName,
        row.userEmail,
        row.description,
        row.status
      ].some((value) => value?.toLowerCase().includes(search));
      const matchesStatus = status === 'ALL' || row.status === status;
      return matchesSearch && matchesStatus;
    });
    return [...visible].sort((a, b) => {
      const left = new Date(a.createdAt || 0);
      const right = new Date(b.createdAt || 0);
      if (sortBy === 'CAMPAIGN') return (a.campaignTitle || '').localeCompare(b.campaignTitle || '');
      return sortBy === 'OLDEST' ? left - right : right - left;
    });
  }, [query, rows, sortBy, status]);

  const pagedRows = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, page]);

  const submitComplaint = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await complaintService.create(form);
      setForm({ campaignId: '', description: '' });
      setCampaignSearch('');
      setCampaignPickerOpen(false);
      notify('Grievance submitted', 'success');
      loadComplaints();
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resolveComplaint = async (row) => {
    setActionId(row.id);
    try {
      await complaintService.resolve(row.id);
      notify('Grievance resolved', 'success');
      loadComplaints();
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setActionId(null);
    }
  };

  const columns = [
    { key: 'campaignTitle', label: 'Campaign' },
    { key: 'userName', label: 'User', render: (row) => (
      <div className="table-user">
        <strong>{row.userName || 'User'}</strong>
        <span>{row.userEmail || row.userId}</span>
      </div>
    ) },
    { key: 'description', label: 'Grievance', render: (row) => (
      <details className="complaint-details-dropdown">
        <summary>View grievance</summary>
        <p>{row.description || 'No description provided.'}</p>
      </details>
    ) },
    { key: 'status', label: 'Status', render: (row) => <span className={`status-chip ${row.status === 'OPEN' ? 'status-pending' : 'status-verified'}`}>{row.status}</span> },
    ...(user?.role === 'ADMIN' ? [{
      key: 'actions',
      label: 'Actions',
      render: (row) => row.status === 'OPEN' ? (
        <button className="btn btn-approve btn-small" type="button" disabled={actionId === row.id} onClick={() => resolveComplaint(row)}>
          <FiCheckCircle /> Resolve
        </button>
      ) : <span className="action-state action-approved"><FiCheckCircle /> Resolved</span>
    }] : [])
  ];

  return (
    <PageTransition>
      <div className="page-head">
        <div>
          <p className="eyebrow">Grievance Management</p>
          <h2>Review donor trust concerns and admin resolutions.</h2>
        </div>
      </div>
      {user?.role !== 'ADMIN' && <GlassCard className="form-panel" hover={false}>
        <h2><FiMessageSquare /> Raise Grievance</h2>
        <form onSubmit={submitComplaint}>
          <div className="form-grid">
            <label className="filter-search complaint-campaign-search">
              <FiSearch />
              <input
                placeholder="Search campaign"
                value={campaignSearch}
                onFocus={() => setCampaignPickerOpen(Boolean(campaignSearch.trim()))}
                onChange={(e) => {
                  setCampaignSearch(e.target.value);
                  setCampaignPickerOpen(Boolean(e.target.value.trim()));
                }}
              />
            </label>
            <select
              required
              className={`cfx-select ${campaignPickerOpen ? 'select-expanded' : ''}`}
              value={form.campaignId}
              size={campaignPickerOpen ? Math.min(Math.max(filteredCampaigns.length + 1, 2), 6) : 1}
              onBlur={() => setCampaignPickerOpen(false)}
              onChange={(e) => {
                setForm({ ...form, campaignId: e.target.value });
                setCampaignSearch('');
                setCampaignPickerOpen(false);
              }}
            >
              <option value="">Select campaign</option>
              {filteredCampaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.title}</option>)}
            </select>
            <textarea required placeholder="Describe the issue" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <button className="btn btn-cfx" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Grievance'}</button>
        </form>
      </GlassCard>}
      <div className="filter-bar complaint-filter-bar">
        <label className="filter-search"><FiSearch /><input placeholder="Search grievances" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="ALL">All Status</option>
          <option value="OPEN">Open</option>
          <option value="RESOLVED">Resolved</option>
        </select>
        <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
          <option value="LATEST">Latest First</option>
          <option value="OLDEST">Oldest First</option>
          <option value="CAMPAIGN">Campaign A-Z</option>
        </select>
      </div>
      {!loading && <PaginationControls page={page} pageSize={PAGE_SIZE} totalItems={filteredRows.length} onPageChange={setPage} />}
      <DataTable columns={columns} rows={loading ? [] : pagedRows} loading={loading} emptyMessage="No grievances match the current filters." />
      {!loading && <PaginationControls page={page} pageSize={PAGE_SIZE} totalItems={filteredRows.length} onPageChange={setPage} />}
    </PageTransition>
  );
}
