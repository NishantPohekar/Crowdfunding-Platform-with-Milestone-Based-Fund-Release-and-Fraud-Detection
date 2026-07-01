import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff, FiLock, FiMail } from 'react-icons/fi';
import PageTransition from '../../components/common/PageTransition.jsx';
import GlassCard from '../../components/common/GlassCard.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function LoginPage() {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    const session = await login(form);
    navigate(session.role === 'ADMIN' ? '/app/admin' : session.role === 'CREATOR' ? '/app/creator' : '/app/donor');
  };

  return (
    <PageTransition className="auth-page">
      <GlassCard className="auth-card" hover={false}>
        <p className="eyebrow">Secure Access</p>
        <h2>Login to TrustFund</h2>
        <form onSubmit={submit} className="auth-form">
          <label><FiMail /><input required type="email" autoComplete="username" placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label><FiLock /><input required type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><button type="button" onClick={() => setShow(!show)}>{show ? <FiEyeOff /> : <FiEye />}</button></label>
          <div className="auth-row"><Link to="/forgot-password">Forgot password?</Link></div>
          <button className="btn btn-cfx w-100" disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>
        </form>
        <p className="auth-switch">New here? <Link to="/register">Create account</Link></p>
      </GlassCard>
    </PageTransition>
  );
}
