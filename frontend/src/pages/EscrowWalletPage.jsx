import { useEffect, useState } from 'react';
import { FiCreditCard, FiLock, FiRefreshCw, FiTrendingUp } from 'react-icons/fi';
import PageTransition from '../components/common/PageTransition.jsx';
import StatCard from '../components/common/StatCard.jsx';
import FundReleaseCard from '../components/domain/FundReleaseCard.jsx';
import { TrendChart } from '../components/charts/AnalyticsCharts.jsx';
import { dashboardService } from '../services/dashboardService.js';
import { useToast } from '../contexts/ToastContext.jsx';

export default function EscrowWalletPage() {
  const [dashboard, setDashboard] = useState({ charts: {} });
  const { notify } = useToast();

  useEffect(() => {
    dashboardService.escrow()
      .then(setDashboard)
      .catch((error) => notify(error.message, 'error'));
  }, [notify]);

  return (
    <PageTransition>
      <div className="page-head">
        <div>
          <p className="eyebrow">Escrow Wallet</p>
          <h2>Funds stay locked until milestones are verified.</h2>
        </div>
      </div>
      <div className="stats-grid">
        <StatCard icon={FiCreditCard} label="Total Funds Held" value={dashboard.totalFundsHeld || 0} prefix="INR " />
        <StatCard icon={FiTrendingUp} label="Released Funds" value={dashboard.releasedFunds || 0} prefix="INR " tone="green" />
        <StatCard icon={FiRefreshCw} label="Pending Releases" value={dashboard.pendingReleases || 0} prefix="INR " tone="amber" />
        <StatCard icon={FiLock} label="Remaining Balance" value={dashboard.remainingBalance || 0} prefix="INR " tone="cyan" />
      </div>
      <FundReleaseCard />
      <TrendChart title="Monthly Donation Movement" data={dashboard.charts?.trend} />
    </PageTransition>
  );
}
