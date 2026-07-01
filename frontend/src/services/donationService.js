import api from './api';

export const donationService = {
  donate: (payload) => api.post('/donations', payload).then((res) => res.data),
  mine: (params) => api.get('/donations/my', { params }).then((res) => res.data)
};
