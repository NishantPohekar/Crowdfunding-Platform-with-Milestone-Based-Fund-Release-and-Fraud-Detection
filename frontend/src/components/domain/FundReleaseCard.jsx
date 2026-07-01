import { FiArrowRight, FiCheckCircle, FiCreditCard, FiLock, FiShield } from 'react-icons/fi';
import GlassCard from '../common/GlassCard.jsx';

export default function FundReleaseCard() {
  const steps = [
    { label: 'Donation', icon: FiCreditCard },
    { label: 'Escrow Wallet', icon: FiLock },
    { label: 'Milestone Verification', icon: FiShield },
    { label: 'Fund Release', icon: FiCheckCircle }
  ];

  return (
    <GlassCard className="fund-flow" hover={false}>
      {steps.map((step, index) => (
        <div className="fund-flow-item" key={step.label}>
          <div className="flow-node"><step.icon /></div>
          <span>{step.label}</span>
          {index < steps.length - 1 && <FiArrowRight className="flow-arrow" />}
        </div>
      ))}
    </GlassCard>
  );
}
