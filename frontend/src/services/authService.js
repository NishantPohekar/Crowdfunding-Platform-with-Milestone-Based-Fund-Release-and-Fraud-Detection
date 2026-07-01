import api from './api';

export const authService = {
  login: (payload) => api.post('/auth/login', payload).then((res) => res.data),
  register: (payload) => api.post('/auth/register', payload).then((res) => res.data),
  profile: () => api.get('/auth/me').then((res) => res.data),
  updateProfile: (payload) => api.put('/auth/me', payload).then((res) => res.data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }).then((res) => res.data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }).then((res) => res.data),
  resetPassword: (payload) => api.post('/auth/reset-password', payload).then((res) => res.data)
};
