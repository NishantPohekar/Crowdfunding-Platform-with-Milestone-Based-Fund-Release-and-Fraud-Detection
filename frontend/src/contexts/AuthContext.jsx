import { createContext, useContext, useMemo, useState } from 'react';
import { authService } from '../services/authService';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

function readUser() {
  const stored = localStorage.getItem('cfx_user');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    localStorage.removeItem('cfx_access_token');
    localStorage.removeItem('cfx_refresh_token');
    localStorage.removeItem('cfx_user');
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser);
  const [loading, setLoading] = useState(false);
  const { notify } = useToast();

  const persistSession = (data, fallbackEmail) => {
    const nextUser = {
      userId: data.userId,
      name: data.name,
      role: data.role,
      email: data.email || fallbackEmail,
      expiresIn: data.expiresIn
    };
    localStorage.setItem('cfx_access_token', data.accessToken);
    localStorage.setItem('cfx_refresh_token', data.refreshToken);
    localStorage.setItem('cfx_user', JSON.stringify(nextUser));
    setUser(nextUser);
    return nextUser;
  };

  const login = async ({ email, password }) => {
    setLoading(true);
    try {
      const data = await authService.login({ email, password });
      const session = persistSession(data, email);
      notify('Login successful', 'success');
      return session;
    } catch (error) {
      notify(error.message, 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const data = await authService.register(payload);
      const session = persistSession(data, payload.email);
      notify('Account created', 'success');
      return session;
    } catch (error) {
      notify(error.message, 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('cfx_access_token');
    localStorage.removeItem('cfx_refresh_token');
    localStorage.removeItem('cfx_user');
    setUser(null);
    notify('Logged out', 'info');
  };

  const updateProfile = async (payload) => {
    const data = await authService.updateProfile(payload);
    const nextUser = { ...user, name: data.name, email: data.email, role: data.role, userId: data.userId };
    localStorage.setItem('cfx_user', JSON.stringify(nextUser));
    setUser(nextUser);
    notify('Profile updated', 'success');
    return nextUser;
  };

  const value = useMemo(() => ({ user, loading, login, register, logout, updateProfile, isAuthenticated: Boolean(user) }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
