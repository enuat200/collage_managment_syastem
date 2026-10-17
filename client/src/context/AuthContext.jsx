import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client.js';

const AuthContext = createContext();

export const DEMO_USERS = {
  SUPER_ADMIN: { email: 'superadmin@college.edu', roleName: 'Super Admin' },
  COLLEGE_ADMIN: { email: 'admin@college.edu', roleName: 'College Administrator' },
  REGISTRAR: { email: 'registrar@college.edu', roleName: 'Registrar' },
  TEACHER: { email: 'teacher@college.edu', roleName: 'Teacher (Dr. Alan Turing)' },
  STUDENT: { email: 'student@college.edu', roleName: 'Student (Alice Johnson)' },
  ACCOUNTANT: { email: 'accountant@college.edu', roleName: 'Accountant' },
  LIBRARIAN: { email: 'librarian@college.edu', roleName: 'Librarian' },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('cms_token'));
  const [loading, setLoading] = useState(true);

  // Check current session on mount
  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const profile = await api.get('/auth/me');
        setUser(profile);
      } catch (err) {
        console.error('Session verification failed:', err);
        api.setToken(null);
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();

    const handleExpired = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('cms_auth_expired', handleExpired);
    return () => window.removeEventListener('cms_auth_expired', handleExpired);
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      api.setToken(res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (roleKey) => {
    const demo = DEMO_USERS[roleKey];
    if (demo) {
      return login(demo.email, 'Admin@123');
    }
  };

  const logout = () => {
    api.setToken(null);
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        quickLogin,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
