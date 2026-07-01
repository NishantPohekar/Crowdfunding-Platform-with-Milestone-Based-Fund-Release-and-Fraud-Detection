import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronDown, FiChevronRight, FiCreditCard, FiFlag, FiLayers, FiPlus, FiSearch, FiTrash2, FiTrendingUp } from 'react-icons/fi';
import PageTransition from '../../components/common/PageTransition.jsx';
import GlassCard from '../../components/common/GlassCard.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import PaginationControls from '../../components/common/PaginationControls.jsx';
import CampaignCard from '../../components/domain/CampaignCard.jsx';
import MilestoneCard from '../../components/domain/MilestoneCard.jsx';
import { CategoryChart, TrendChart } from '../../components/charts/AnalyticsCharts.jsx';
import { campaignService } from '../../services/campaignService.js';
import { chartDistributionToArray, normalizeCampaign } from '../../utils/campaignUtils.js';
import { dashboardService } from '../../services/dashboardService.js';
import { useToast } from '../../contexts/ToastContext.jsx';

const emptyForm = {
  title: '',
  targetAmount: '',
  imageUrl: '',
  verificationDocumentUrl: '',
  verificationNotes: '',
  description: ''
};
const emptyMilestone = { title: '', amount: '', dueDate: '', description: '' };
const today = new Date().toISOString().slice(0, 10);
const CAMPAIGN_PAGE_SIZE = 6;
const PROOF_PAGE_SIZE = 5;

