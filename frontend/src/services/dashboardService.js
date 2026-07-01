import api from './api';

export const dashboardService = {
  public: () => api.get('/dashboard/public').then((res) => res.data),
  donor: () => api.get('/dashboard/donor').then((res) => res.data),
  admin: () => api.get('/dashboard/admin').then((res) => res.data),
  escrow: () => api.get('/dashboard/escrow').then((res) => res.data)
};
