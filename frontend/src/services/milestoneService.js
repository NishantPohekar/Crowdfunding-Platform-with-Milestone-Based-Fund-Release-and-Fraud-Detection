import api from './api';

export const milestoneService = {
  uploadProof: (id, payload) => api.post(`/milestones/${id}/proof`, payload).then((res) => res.data),
  verify: (id) => api.put(`/milestones/${id}/verify`).then((res) => res.data),
  undoVerify: (id) => api.put(`/milestones/${id}/undo-verify`).then((res) => res.data),
  release: (id) => api.put(`/milestones/${id}/release`).then((res) => res.data)
};
