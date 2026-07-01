import api from './api';

export const complaintService = {
  list: () => api.get('/complaints').then((res) => res.data),
  mine: () => api.get('/complaints/my').then((res) => res.data),
  create: (payload) => api.post('/complaints', payload).then((res) => res.data),
  resolve: (id) => api.put(`/complaints/${id}/resolve`).then((res) => res.data)
};
