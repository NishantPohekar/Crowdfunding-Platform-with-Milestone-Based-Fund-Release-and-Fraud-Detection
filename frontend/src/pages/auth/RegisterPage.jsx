import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff, FiLock, FiMail, FiUser } from 'react-icons/fi';
import PageTransition from '../../components/common/PageTransition.jsx';
import GlassCard from '../../components/common/GlassCard.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function RegisterPage() {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'DONOR' });
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    const session = await register(form);
    navigate(session.role === 'CREATOR' ? '/app/creator' : '/app/donor');
  };

  return (
    <PageTransition className="auth-page">
      <GlassCard className="auth-card" hover={false}>
        <p className="eyebrow">Join the network</p>
        <h2>Create account</h2>
        <form onSubmit={submit} className="auth-form">
          <label><FiUser /><input required autoComplete="name" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label><FiMail /><input required type="email" autoComplete="username" placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label><FiLock /><input required type={show ? 'text' : 'password'} autoComplete="new-password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><button type="button" onClick={() => setShow(!show)}>{show ? <FiEyeOff /> : <FiEye />}</button></label>
          <select className="cfx-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="DONOR">Donor</option>
            <option value="CREATOR">Campaign Creator</option>
          </select>
          <button className="btn btn-cfx w-100" disabled={loading}>{loading ? 'Creating...' : 'Register'}</button>
        </form>
        <p className="auth-switch">Already registered? <Link to="/login">Login</Link></p>
      </GlassCard>
    </PageTransition>
  );
}
