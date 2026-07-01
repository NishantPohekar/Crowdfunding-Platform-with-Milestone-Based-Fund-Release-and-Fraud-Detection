import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiCheckCircle, FiLock, FiShield, FiTrendingUp, FiZap } from 'react-icons/fi';
import PageTransition from '../components/common/PageTransition.jsx';
import GlassCard from '../components/common/GlassCard.jsx';
import StatCard from '../components/common/StatCard.jsx';
import CampaignCard from '../components/domain/CampaignCard.jsx';
import { campaignService } from '../services/campaignService.js';
import { dashboardService } from '../services/dashboardService.js';
import { normalizeCampaign, pageContent } from '../utils/campaignUtils.js';

const features = [
  ['Escrow Wallet Protection', FiLock],
  ['Milestone Verification', FiCheckCircle],
  ['Fraud Detection', FiShield],
  ['Secure Donations', FiZap],
  ['Transparent Funding', FiTrendingUp]
];

export default function LandingPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    dashboardService.public().then(setStats).catch(() => setStats({}));
    campaignService.list({ status: 'ACTIVE', size: 6 })
      .then((data) => setCampaigns(pageContent(data).map(normalizeCampaign)))
      .catch(() => setCampaigns([]));
  }, []);

  return (
    <PageTransition>
      <section className="hero-section">
        <div className="hero-media" />
        <div className="hero-content">
          <motion.p className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>TrustFund</motion.p>
          <h1>Fund Innovation. Release Funds with Trust.</h1>
          <p>Milestone-based crowdfunding with fraud protection and transparent fund release.</p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-cfx">Launch Platform <FiArrowRight /></Link>
            <Link to="/login" className="btn btn-soft">View Dashboards</Link>
          </div>
        </div>
      </section>

      <section className="section-grid features-grid">
        {features.map(([label, Icon]) => (
          <GlassCard key={label} className="feature-card">
            <Icon />
            <h3>{label}</h3>
          </GlassCard>
        ))}
      </section>

      <section className="stats-grid">
        <StatCard icon={FiTrendingUp} label="Total Campaigns" value={stats.totalCampaigns} />
        <StatCard icon={FiZap} label="Total Donations" value={stats.totalDonations} tone="cyan" />
        <StatCard icon={FiShield} label="Total Donors" value={stats.totalDonors} tone="violet" />
        <StatCard icon={FiCheckCircle} label="Funds Released" value={stats.totalFundsReleased} prefix="INR " tone="green" />
      </section>

      <section className="content-section">
        <div className="section-title">
          <p className="eyebrow">Featured Campaigns</p>
          <h2>High-trust campaigns with measurable milestones</h2>
        </div>
        <div className="campaign-carousel">
          {campaigns.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} />)}
          {campaigns.length === 0 && <p className="empty-state">No active campaigns yet.</p>}
        </div>
      </section>

      <section className="testimonials">
        {['Transparent milestone release made the donation feel accountable.', 'The dashboard gives admin teams real financial visibility.', 'Risk scoring makes trust measurable before money moves.'].map((quote, index) => (
          <GlassCard key={quote} className="testimonial-card">
            <p>{quote}</p>
            <span>Platform reviewer {index + 1}</span>
          </GlassCard>
        ))}
      </section>

      <section className="cta-section">
        <h2>Build trust into every rupee raised.</h2>
        <Link to="/register" className="btn btn-cfx">Create Account <FiArrowRight /></Link>
      </section>

      <footer className="footer">TrustFund - Milestone Based Crowdfunding Platform</footer>
    </PageTransition>
  );
}
