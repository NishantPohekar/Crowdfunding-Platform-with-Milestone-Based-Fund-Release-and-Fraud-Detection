import api from './api';

export const campaignService = {
  list: (params) => api.get('/campaigns', { params }).then((res) => res.data),
  mine: () => api.get('/campaigns/my').then((res) => res.data),
  get: (id) => api.get(`/campaigns/${id}`).then((res) => res.data),
  create: (payload) => api.post('/campaigns', payload).then((res) => res.data),
  approve: (id) => api.put(`/campaigns/${id}/approve`).then((res) => res.data),
  reject: (id, payload = {}) => api.put(`/campaigns/${id}/reject`, payload).then((res) => res.data),
  archive: (id, payload = {}) => api.put(`/campaigns/${id}/archive`, payload).then((res) => res.data),
  restart: (id) => api.put(`/campaigns/${id}/restart`).then((res) => res.data),
  delete: (id) => api.delete(`/campaigns/${id}`).then((res) => res.data)
};
