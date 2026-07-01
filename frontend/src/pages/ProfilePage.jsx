import { useEffect, useState } from 'react';
import { FiSave, FiUser } from 'react-icons/fi';
import PageTransition from '../components/common/PageTransition.jsx';
import GlassCard from '../components/common/GlassCard.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { notify } = useToast();
  const [form, setForm] = useState({ name: user?.name || '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ name: user?.name || '' });
  }, [user?.name]);

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      notify('Name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ name: form.name.trim() });
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition>
      <section className="page-head">
        <div>
          <p className="eyebrow">Profile</p>
          <h2>Edit your account details</h2>
        </div>
      </section>
      <GlassCard className="form-panel" hover={false}>
        <h2><FiUser /> Self Profile</h2>
        <form onSubmit={submit}>
          <div className="form-grid">
            <input required placeholder="Full name" value={form.name} onChange={(event) => setForm({ name: event.target.value })} />
            <input disabled value={user?.email || ''} />
            <input disabled value={user?.role || ''} />
          </div>
          <button className="btn btn-cfx" type="submit" disabled={saving}><FiSave /> {saving ? 'Saving...' : 'Save Profile'}</button>
        </form>
      </GlassCard>
    </PageTransition>
  );
}
