import { useEffect, useState } from 'react';
import { FiAlertTriangle, FiTrendingUp } from 'react-icons/fi';
import PageTransition from '../components/common/PageTransition.jsx';
import StatCard from '../components/common/StatCard.jsx';
import DataTable from '../components/common/DataTable.jsx';
import FraudAlertCard from '../components/domain/FraudAlertCard.jsx';
import { RiskBarChart } from '../components/charts/AnalyticsCharts.jsx';
import { Link } from 'react-router-dom';
import { adminService } from '../services/adminService.js';
import { dashboardService } from '../services/dashboardService.js';
import { useToast } from '../contexts/ToastContext.jsx';

export default function FraudMonitoringPage() {
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [riskCounts, setRiskCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const { notify } = useToast();

  useEffect(() => {
    Promise.all([adminService.fraudAlerts(), dashboardService.admin()])
      .then(([alerts, dashboard]) => {
        setFraudAlerts(alerts);
        setRiskCounts(dashboard.riskCounts || {});
      })
      .catch((error) => notify(error.message, 'error'))
      .finally(() => setLoading(false));
  }, [notify]);

  const riskData = [
    { name: 'Medium', risk: riskCounts.medium || 0 },
    { name: 'High', risk: riskCounts.high || 0 }
  ];
  const columns = [
    {
      key: 'campaignTitle',
      label: 'Campaign With Risk',
      render: (row) => <Link className="table-link" to={`/app/campaigns/${row.campaignId}`}>{row.campaignTitle}</Link>
    },
    { key: 'riskLevel', label: 'Risk Level', render: (row) => <span className={`risk-badge risk-${row.riskLevel.toLowerCase()}`}>{row.riskLevel}</span> },
    { key: 'riskScore', label: 'Score', render: (row) => `${row.riskScore}/100` },
    {
      key: 'reason',
      label: 'Why It Is Risky',
      render: (row) => <div className="risk-reasons">{(row.reason || 'No reason available').split(';').map((reason) => <span key={reason.trim()}>{reason.trim()}</span>)}</div>
    }
  ];

  return (
    <PageTransition>
      <div className="page-head">
        <div>
          <p className="eyebrow">Risk Monitoring</p>
          <h2>Futuristic fraud detection for transparent crowdfunding.</h2>
        </div>
      </div>
      <div className="stats-grid">
        <StatCard icon={FiTrendingUp} label="Medium Risk" value={riskCounts.medium || 0} tone="amber" />
        <StatCard icon={FiAlertTriangle} label="High Risk" value={riskCounts.high || 0} tone="danger" />
      </div>
      <RiskBarChart title="Risk Analysis" data={riskData} />
      <section>
        <h2 className="block-title">Campaigns With Risk</h2>
        <DataTable columns={columns} rows={fraudAlerts} loading={loading} emptyMessage="No risky campaigns found." />
      </section>
      <div className="fraud-grid">{fraudAlerts.map((alert) => <FraudAlertCard key={alert.id} alert={alert} />)}</div>
      {!loading && fraudAlerts.length === 0 && <p className="empty-state">No medium or high risk alerts.</p>}
    </PageTransition>
  );
}
