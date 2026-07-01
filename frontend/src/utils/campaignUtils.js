export function normalizeCampaign(campaign, index = 0) {
  const raisedAmount = Number(campaign.raisedAmount ?? 0);
  const targetAmount = Number(campaign.targetAmount ?? 0);
  const createdAt = campaign.createdAt ? new Date(campaign.createdAt) : null;

  return {
    ...campaign,
    raisedAmount,
    targetAmount,
    category: campaign.category || 'General',
    riskLevel: campaign.riskLevel || 'LOW',
    image: campaign.imageUrl || campaign.image || campaignImageFor(campaign, index),
    daysLeft: campaign.daysLeft || (createdAt ? Math.max(1, 45 - Math.floor((Date.now() - createdAt.getTime()) / 86400000)) : 30),
    creatorName: campaign.creatorName || 'Campaign Creator',
    milestones: campaign.milestones || []
  };
}

export function pageContent(response) {
  return Array.isArray(response) ? response : response?.content || [];
}

export function money(value) {
  return Number(value || 0).toLocaleString('en-IN');
}

export function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export function sortCampaigns(campaigns = [], sortBy = 'LATEST') {
  const sorted = [...campaigns];
  if (sortBy === 'OLDEST') {
    return sorted.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  }
  if (sortBy === 'TITLE') {
    return sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  }
  return sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

export function campaignActionReason(campaign = {}) {
  if (campaign.status === 'REJECTED') {
    return { label: 'Rejection reason', value: campaign.rejectionReason || 'No rejection reason was recorded.', tone: 'rejected' };
  }
  if (campaign.status === 'PAUSED') {
    return { label: 'Pause reason', value: campaign.pauseReason || 'No pause reason was recorded.', tone: 'paused' };
  }
  return null;
}

export function chartDistributionToArray(distribution = {}) {
  return Object.entries(distribution).map(([name, value]) => ({ name, value: Number(value || 0) }));
}

export function campaignImageFor(campaign = {}, index = 0) {
  const text = `${campaign.title || ''} ${campaign.description || ''}`.toLowerCase();
  const images = [
    'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=900&q=80'
  ];

  if (text.includes('education') || text.includes('school') || text.includes('learning')) return images[0];
  if (text.includes('startup') || text.includes('innovation') || text.includes('business')) return images[1];
  if (text.includes('water') || text.includes('climate') || text.includes('solar')) return images[2];
  return images[index % images.length];
}
