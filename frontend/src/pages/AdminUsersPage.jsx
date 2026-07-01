import { useEffect, useMemo, useState } from 'react';
import { FiCheckCircle, FiEdit2, FiEye, FiEyeOff, FiSave, FiSearch, FiSlash, FiTrash2, FiUsers, FiX } from 'react-icons/fi';
import PageTransition from '../components/common/PageTransition.jsx';
import DataTable from '../components/common/DataTable.jsx';
import StatCard from '../components/common/StatCard.jsx';
import ConfirmationDialog from '../components/common/ConfirmationDialog.jsx';
import ReasonDialog from '../components/common/ReasonDialog.jsx';
import PaginationControls from '../components/common/PaginationControls.jsx';
import { dashboardService } from '../services/dashboardService.js';
import { adminService } from '../services/adminService.js';
import { formatDate } from '../utils/campaignUtils.js';
import { useToast } from '../contexts/ToastContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '' });
  const [filters, setFilters] = useState({ search: '', role: 'ALL', status: 'ALL' });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [adminMeta, setAdminMeta] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const { notify } = useToast();
  const { user } = useAuth();
  const mainAdminEmail = adminMeta?.mainAdminEmail || 'trustfund.notification@gmail.com';
  const isMainAdmin = adminMeta?.isMainAdmin ?? user?.email?.toLowerCase() === mainAdminEmail;

  const loadUsers = () => {
    setLoading(true);
    dashboardService.admin()
      .then((data) => {
        setUsers(data.users || []);
        setAdminMeta(data.currentAdmin || null);
      })
      .catch((error) => notify(error.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, [notify]);

  useEffect(() => {
    setPage(0);
  }, [filters]);

  const roleCount = (role) => users.filter((user) => user.role === role).length;
  const filteredUsers = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return users.filter((row) => {
      const matchesSearch = !query || row.name?.toLowerCase().includes(query) || row.email?.toLowerCase().includes(query);
      const matchesRole = filters.role === 'ALL' || row.role === filters.role;
      const matchesStatus = filters.status === 'ALL' || (filters.status === 'ACTIVE' ? row.active : !row.active);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [filters, users]);

  const pagedUsers = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, page]);

  const runToggleUser = async (selectedUser, reason = '') => {
    setActionId(selectedUser.id);
    try {
      if (selectedUser.active) {
        await adminService.deactivateUser(selectedUser.id, { reason });
        notify('User deactivated', 'success');
      } else {
        await adminService.activateUser(selectedUser.id);
        notify('User reactivated', 'success');
      }
      loadUsers();
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setActionId(null);
    }
  };

  const runDeleteUser = async (row) => {
    setActionId(`delete-${row.id}`);
    try {
      await adminService.deleteUser(row.id);
      notify('User deleted', 'success');
      loadUsers();
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setActionId(null);
    }
  };

  const confirmSelectedAction = async () => {
    const selected = confirmAction;
    setConfirmAction(null);
    if (!selected) return;
    if (selected.type === 'delete') {
      await runDeleteUser(selected.user);
    } else if (selected.user.active) {
      setConfirmAction({ ...selected, needsReason: true });
    } else {
      await runToggleUser(selected.user);
    }
  };

  const createAdmin = async (event) => {
    event.preventDefault();
    setCreating(true);
    try {
      await adminService.createAdmin(adminForm);
      setAdminForm({ name: '', email: '', password: '' });
      notify('Admin created', 'success');
      loadUsers();
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  const startEditUser = (row) => {
    setEditingUser({ id: row.id, name: row.name || '' });
  };

  const saveUserName = async (event) => {
    event.preventDefault();
    if (!editingUser?.name.trim()) {
      notify('Name is required', 'error');
      return;
    }
    setActionId(`edit-${editingUser.id}`);
    try {
      await adminService.updateUserProfile(editingUser.id, { name: editingUser.name.trim() });
      setEditingUser(null);
      notify('Profile name updated', 'success');
      loadUsers();
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setActionId(null);
    }
  };

  const isCurrentUser = (row) => row.id === user?.userId || row.email?.toLowerCase() === user?.email?.toLowerCase();
  const isMainAdminAccount = (row) => row.email?.toLowerCase() === mainAdminEmail.toLowerCase();
  const cannotManageRow = (row) => isCurrentUser(row) || isMainAdminAccount(row) || (row.role === 'ADMIN' && !isMainAdmin);
  const canEditName = (row) => !isMainAdminAccount(row) || isCurrentUser(row);

  const columns = [
    { key: 'name', label: 'Name', render: (row) => editingUser?.id === row.id ? (
      <form className="inline-edit-form" onSubmit={saveUserName}>
        <input
          required
          maxLength="100"
          value={editingUser.name}
          onChange={(event) => setEditingUser({ ...editingUser, name: event.target.value })}
        />
        <button className="btn btn-approve btn-small" type="submit" disabled={actionId === `edit-${row.id}`} aria-label="Save name">
          <FiSave />
        </button>
        <button className="btn btn-soft btn-small" type="button" onClick={() => setEditingUser(null)} aria-label="Cancel edit">
          <FiX />
        </button>
      </form>
    ) : (
      <div className="table-user-name">
        <strong>{row.name}</strong>
        {canEditName(row) && (
          <button className="icon-btn-inline" type="button" onClick={() => startEditUser(row)} aria-label={`Edit ${row.name}`}>
            <FiEdit2 />
          </button>
        )}
      </div>
    ) },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (row) => <span className={`role-badge role-${row.role.toLowerCase()}`}>{row.role}</span> },
    { key: 'active', label: 'Status', render: (row) => (
      <div className="table-user">
        <span className={`status-chip ${row.active ? 'status-active' : 'status-paused'}`}>{row.active ? 'ACTIVE' : 'INACTIVE'}</span>
        {!row.active && row.deactivationReason && (
          <details className="reason-dropdown user-reason-dropdown">
            <summary>Deactivation reason</summary>
            <p>{row.deactivationReason}</p>
          </details>
        )}
      </div>
    ) },
    { key: 'createdAt', label: 'Joined', render: (row) => formatDate(row.createdAt) || 'Not available' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="table-actions">
          {cannotManageRow(row) ? <span className="muted-text">Protected</span> : (
            <>
              <button className={`btn ${row.active ? 'btn-deactivate' : 'btn-restart'} btn-small`} type="button" disabled={actionId === row.id} onClick={() => setConfirmAction({ type: 'toggle', user: row })}>
                {row.active ? <FiSlash /> : <FiCheckCircle />} {row.active ? 'Deactivate' : 'Reactivate'}
              </button>
              <button className="btn btn-delete btn-small" type="button" disabled={actionId === `delete-${row.id}`} onClick={() => setConfirmAction({ type: 'delete', user: row })}>
                <FiTrash2 /> Delete
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <PageTransition>
      <section className="page-head">
        <div>
          <p className="eyebrow">Admin Users</p>
          <h2>Platform user directory</h2>
        </div>
      </section>
      <div className="stats-grid">
        <StatCard icon={FiUsers} label="Total Users" value={users.length} />
        <StatCard icon={FiUsers} label="Admins" value={roleCount('ADMIN')} tone="cyan" />
        <StatCard icon={FiUsers} label="Creators" value={roleCount('CREATOR')} tone="green" />
        <StatCard icon={FiUsers} label="Donors" value={roleCount('DONOR')} tone="amber" />
      </div>
      {isMainAdmin && (
        <section>
          <h2 className="block-title">Create Admin</h2>
          <form className="form-panel admin-create-form" onSubmit={createAdmin}>
            <div className="form-grid">
              <input required placeholder="Admin name" value={adminForm.name} onChange={(event) => setAdminForm({ ...adminForm, name: event.target.value })} />
              <input required type="email" placeholder="Admin email" value={adminForm.email} onChange={(event) => setAdminForm({ ...adminForm, email: event.target.value })} />
              <label className="password-field">
                <input required type={showAdminPassword ? 'text' : 'password'} minLength="8" autoComplete="new-password" placeholder="Temporary password" value={adminForm.password} onChange={(event) => setAdminForm({ ...adminForm, password: event.target.value })} />
                <button type="button" aria-label={showAdminPassword ? 'Hide password' : 'Show password'} onClick={() => setShowAdminPassword((visible) => !visible)}>
                  {showAdminPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </label>
            </div>
            <button className="btn btn-cfx" type="submit" disabled={creating}>{creating ? 'Creating...' : 'Create Admin'}</button>
          </form>
        </section>
      )}
      <section>
        <h2 className="block-title">Users</h2>
        <div className="filter-bar users-filter-bar">
          <label className="filter-search"><FiSearch /><input placeholder="Search users" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} /></label>
          <select value={filters.role} onChange={(event) => setFilters({ ...filters, role: event.target.value })}>
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admins</option>
            <option value="CREATOR">Creators</option>
            <option value="DONOR">Donors</option>
          </select>
          <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
        {!loading && <PaginationControls page={page} pageSize={PAGE_SIZE} totalItems={filteredUsers.length} onPageChange={setPage} />}
        <DataTable columns={columns} rows={loading ? [] : pagedUsers} loading={loading} emptyMessage="No users match the current filters." />
        {!loading && <PaginationControls page={page} pageSize={PAGE_SIZE} totalItems={filteredUsers.length} onPageChange={setPage} />}
      </section>
      <ConfirmationDialog
        open={Boolean(confirmAction) && !confirmAction?.needsReason}
        title={confirmAction?.type === 'delete' ? 'Delete User' : confirmAction?.user?.active ? 'Deactivate User' : 'Reactivate User'}
        message={confirmAction?.type === 'delete'
          ? `Delete ${confirmAction?.user?.name}? Users with donations, campaigns, or grievances must be deactivated instead.`
          : `${confirmAction?.user?.active ? 'Deactivate' : 'Reactivate'} ${confirmAction?.user?.name}?`}
        onCancel={() => setConfirmAction(null)}
        onConfirm={confirmSelectedAction}
      />
      <ReasonDialog
        open={Boolean(confirmAction?.needsReason)}
        title="Deactivate User"
        message={`Deactivate ${confirmAction?.user?.name}? Add a clear reason for this user.`}
        reasonLabel="Reason for deactivation"
        onCancel={() => setConfirmAction(null)}
        onConfirm={(reason) => {
          const selected = confirmAction;
          setConfirmAction(null);
          if (selected?.user) runToggleUser(selected.user, reason);
        }}
      />
    </PageTransition>
  );
}