export default function CreatorDashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [campaignSearch, setCampaignSearch] = useState('');
  const [campaignStatus, setCampaignStatus] = useState('ALL');
  const [campaignSort, setCampaignSort] = useState('LATEST');
  const [campaignPage, setCampaignPage] = useState(0);
  const [proofStatus, setProofStatus] = useState('PENDING');
  const [proofSort, setProofSort] = useState('LATEST');
  const [proofPage, setProofPage] = useState(0);
  const [campaignsOpen, setCampaignsOpen] = useState(false);
  const [proofsOpen, setProofsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [milestoneForms, setMilestoneForms] = useState([{ ...emptyMilestone }]);
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState({ charts: {} });
  const [submitting, setSubmitting] = useState(false);
  const { notify } = useToast();

  const loadCampaigns = () => {
    setLoading(true);
    Promise.all([campaignService.mine(), dashboardService.public()])
      .then(([campaignData, dashboardData]) => {
        setCampaigns(campaignData.map(normalizeCampaign));
        setDashboard(dashboardData);
      })
      .catch((error) => notify(error.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    setCampaignPage(0);
  }, [campaignSearch, campaignSort, campaignStatus]);

  useEffect(() => {
    setProofPage(0);
  }, [proofSort, proofStatus]);

  const stats = useMemo(() => {
    const fundsRaised = campaigns.reduce((total, campaign) => total + campaign.raisedAmount, 0);
    const pendingMilestones = campaigns.flatMap((campaign) => campaign.milestones).filter((milestone) => milestone.status !== 'RELEASED').length;
    const fundsReleased = campaigns.flatMap((campaign) => campaign.milestones)
      .filter((milestone) => milestone.status === 'RELEASED')
      .reduce((total, milestone) => total + Number(milestone.amount || 0), 0);
    return { fundsRaised, pendingMilestones, fundsReleased };
  }, [campaigns]);

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updateMilestoneForm = (index, field, value) => {
    setMilestoneForms((current) => current.map((milestone, position) => (
      position === index ? { ...milestone, [field]: value } : milestone
    )));
  };
  const addMilestoneForm = () => setMilestoneForms((current) => [...current, { ...emptyMilestone }]);
  const removeMilestoneForm = (index) => {
    setMilestoneForms((current) => current.length === 1 ? current : current.filter((_, position) => position !== index));
  };

  const sortByDateOrTitle = (items, sortBy, titleKey = 'title') => {
    const sorted = [...items];
    if (sortBy === 'OLDEST') {
      return sorted.sort((a, b) => new Date(a.proofSubmittedAt || a.dueDate || a.createdAt || a.campaignCreatedAt || 0) - new Date(b.proofSubmittedAt || b.dueDate || b.createdAt || b.campaignCreatedAt || 0));
    }
    if (sortBy === 'TITLE') {
      return sorted.sort((a, b) => (a[titleKey] || '').localeCompare(b[titleKey] || ''));
    }
    return sorted.sort((a, b) => new Date(b.proofSubmittedAt || b.dueDate || b.createdAt || b.campaignCreatedAt || 0) - new Date(a.proofSubmittedAt || a.dueDate || a.createdAt || a.campaignCreatedAt || 0));
  };

  const filteredCampaigns = useMemo(() => {
    const search = campaignSearch.trim().toLowerCase();
    const visible = campaigns.filter((campaign) => {
      const matchesSearch = !search || [
        campaign.title,
        campaign.description,
        campaign.status,
        campaign.pauseReason,
        campaign.rejectionReason
      ].some((value) => value?.toLowerCase().includes(search));
      const matchesStatus = campaignStatus === 'ALL' || campaign.status === campaignStatus;
      return matchesSearch && matchesStatus;
    });
    return sortByDateOrTitle(visible, campaignSort);
  }, [campaigns, campaignSearch, campaignSort, campaignStatus]);

  const pagedCampaigns = useMemo(() => {
    const start = campaignPage * CAMPAIGN_PAGE_SIZE;
    return filteredCampaigns.slice(start, start + CAMPAIGN_PAGE_SIZE);
  }, [campaignPage, filteredCampaigns]);

  const proofMilestones = useMemo(() => campaigns.flatMap((campaign) => campaign.milestones.map((milestone) => ({
    ...milestone,
    campaignTitle: campaign.title,
    campaignCreatedAt: campaign.createdAt
  }))), [campaigns]);

  const filteredProofMilestones = useMemo(() => {
    const visible = proofStatus === 'ALL' ? proofMilestones : proofMilestones.filter((milestone) => milestone.status === proofStatus);
    return sortByDateOrTitle(visible, proofSort);
  }, [proofMilestones, proofSort, proofStatus]);

  const pagedProofMilestones = useMemo(() => {
    const start = proofPage * PROOF_PAGE_SIZE;
    return filteredProofMilestones.slice(start, start + PROOF_PAGE_SIZE);
  }, [filteredProofMilestones, proofPage]);

  const submitCampaign = async (event) => {
    event.preventDefault();
    const targetAmount = Number(form.targetAmount);
    const milestones = milestoneForms.map((milestone, index) => ({
      title: milestone.title.trim() || `${form.title} milestone ${index + 1}`,
      description: milestone.description || form.description,
      amount: Number(milestone.amount),
      dueDate: milestone.dueDate || null
    }));
    const milestoneTotal = milestones.reduce((total, milestone) => total + milestone.amount, 0);

    if (!targetAmount || targetAmount < 1 || milestones.some((milestone) => !milestone.amount || milestone.amount < 1)) {
      notify('Enter valid target and milestone amounts', 'error');
      return;
    }
    if (milestoneTotal > targetAmount) {
      notify('Milestone amounts cannot exceed target amount', 'error');
      return;
    }
    if (milestones.some((milestone) => milestone.dueDate && milestone.dueDate < today)) {
      notify('Milestone due dates cannot be in the past', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await campaignService.create({
        title: form.title,
        description: form.description,
        imageUrl: form.imageUrl || null,
        verificationDocumentUrl: form.verificationDocumentUrl,
        verificationNotes: form.verificationNotes || null,
        targetAmount,
        milestones
      });
      setForm(emptyForm);
      setMilestoneForms([{ ...emptyMilestone }]);
      notify('Campaign submitted for admin approval', 'success');
      loadCampaigns();
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <section className="welcome-banner">
        <div>
          <p className="eyebrow">Creator Studio</p>
          <h2>Manage campaigns, proof uploads, and milestone based release readiness.</h2>
        </div>
        <a className="btn btn-cfx" href="#create-campaign" onClick={() => setCreateOpen(true)}><FiPlus /> Create Campaign</a>
      </section>
      <div className="stats-grid">
        <StatCard icon={FiLayers} label="Total Campaigns" value={campaigns.length} />
        <StatCard icon={FiTrendingUp} label="Funds Raised" value={stats.fundsRaised} prefix="INR " tone="cyan" />
        <StatCard icon={FiCreditCard} label="Funds Released" value={stats.fundsReleased} prefix="INR " tone="green" />
        <StatCard icon={FiFlag} label="Pending Milestones" value={stats.pendingMilestones} tone="amber" />
      </div>
      <div className="dashboard-grid two-col">
        <TrendChart title="Funding Progress" data={dashboard.charts?.trend} />
        <CategoryChart title="Campaign Status Distribution" data={chartDistributionToArray(dashboard.charts?.statusDistribution)} />
      </div>
      <section>
        <button className="section-dropdown" type="button" onClick={() => setCampaignsOpen(!campaignsOpen)}>
          <span>{campaignsOpen ? <FiChevronDown /> : <FiChevronRight />} My Campaigns</span>
          <strong>{filteredCampaigns.length}</strong>
        </button>
        {campaignsOpen && (
          <>
            <div className="filter-bar queue-filter-bar">
              <label className="filter-search"><FiSearch /><input placeholder="Search my campaigns" value={campaignSearch} onChange={(event) => setCampaignSearch(event.target.value)} /></label>
              <select value={campaignStatus} onChange={(event) => setCampaignStatus(event.target.value)}>
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="PENDING">Pending</option>
                <option value="REJECTED">Rejected</option>
                <option value="DONE">Done</option>
              </select>
              <select value={campaignSort} onChange={(event) => setCampaignSort(event.target.value)}>
                <option value="LATEST">Latest First</option>
                <option value="OLDEST">Oldest First</option>
                <option value="TITLE">Title A-Z</option>
              </select>
            </div>
            {!loading && <PaginationControls page={campaignPage} pageSize={CAMPAIGN_PAGE_SIZE} totalItems={filteredCampaigns.length} onPageChange={setCampaignPage} />}
            {loading ? <p className="empty-state">Loading your campaigns...</p> : (
              <div className="campaign-grid">{pagedCampaigns.map((campaign, index) => <CampaignCard key={campaign.id} campaign={normalizeCampaign(campaign, campaignPage * CAMPAIGN_PAGE_SIZE + index)} />)}</div>
            )}
            {!loading && <PaginationControls page={campaignPage} pageSize={CAMPAIGN_PAGE_SIZE} totalItems={filteredCampaigns.length} onPageChange={setCampaignPage} />}
            {!loading && filteredCampaigns.length === 0 && <p className="empty-state">No campaigns found. Create your first campaign below.</p>}
          </>
        )}
      </section>
      <section>
        <button className="section-dropdown" type="button" onClick={() => setProofsOpen(!proofsOpen)}>
          <span>{proofsOpen ? <FiChevronDown /> : <FiChevronRight />} Proof Uploads</span>
          <strong>{filteredProofMilestones.length}</strong>
        </button>
        {proofsOpen && (
          <>
            <div className="filter-bar queue-filter-bar">
              <select value={proofStatus} onChange={(event) => setProofStatus(event.target.value)}>
                <option value="ALL">All Milestones</option>
                <option value="PENDING">Pending Proof</option>
                <option value="PROOF_SUBMITTED">Proof Submitted</option>
                <option value="VERIFIED">Verified</option>
                <option value="RELEASED">Released</option>
              </select>
              <select value={proofSort} onChange={(event) => setProofSort(event.target.value)}>
                <option value="LATEST">Latest First</option>
                <option value="OLDEST">Oldest First</option>
                <option value="TITLE">Title A-Z</option>
              </select>
            </div>
            {!loading && <PaginationControls page={proofPage} pageSize={PROOF_PAGE_SIZE} totalItems={filteredProofMilestones.length} onPageChange={setProofPage} />}
            <div className="milestone-timeline">
              {pagedProofMilestones.map((milestone) => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  action={milestone.status === 'PENDING' ? (
                    <Link className="btn btn-soft btn-small milestone-detail-toggle" to={`/app/campaigns/${milestone.campaignId}#proof-${milestone.id}`}>Submit Proof</Link>
                  ) : null}
                />
              ))}
            </div>
            {!loading && <PaginationControls page={proofPage} pageSize={PROOF_PAGE_SIZE} totalItems={filteredProofMilestones.length} onPageChange={setProofPage} />}
            {!loading && filteredProofMilestones.length === 0 && <p className="empty-state">No proof milestones found.</p>}
          </>
        )}
      </section>
      <section id="create-campaign">
        <button className="section-dropdown" type="button" onClick={() => setCreateOpen(!createOpen)}>
          <span>{createOpen ? <FiChevronDown /> : <FiChevronRight />} Create Campaign</span>
          <strong>{milestoneForms.length} milestone{milestoneForms.length === 1 ? '' : 's'}</strong>
        </button>
        {createOpen && (
          <GlassCard className="form-panel" hover={false}>
            <form onSubmit={submitCampaign}>
              <div className="form-grid">
                <input required placeholder="Campaign title" value={form.title} onChange={(e) => updateForm('title', e.target.value)} />
                <input required type="number" min="1" placeholder="Target amount" value={form.targetAmount} onChange={(e) => updateForm('targetAmount', e.target.value)} />
                <input placeholder="Campaign image URL" value={form.imageUrl} onChange={(e) => updateForm('imageUrl', e.target.value)} />
                <input required placeholder="Official verification document cloud link" value={form.verificationDocumentUrl} onChange={(e) => updateForm('verificationDocumentUrl', e.target.value)} />
                <textarea required placeholder="Campaign description" value={form.description} onChange={(e) => updateForm('description', e.target.value)} />
                <textarea placeholder="Verification notes, budget breakdown, identity/organization details. Make sure the cloud document link is accessible to admin." value={form.verificationNotes} onChange={(e) => updateForm('verificationNotes', e.target.value)} />
              </div>
              <div className="milestone-builder">
                <div className="milestone-builder-head">
                  <div>
                    <h3>Milestone Plan</h3>
                    <p>Each milestone can receive funds only after proof is submitted, verified, and released by admin.</p>
                  </div>
                  <button className="btn btn-soft btn-small" type="button" onClick={addMilestoneForm}><FiPlus /> Add Milestone</button>
                </div>
                {milestoneForms.map((milestone, index) => (
                  <div className="milestone-form-card" key={index}>
                    <div className="milestone-form-title">
                      <strong>Milestone {index + 1}</strong>
                      {milestoneForms.length > 1 && (
                        <button className="btn btn-delete btn-small" type="button" onClick={() => removeMilestoneForm(index)}><FiTrash2 /> Remove</button>
                      )}
                    </div>
                    <div className="form-grid">
                      <input required placeholder={`Milestone ${index + 1} title`} value={milestone.title} onChange={(e) => updateMilestoneForm(index, 'title', e.target.value)} />
                      <input required type="number" min="1" placeholder={`Milestone ${index + 1} amount`} value={milestone.amount} onChange={(e) => updateMilestoneForm(index, 'amount', e.target.value)} />
                      <label className="date-field"><span>Milestone {index + 1} due date</span><input type="date" min={today} aria-label={`Milestone ${index + 1} due date`} title={`Milestone ${index + 1} due date`} value={milestone.dueDate} onChange={(e) => updateMilestoneForm(index, 'dueDate', e.target.value)} /></label>
                      <textarea placeholder={`Milestone ${index + 1} description or expected proof`} value={milestone.description} onChange={(e) => updateMilestoneForm(index, 'description', e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn btn-cfx" type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit for Approval'}</button>
            </form>
          </GlassCard>
        )}
      </section>
    </PageTransition>
  );
}
