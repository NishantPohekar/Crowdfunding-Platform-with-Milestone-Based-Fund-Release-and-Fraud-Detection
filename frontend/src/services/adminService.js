import api from './api';

export const adminService = {
  complaints: () => api.get('/complaints').then((res) => res.data),
  resolveComplaint: (id) => api.put(`/complaints/${id}/resolve`).then((res) => res.data),
  fraudAlerts: () => api.get('/fraud/alerts').then((res) => res.data),
  verifyMilestone: (id) => api.put(`/milestones/${id}/verify`).then((res) => res.data),
  releaseMilestone: (id) => api.put(`/milestones/${id}/release`).then((res) => res.data),
  createAdmin: (payload) => api.post('/admin/users', payload).then((res) => res.data),
  updateUserProfile: (id, payload) => api.put(`/admin/users/${id}/profile`, payload).then((res) => res.data),
  deactivateUser: (id, payload = {}) => api.put(`/admin/users/${id}/deactivate`, payload).then((res) => res.data),
  activateUser: (id) => api.put(`/admin/users/${id}/activate`).then((res) => res.data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`).then((res) => res.data)
};
