import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiEye, FiEyeOff, FiLock } from 'react-icons/fi';
import PageTransition from '../../components/common/PageTransition.jsx';
import GlassCard from '../../components/common/GlassCard.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { authService } from '../../services/authService.js';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [show, setShow] = useState(false);
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { notify } = useToast();

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await authService.resetPassword({ token, password });
      setPassword('');
      notify('Password reset successfully. You can sign in with the new password.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition className="auth-page">
      <GlassCard className="auth-card" hover={false}>
        <p className="eyebrow">Create New Secret</p>
        <h2>Reset Password</h2>
        <form className="auth-form" onSubmit={submit}>
          <label><FiLock /><input required autoComplete="one-time-code" placeholder="Reset token" value={token} onChange={(event) => setToken(event.target.value)} /></label>
          <label><FiLock /><input required type={show ? 'text' : 'password'} autoComplete="new-password" placeholder="New password" value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" onClick={() => setShow(!show)}>{show ? <FiEyeOff /> : <FiEye />}</button></label>
          <button className="btn btn-cfx w-100" disabled={loading}>{loading ? 'Saving...' : 'Reset Password'}</button>
        </form>
        <p className="auth-switch"><Link to="/login">Back to login</Link></p>
      </GlassCard>
    </PageTransition>
  );
}
