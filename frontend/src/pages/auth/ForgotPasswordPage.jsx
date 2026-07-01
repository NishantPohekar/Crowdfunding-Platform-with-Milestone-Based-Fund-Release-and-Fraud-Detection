import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCheckCircle, FiInbox, FiMail, FiRefreshCw } from 'react-icons/fi';
import PageTransition from '../../components/common/PageTransition.jsx';
import GlassCard from '../../components/common/GlassCard.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { authService } from '../../services/authService.js';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { notify } = useToast();

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await authService.forgotPassword(email);
      setSubmittedEmail(email.trim());
      notify(response.message || 'If this email exists, a reset link has been sent.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition className="auth-page">
      <GlassCard className="auth-card" hover={false}>
        <p className="eyebrow">Account Recovery</p>
        <h2>Forgot Password</h2>
        <form className="auth-form" onSubmit={submit}>
          <label><FiMail /><input required type="email" autoComplete="username" placeholder="Email address" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <button className="btn btn-cfx w-100" disabled={loading}>{loading ? 'Sending...' : submittedEmail ? 'Send Again' : 'Send Reset Link'}</button>
        </form>
        {submittedEmail && (
          <div className="reset-result reset-result-success">
            <div className="reset-icon"><FiCheckCircle /></div>
            <div>
              <h3>Check your inbox</h3>
              <p>We sent a password reset link to <strong>{submittedEmail}</strong> if that account exists.</p>
            </div>
            <div className="reset-help-list">
              <span><FiInbox /> Check Inbox, Spam, Promotions, and All Mail.</span>
              <span><FiRefreshCw /> If it does not arrive, wait a minute and send again.</span>
            </div>
          </div>
        )}
        <p className="auth-switch"><Link to="/login">Back to login</Link></p>
      </GlassCard>
    </PageTransition>
  );
}
