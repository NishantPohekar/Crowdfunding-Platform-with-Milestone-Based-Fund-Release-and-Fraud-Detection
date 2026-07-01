import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import GlassCard from '../common/GlassCard.jsx';

const colors = ['#38BDF8', '#22C55E', '#F59E0B', '#EF4444', '#A3E635'];
const riskColors = { Medium: '#F59E0B', High: '#EF4444', 'No data': '#64748B' };
const emptyTrend = [{ name: 'No data', donations: 0, campaigns: 0, risk: 0 }];
const moneyKeys = new Set(['donations', 'amount', 'funds', 'fundsRaised', 'released', 'locked', 'balance']);
const labelMap = {
  donations: 'Donation amount',
  campaigns: 'Campaigns created',
  risk: 'Risk alerts',
  value: 'Campaigns'
};

function formatChartValue(key, value) {
  const number = Number(value || 0);
  if (moneyKeys.has(key)) {
    return `INR ${number.toLocaleString('en-IN')}`;
  }
  return number.toLocaleString('en-IN');
}

function ChartTooltip({ active, payload, label, valueLabel }) {
  if (!active || !payload?.length) return null;
  const visibleItems = payload.filter((item) => item?.value !== undefined && item?.value !== null);

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-title">{label || visibleItems[0]?.payload?.name || 'Details'}</p>
      {visibleItems.map((item) => {
        const key = item.dataKey || 'value';
        const itemLabel = valueLabel || item.payload?.tooltipLabel || item.name || labelMap[key] || key;
        const itemValue = item.payload?.displayValue ?? item.value;
        return (
          <div className="chart-tooltip-row" key={`${itemLabel}-${key}`}>
            <span className="chart-tooltip-dot" style={{ background: item.color || item.payload?.fill || '#38BDF8' }} />
            <span>{itemLabel}</span>
            <strong>{formatChartValue(key, itemValue)}</strong>
          </div>
        );
      })}
    </div>
  );
}

export function TrendChart({ title = 'Donation Trends', dataKey = 'donations', data = emptyTrend }) {
  const chartData = data?.length ? data : emptyTrend;
  const valueLabel = labelMap[dataKey] || dataKey;
  return (
    <GlassCard className="chart-card" hover={false}>
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`fill-${dataKey}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.46} />
              <stop offset="95%" stopColor="#22C55E" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(148,163,184,0.14)" vertical={false} />
          <XAxis dataKey="name" stroke="#94A3B8" />
          <YAxis stroke="#94A3B8" />
          <Tooltip content={<ChartTooltip valueLabel={valueLabel} />} cursor={{ stroke: 'rgba(56,189,248,0.32)', strokeWidth: 2 }} />
          <Area type="monotone" dataKey={dataKey} name={valueLabel} stroke="#38BDF8" fill={`url(#fill-${dataKey})`} strokeWidth={3} activeDot={{ r: 5, fill: '#E0F2FE', stroke: '#38BDF8', strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}

export function CategoryChart({ title = 'Campaign Status Distribution', data = [] }) {
  const categoryData = data?.length ? data : [{ name: 'No data', value: 1, displayValue: 0, tooltipLabel: 'Campaigns' }];
  return (
    <GlassCard className="chart-card" hover={false}>
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={86} paddingAngle={4}>
            {categoryData.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} stroke="rgba(15,23,42,0.5)" />)}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="chart-legend">
        {categoryData.map((item, index) => (
          <span key={item.name}><i style={{ background: colors[index % colors.length] }} /> {item.name}</span>
        ))}
      </div>
    </GlassCard>
  );
}

export function RiskBarChart({ title = 'Risk Analysis', data = [] }) {
  const chartData = data?.length ? data : emptyTrend;
  return (
    <GlassCard className="chart-card" hover={false}>
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData}>
          <CartesianGrid stroke="rgba(148,163,184,0.14)" vertical={false} />
          <XAxis dataKey="name" stroke="#94A3B8" />
          <YAxis stroke="#94A3B8" />
          <Tooltip content={<ChartTooltip valueLabel="Risk alerts" />} cursor={{ fill: 'rgba(56,189,248,0.08)' }} />
          <Bar dataKey="risk" name="Risk alerts" radius={[10, 10, 4, 4]}>
            {chartData.map((entry) => <Cell key={entry.name} fill={riskColors[entry.name] || '#38BDF8'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
