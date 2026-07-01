import CountUp from './CountUp.jsx';

export default function StatCard({ icon: Icon, label, value, tone = 'primary', prefix = '', suffix = '' }) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <div className="stat-icon">{Icon && <Icon />}</div>
      <div>
        <p>{label}</p>
        <h3><CountUp value={value} prefix={prefix} suffix={suffix} /></h3>
      </div>
    </div>
  );
}
