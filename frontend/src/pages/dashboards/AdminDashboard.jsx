import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiAlertTriangle, FiArchive, FiCheckCircle, FiClock, FiFlag, FiLayers, FiMessageCircle, FiRefreshCw, FiSearch, FiTrash2, FiTrendingUp, FiUsers, FiXCircle } from 'react-icons/fi';
import PageTransition from '../../components/common/PageTransition.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import PaginationControls from '../../components/common/PaginationControls.jsx';
import ConfirmationDialog from '../../components/common/ConfirmationDialog.jsx';
import ReasonDialog from '../../components/common/ReasonDialog.jsx';
import FraudAlertCard from '../../components/domain/FraudAlertCard.jsx';
import { RiskBarChart, TrendChart } from '../../components/charts/AnalyticsCharts.jsx';
import { campaignService } from '../../services/campaignService.js';
import { adminService } from '../../services/adminService.js';
import { dashboardService } from '../../services/dashboardService.js';
import { campaignActionReason, normalizeCampaign, pageContent, money, sortCampaigns } from '../../utils/campaignUtils.js';
import { useToast } from '../../contexts/ToastContext.jsx';

const PAGE_SIZE = 10;

export default function AdminDashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [dashboard, setDashboard] = useState({ stats: {}, charts: {}, riskCounts: {} });
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [queueStatus, setQueueStatus] = useState('ALL');
  const [queueSort, setQueueSort] = useState('LATEST');
  const [queueSearch, setQueueSearch] = useState('');
  const [queuePage, setQueuePage] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [reasonTarget, setReasonTarget] = useState(null);
  const { notify } = useToast();

  const loadCampaigns = () => {
    setLoading(true);
    Promise.all([campaignService.list({ size: 1000 }), dashboardService.admin(), adminService.fraudAlerts()])
      .then(([campaignData, dashboardData, alertData]) => {
        setCampaigns(sortCampaigns(pageContent(campaignData).map(normalizeCampaign)));
        setDashboard(dashboardData);
        setFraudAlerts(alertData);
      })
      .catch((error) => notify(error.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    setQueuePage(0);
  }, [queueSearch, queueSort, queueStatus]);

  const derivedStats = useMemo(() => ({
    totalCampaigns: campaigns.length,
    pendingCampaigns: campaigns.filter((campaign) => campaign.status === 'PENDING').length,
    approvedCampaigns: campaigns.filter((campaign) => campaign.status === 'ACTIVE').length,
    fundsRaised: campaigns.reduce((total, campaign) => total + campaign.raisedAmount, 0)
  }), [campaigns]);
  const dashboardStats = { ...derivedStats, ...(dashboard.stats || {}) };
  const riskData = [
    { name: 'Medium', risk: dashboard.riskCounts?.medium || 0 },
    { name: 'High', risk: dashboard.riskCounts?.high || 0 }
  ];

  const actOnCampaign = async (campaign, action, reason = '') => {
    setActionId(`${action}-${campaign.id}`);
    try {
      if (action === 'approve') {
        await campaignService.approve(campaign.id);
        notify('Campaign approved', 'success');
      } else if (action === 'reject') {
        await campaignService.reject(campaign.id, { reason });
        notify('Campaign rejected', 'success');
      } else if (action === 'archive') {
        await campaignService.archive(campaign.id, { reason });
        notify('Campaign paused', 'success');
      } else if (action === 'restart') {
        await campaignService.restart(campaign.id);
        notify('Campaign restarted', 'success');
      } else {
        await campaignService.delete(campaign.id);
        notify('Campaign deleted', 'success');
      }
      loadCampaigns();
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setActionId(null);
    }
  };

  const actionSummary = (row) => {
    if (row.status === 'ACTIVE') return <span className="action-state action-approved"><FiCheckCircle /> Approved</span>;
    if (row.status === 'REJECTED') return <span className="action-state action-rejected"><FiXCircle /> Rejected</span>;
    if (row.status === 'DONE') return <span className="action-state action-approved"><FiCheckCircle /> Completed</span>;
    if (row.status === 'PAUSED') return <span className="action-state action-paused"><FiAlertTriangle /> Paused</span>;
    return <span className="action-state">Waiting</span>;
  };

  const queueCampaigns = useMemo(() => {
    const search = queueSearch.trim().toLowerCase();
    const byStatus = queueStatus === 'ALL'
      ? campaigns
      : campaigns.filter((campaign) => campaign.status === queueStatus);
    const filtered = byStatus.filter((campaign) => !search || [
      campaign.title,
      campaign.creatorName,
      campaign.status,
      campaign.rejectionReason,
      campaign.pauseReason
    ].some((value) => value?.toLowerCase().includes(search)));
    return sortCampaigns(filtered, queueSort);
  }, [campaigns, queueSearch, queueSort, queueStatus]);

  const pagedQueueCampaigns = useMemo(() => {
    const start = queuePage * PAGE_SIZE;
    return queueCampaigns.slice(start, start + PAGE_SIZE);
  }, [queueCampaigns, queuePage]);

  const columns = [
    {
      key: 'title',
      label: 'Campaign',
      render: (row) => <Link className="table-link" to={`/app/campaigns/${row.id}`}>{row.title}</Link>
    },
    { key: 'creatorName', label: 'Creator' },
    { key: 'status', label: 'Status', render: (row) => {
      const actionReason = campaignActionReason(row);
      return (
        <div className="status-with-reason">
          <span className={`status-chip status-${row.status.toLowerCase()}`}>{row.status}</span>
          {actionReason && (
            <details className={`reason-dropdown queue-reason-dropdown action-${actionReason.tone}`}>
              <summary>{actionReason.label}</summary>
              <p>{actionReason.value}</p>
            </details>
          )}
        </div>
      );
    } },
    { key: 'raisedAmount', label: 'Raised', render: (row) => `INR ${money(row.raisedAmount)}` },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => row.status === 'PENDING' ? (
        <div className="table-actions action-buttons">
          <button className="btn btn-approve btn-small" type="button" disabled={Boolean(actionId)} onClick={() => actOnCampaign(row, 'approve')}><FiCheckCircle /> Approve</button>
          <button className="btn btn-outline-danger btn-small" type="button" disabled={Boolean(actionId)} onClick={() => setReasonTarget({ campaign: row, action: 'reject' })}><FiXCircle /> Reject</button>
          <button className="btn btn-delete btn-small" type="button" disabled={Boolean(actionId)} onClick={() => setDeleteTarget(row)}><FiTrash2 /> Delete</button>
        </div>
      ) : (
        <div className="table-actions action-buttons">
          {actionSummary(row)}
          {row.status === 'REJECTED' && <button className="btn btn-approve btn-small" type="button" disabled={Boolean(actionId)} onClick={() => actOnCampaign(row, 'approve')}><FiCheckCircle /> Approve Again</button>}
          {['ACTIVE', 'PAUSED'].includes(row.status) && <button className="btn btn-outline-danger btn-small" type="button" disabled={Boolean(actionId)} onClick={() => setReasonTarget({ campaign: row, action: 'reject' })}><FiXCircle /> Reject</button>}
          {row.status === 'ACTIVE' && <button className="btn btn-archive btn-small" type="button" disabled={Boolean(actionId)} onClick={() => setReasonTarget({ campaign: row, action: 'archive' })}><FiArchive /> Pause</button>}
          {row.status === 'PAUSED' && <button className="btn btn-restart btn-small" type="button" disabled={Boolean(actionId)} onClick={() => actOnCampaign(row, 'restart')}><FiRefreshCw /> Restart</button>}
          {row.status === 'REJECTED' && <button className="btn btn-delete btn-small" type="button" disabled={Boolean(actionId)} onClick={() => setDeleteTarget(row)}><FiTrash2 /> Delete</button>}
        </div>
      )
    }
  ];

  return (
    <PageTransition>
      <section className="welcome-banner">
        <div>
          <p className="eyebrow">Admin Command</p>
          <h2>Approval, risk, grievances, and fund release control center.</h2>
        </div>
      </section>
      <div className="stats-grid admin-stats">
        <StatCard icon={FiUsers} label="Total Users" value={dashboardStats.totalUsers || 0} />
        <StatCard icon={FiLayers} label="Total Campaigns" value={dashboardStats.totalCampaigns} tone="cyan" />
        <StatCard icon={FiClock} label="Pending Campaigns" value={dashboardStats.pendingCampaigns} tone="amber" />
        <StatCard icon={FiCheckCircle} label="Approved Campaigns" value={dashboardStats.approvedCampaigns} tone="green" />
        <StatCard icon={FiTrendingUp} label="Total Donations" value={dashboardStats.totalDonations || 0} />
        <StatCard icon={FiFlag} label="Funds Raised" value={dashboardStats.fundsRaised} prefix="INR " tone="cyan" />
        <StatCard icon={FiAlertTriangle} label="Fraud Alerts" value={dashboardStats.fraudAlerts || 0} tone="danger" />
        <StatCard icon={FiMessageCircle} label="Open Grievances" value={dashboardStats.openComplaints || 0} tone="amber" />
      </div>
      <div className="dashboard-grid two-col">
        <TrendChart title="Campaign Growth" dataKey="campaigns" data={dashboard.charts?.trend} />
        <RiskBarChart title="Fraud Statistics" data={riskData} />
      </div>
      <section>
        <h2 className="block-title">Campaign Approval Queue</h2>
        <div className="filter-bar queue-filter-bar">
          <label className="filter-search"><FiSearch /><input placeholder="Search campaigns, creators, reasons" value={queueSearch} onChange={(event) => setQueueSearch(event.target.value)} /></label>
          <select value={queueStatus} onChange={(event) => setQueueStatus(event.target.value)}>
            <option value="ALL">All Campaigns</option>
            <option value="PENDING">Pending Approval</option>
            <option value="ACTIVE">Approved</option>
            <option value="PAUSED">Paused</option>
            <option value="REJECTED">Rejected</option>
            <option value="DONE">Completed</option>
          </select>
          <select value={queueSort} onChange={(event) => setQueueSort(event.target.value)}>
            <option value="LATEST">Latest First</option>
            <option value="OLDEST">Oldest First</option>
            <option value="TITLE">Title A-Z</option>
          </select>
        </div>
        {!loading && (
          <PaginationControls page={queuePage} pageSize={PAGE_SIZE} totalItems={queueCampaigns.length} onPageChange={setQueuePage} />
        )}
        <DataTable columns={columns} rows={pagedQueueCampaigns} loading={loading} emptyMessage="No campaigns match the current filters." />
        {!loading && (
          <PaginationControls page={queuePage} pageSize={PAGE_SIZE} totalItems={queueCampaigns.length} onPageChange={setQueuePage} />
        )}
      </section>
      <section>
        <h2 className="block-title">Fraud Monitoring</h2>
        <div className="fraud-grid">{fraudAlerts.map((alert) => <FraudAlertCard key={alert.id} alert={alert} />)}</div>
        {!loading && fraudAlerts.length === 0 && <p className="empty-state">No medium or high risk alerts.</p>}
      </section>
      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title="Delete Campaign"
        message={`Delete ${deleteTarget?.title}? This only works when there is no donation history.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          const target = deleteTarget;
          setDeleteTarget(null);
          if (target) actOnCampaign(target, 'delete');
        }}
      />
      <ReasonDialog
        open={Boolean(reasonTarget)}
        title={reasonTarget?.action === 'reject' ? 'Reject Campaign' : 'Pause Campaign'}
        message={`${reasonTarget?.action === 'reject' ? 'Reject' : 'Pause'} ${reasonTarget?.campaign?.title}? Add a clear reason for the creator.`}
        reasonLabel={reasonTarget?.action === 'reject' ? 'Reason for rejection' : 'Reason for pause'}
        onCancel={() => setReasonTarget(null)}
        onConfirm={(reason) => {
          const target = reasonTarget;
          setReasonTarget(null);
          if (target) actOnCampaign(target.campaign, target.action, reason);
        }}
      />
    </PageTransition>
  );
}
