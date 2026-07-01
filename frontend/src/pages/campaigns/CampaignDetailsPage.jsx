import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FiArchive, FiCheckCircle, FiExternalLink, FiFileText, FiRefreshCw, FiTrash2, FiUploadCloud, FiXCircle } from 'react-icons/fi';
import PageTransition from '../../components/common/PageTransition.jsx';
import GlassCard from '../../components/common/GlassCard.jsx';
import ConfirmationDialog from '../../components/common/ConfirmationDialog.jsx';
import ReasonDialog from '../../components/common/ReasonDialog.jsx';
import MilestoneCard from '../../components/domain/MilestoneCard.jsx';
import { campaignService } from '../../services/campaignService.js';
import { donationService } from '../../services/donationService.js';
import { milestoneService } from '../../services/milestoneService.js';
import { campaignActionReason, campaignImageFor, normalizeCampaign, money } from '../../utils/campaignUtils.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function CampaignDetailsPage() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [donation, setDonation] = useState({ amount: '', paymentMethod: 'UPI' });
  const [proofForms, setProofForms] = useState({});
  const [donating, setDonating] = useState(false);
  const [adminAction, setAdminAction] = useState(null);
  const [milestoneAction, setMilestoneAction] = useState(null);
  const [proofAction, setProofAction] = useState(null);
  const [openProofForms, setOpenProofForms] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reasonAction, setReasonAction] = useState(null);
  const { notify } = useToast();
  const { user } = useAuth();

  const loadCampaign = () => {
    setLoading(true);
    campaignService.get(id)
      .then((data) => setCampaign(normalizeCampaign(data)))
      .catch((error) => notify(error.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCampaign();
  }, [id, notify]);

  useEffect(() => {
    if (!campaign || !window.location.hash) return;
    if (window.location.hash.startsWith('#proof-')) {
      const milestoneId = window.location.hash.replace('#proof-', '');
      setOpenProofForms((current) => ({ ...current, [milestoneId]: true }));
    }
    const target = document.querySelector(window.location.hash);
    if (!target) return;
    window.setTimeout(() => document.querySelector(window.location.hash)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
  }, [campaign]);

  const submitDonation = async (event) => {
    event.preventDefault();
    const amount = Number(donation.amount);
    if (!amount || amount < 1) {
      notify('Enter a valid donation amount', 'error');
      return;
    }
    setDonating(true);
    try {
      await donationService.donate({ campaignId: id, amount, paymentMethod: donation.paymentMethod });
      setDonation({ amount: '', paymentMethod: 'UPI' });
      notify('Donation completed', 'success');
      loadCampaign();
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setDonating(false);
    }
  };

  const actOnCampaign = async (action, reason = '') => {
    setAdminAction(action);
    try {
      if (action === 'delete') {
        await campaignService.delete(campaign.id);
        notify('Campaign deleted', 'success');
        window.history.back();
        return;
      }
      const updatedCampaign = action === 'reject'
        ? await campaignService.reject(campaign.id, { reason })
        : action === 'archive'
          ? await campaignService.archive(campaign.id, { reason })
          : action === 'restart'
            ? await campaignService.restart(campaign.id)
          : await campaignService.approve(campaign.id);
      setCampaign(normalizeCampaign(updatedCampaign));
      notify(action === 'reject' ? 'Campaign rejected' : action === 'archive' ? 'Campaign paused' : action === 'restart' ? 'Campaign restarted' : 'Campaign resolved and approved', 'success');
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setAdminAction(null);
    }
  };

  const actOnMilestone = async (milestone, action) => {
    setMilestoneAction(`${action}-${milestone.id}`);
    try {
      if (action === 'verify') {
        await milestoneService.verify(milestone.id);
        notify('Milestone verified', 'success');
      } else if (action === 'undoVerify') {
        await milestoneService.undoVerify(milestone.id);
        notify('Milestone sent back for review', 'success');
      } else {
        await milestoneService.release(milestone.id);
        notify('Funds released to creator', 'success');
      }
      loadCampaign();
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setMilestoneAction(null);
    }
  };

  const updateProofForm = (milestoneId, patch) => {
    setProofForms((current) => ({
      ...current,
      [milestoneId]: { proofUrl: '', notes: '', ...(current[milestoneId] || {}), ...patch }
    }));
  };
  const toggleProofForm = (milestoneId) => {
    setOpenProofForms((current) => ({ ...current, [milestoneId]: !current[milestoneId] }));
  };

  const submitProof = async (event, milestone) => {
    event.preventDefault();
    const values = proofForms[milestone.id] || {};
    if (!values.proofUrl?.trim()) {
      notify('Add proof document URL', 'error');
      return;
    }
    setProofAction(milestone.id);
    try {
      await milestoneService.uploadProof(milestone.id, { proofUrl: values.proofUrl, notes: values.notes || '' });
      setProofForms((current) => ({ ...current, [milestone.id]: { proofUrl: '', notes: '' } }));
      notify('Proof submitted for admin verification', 'success');
      loadCampaign();
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setProofAction(null);
    }
  };

  if (loading) {
    return <PageTransition><p className="empty-state">Loading campaign...</p></PageTransition>;
  }

  if (!campaign) {
    return <PageTransition><p className="empty-state">Campaign not found.</p></PageTransition>;
  }

  const progress = campaign.targetAmount > 0 ? Math.round((campaign.raisedAmount / campaign.targetAmount) * 100) : 0;
  const canViewVerification = user?.role === 'ADMIN' || user?.userId === campaign.creatorId;
  const canDeleteCampaign = (user?.role === 'ADMIN' || user?.userId === campaign.creatorId) && ['PENDING', 'REJECTED'].includes(campaign.status);
  const actionReason = campaignActionReason(campaign);
  const milestoneSummary = campaign.milestones.reduce((summary, milestone) => {
    const statusKey = milestone.status || 'PENDING';
    const hasSubmittedProof = Boolean(milestone.proofSubmittedAt || milestone.proofUrl || ['PROOF_SUBMITTED', 'VERIFIED', 'RELEASED'].includes(statusKey));
    const hasVerifiedProof = ['VERIFIED', 'RELEASED'].includes(statusKey);
    return {
      ...summary,
      total: summary.total + 1,
      pending: statusKey === 'PENDING' ? summary.pending + 1 : summary.pending,
      proofSubmitted: hasSubmittedProof ? summary.proofSubmitted + 1 : summary.proofSubmitted,
      verified: hasVerifiedProof ? summary.verified + 1 : summary.verified,
      released: statusKey === 'RELEASED' ? summary.released + 1 : summary.released,
      releasedAmount: statusKey === 'RELEASED' ? summary.releasedAmount + Number(milestone.releasedAmount || milestone.amount || 0) : summary.releasedAmount
    };
  }, { total: 0, pending: 0, proofSubmitted: 0, verified: 0, released: 0, releasedAmount: 0 });

  return (
    <PageTransition>
      <section className="details-hero">
        <img src={campaign.image} alt={campaign.title} onError={(event) => { event.currentTarget.src = campaignImageFor(campaign); }} />
        <div>
          <p className="eyebrow">{campaign.category}</p>
          <h2>{campaign.title}</h2>
          <p>{campaign.description}</p>
          {canViewVerification && <div className="verification-panel">
            <div>
              <strong><FiFileText /> Campaign verification</strong>
              <p>{campaign.verificationNotes || 'Creator submitted an official document for admin review.'}</p>
            </div>
            {campaign.verificationDocumentUrl ? (
              <a className="btn btn-soft btn-small" href={campaign.verificationDocumentUrl} target="_blank" rel="noreferrer">
                <FiExternalLink /> View Document
              </a>
            ) : (
              <span className="status-chip status-rejected">Document missing</span>
            )}
          </div>}
          <div className="progress cfx-progress"><div className="progress-bar" style={{ width: `${progress}%` }} /></div>
          <strong>INR {money(campaign.raisedAmount)} raised of INR {money(campaign.targetAmount)}</strong>
          <span className={`status-chip status-${campaign.status.toLowerCase()}`}>{campaign.status}</span>
          {actionReason && (
            <details className={`reason-dropdown action-reason-panel action-${actionReason.tone}`} open={campaign.status === 'PAUSED'}>
              <summary>{actionReason.label}</summary>
              <p>{actionReason.value}</p>
            </details>
          )}
          {user?.role === 'ADMIN' && ['PENDING', 'REJECTED'].includes(campaign.status) && (
            <div className="detail-actions">
              <button className="btn btn-approve" type="button" disabled={Boolean(adminAction)} onClick={() => actOnCampaign('approve')}>
                <FiCheckCircle /> {adminAction === 'approve' ? 'Resolving...' : 'Resolve / Approve'}
              </button>
            </div>
          )}
          {user?.role === 'ADMIN' && ['PENDING', 'ACTIVE', 'PAUSED'].includes(campaign.status) && (
            <div className="detail-actions">
              <button className="btn btn-outline-danger" type="button" disabled={Boolean(adminAction)} onClick={() => setReasonAction('reject')}>
                <FiXCircle /> {adminAction === 'reject' ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          )}
          {user?.role === 'ADMIN' && campaign.status === 'ACTIVE' && (
            <div className="detail-actions">
              <button className="btn btn-archive" type="button" disabled={Boolean(adminAction)} onClick={() => setReasonAction('archive')}>
                <FiArchive /> {adminAction === 'archive' ? 'Pausing...' : 'Pause'}
              </button>
            </div>
          )}
          {user?.role === 'ADMIN' && campaign.status === 'PAUSED' && (
            <div className="detail-actions">
              <button className="btn btn-restart" type="button" disabled={Boolean(adminAction)} onClick={() => actOnCampaign('restart')}>
                <FiRefreshCw /> {adminAction === 'restart' ? 'Restarting...' : 'Restart'}
              </button>
            </div>
          )}
          {canDeleteCampaign && (
            <div className="detail-actions">
              <button className="btn btn-delete" type="button" disabled={Boolean(adminAction)} onClick={() => setConfirmDelete(true)}>
                <FiTrash2 /> {adminAction === 'delete' ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </div>
      </section>
      <div className="dashboard-grid two-col">
        <section>
          <h2 className="block-title">Milestones</h2>
          <div className="milestone-timeline">
            {campaign.milestones.map((milestone) => (
              <div className="milestone-row" key={milestone.id}>
                <MilestoneCard
                  milestone={milestone}
                  action={user?.role === 'CREATOR' && milestone.status === 'PENDING' ? (
                    <button className="btn btn-soft btn-small milestone-detail-toggle" type="button" onClick={() => toggleProofForm(milestone.id)}>
                      <FiUploadCloud /> {openProofForms[milestone.id] ? 'Close Proof' : 'Submit Proof'}
                    </button>
                  ) : null}
                />
                {user?.role === 'ADMIN' && ['PROOF_SUBMITTED', 'VERIFIED'].includes(milestone.status) && (
                  <div className="table-actions milestone-actions">
                    {milestone.status === 'PROOF_SUBMITTED' && (
                      <button className="btn btn-cfx btn-small" type="button" disabled={Boolean(milestoneAction)} onClick={() => actOnMilestone(milestone, 'verify')}>
                        <FiCheckCircle /> Verify Proof
                      </button>
                    )}
                    {milestone.status === 'VERIFIED' && (
                      <>
                        <button className="btn btn-soft btn-small" type="button" disabled={Boolean(milestoneAction)} onClick={() => actOnMilestone(milestone, 'undoVerify')}>
                          <FiRefreshCw /> Redo Verification
                        </button>
                        <button className="btn btn-restart btn-small" type="button" disabled={Boolean(milestoneAction)} onClick={() => actOnMilestone(milestone, 'release')}>
                          Release INR {money(milestone.amount)}
                        </button>
                      </>
                    )}
                  </div>
                )}
                {user?.role === 'CREATOR' && milestone.status === 'PENDING' && openProofForms[milestone.id] && (
                  <GlassCard id={`proof-${milestone.id}`} className="milestone-proof-form" hover={false}>
                    <form onSubmit={(event) => submitProof(event, milestone)}>
                      <div className="form-grid">
                        <input required placeholder="Proof document URL" value={proofForms[milestone.id]?.proofUrl || ''} onChange={(event) => updateProofForm(milestone.id, { proofUrl: event.target.value })} />
                        <textarea placeholder="Proof notes for admin" value={proofForms[milestone.id]?.notes || ''} onChange={(event) => updateProofForm(milestone.id, { notes: event.target.value })} />
                      </div>
                      <button className="btn btn-cfx btn-small" type="submit" disabled={proofAction === milestone.id}>
                        <FiUploadCloud /> {proofAction === milestone.id ? 'Submitting...' : 'Submit Proof'}
                      </button>
                    </form>
                  </GlassCard>
                )}
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="block-title">Campaign Summary</h2>
          <GlassCard className="form-panel" hover={false}>
            <p>Status: <strong>{campaign.status}</strong></p>
            <p>Creator: <strong>{campaign.creatorName}</strong></p>
            <p>Milestones: <strong>{campaign.milestones.length}</strong></p>
            {actionReason && (
              <details className={`reason-dropdown action-reason-panel action-${actionReason.tone}`}>
                <summary>{actionReason.label}</summary>
                <p>{actionReason.value}</p>
              </details>
            )}
            {user?.role === 'ADMIN' && campaign.status !== 'PENDING' && (
              <span className={`action-state ${campaign.status === 'REJECTED' ? 'action-rejected' : campaign.status === 'PAUSED' ? 'action-paused' : 'action-approved'}`}>
                {campaign.status === 'REJECTED' ? <FiXCircle /> : campaign.status === 'PAUSED' ? <FiArchive /> : <FiCheckCircle />}
                {campaign.status === 'REJECTED' ? 'Rejected' : campaign.status === 'PAUSED' ? 'Paused' : 'Resolved'}
              </span>
            )}
          </GlassCard>
          <GlassCard className="form-panel milestone-summary-card" hover={false}>
            <h2>Milestone Summary</h2>
            <div className="milestone-summary-grid">
              <span><strong>{milestoneSummary.total}</strong>Total</span>
              <span><strong>{milestoneSummary.pending}</strong>Pending</span>
              <span><strong>{milestoneSummary.proofSubmitted}</strong>Proof Submitted</span>
              <span><strong>{milestoneSummary.verified}</strong>Verified</span>
              <span><strong>{milestoneSummary.released}</strong>Released</span>
              <span><strong>INR {money(milestoneSummary.releasedAmount)}</strong>Released Amount</span>
            </div>
          </GlassCard>
          {user?.role === 'DONOR' && campaign.status === 'ACTIVE' && (
            <GlassCard className="form-panel" hover={false}>
              <h2>Donate</h2>
              <p className="escrow-note">Your donation is locked in escrow. The creator receives funds only when an admin verifies and releases a campaign milestone.</p>
              <form onSubmit={submitDonation}>
                <div className="form-grid">
                  <input required type="number" min="1" placeholder="Amount" value={donation.amount} onChange={(e) => setDonation({ ...donation, amount: e.target.value })} />
                  <select className="cfx-select" value={donation.paymentMethod} onChange={(e) => setDonation({ ...donation, paymentMethod: e.target.value })}>
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card</option>
                    <option value="NETBANKING">Net banking</option>
                  </select>
                </div>
                <button className="btn btn-cfx" disabled={donating}>{donating ? 'Processing...' : 'Donate to Escrow'}</button>
              </form>
            </GlassCard>
          )}
        </section>
      </div>
      <ConfirmationDialog
        open={confirmDelete}
        title="Delete Campaign"
        message={`Delete ${campaign.title}? This only works when there is no donation history.`}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          actOnCampaign('delete');
        }}
      />
      <ReasonDialog
        open={Boolean(reasonAction)}
        title={reasonAction === 'reject' ? 'Reject Campaign' : 'Pause Campaign'}
        message={`${reasonAction === 'reject' ? 'Reject' : 'Pause'} ${campaign.title}? Add a clear reason for the creator.`}
        reasonLabel={reasonAction === 'reject' ? 'Reason for rejection' : 'Reason for pause'}
        onCancel={() => setReasonAction(null)}
        onConfirm={(reason) => {
          const action = reasonAction;
          setReasonAction(null);
          if (action) actOnCampaign(action, reason);
        }}
      />
    </PageTransition>
  );
}
