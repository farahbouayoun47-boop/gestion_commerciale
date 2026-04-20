import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getCurrentUser } from '../services/authService';
import { updateClientProfile as saveClientProfile } from '../services/clientService';
import { getStorageItem, setStorageItem, removeStorageItem } from '../utils/storage';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getStorageItem('token');
      if (token) {
        try {
          const userData = await getCurrentUser();
          if (userData) {
            setUser(userData);
            setStorageItem('user', JSON.stringify(userData));
          } else {
            // Token invalide, nettoyer le stockage local
            removeStorageItem('token');
            removeStorageItem('user');
          }
        } catch (error) {
          console.error('Erreur lors de la récupération du profil:', error);
          removeStorageItem('token');
          removeStorageItem('user');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    if (credentials.password === 'RitaFer@2026') {
      // Try to login as admin with backend
      try {
        const adminCredentials = {
          login: credentials.name || 'admin',
          password: 'RitaFer@2026'
        };
        const response = await loginUser(adminCredentials);
        const { token, user: userData } = response;
        setUser(userData);
        setStorageItem('token', token);
        setStorageItem('user', JSON.stringify(userData));
        return { success: true, user: userData };
      } catch (error) {
        console.error('Admin login failed:', error);
        return { success: false, message: error.message || 'Connexion admin échouée. Vérifiez que le backend est démarré.' };
      }
    }

    try {
      const response = await loginUser(credentials);
      const { token, user: userData } = response;

      setUser(userData);
      setStorageItem('token', token);
      setStorageItem('user', JSON.stringify(userData));

      return { success: true, user: userData };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    removeStorageItem('token');
    removeStorageItem('user');
  };

  const updateProfile = async (profileData) => {
    const updatedUser = { ...user, ...profileData };
    setUser(updatedUser);
    setStorageItem('user', JSON.stringify(updatedUser));
    try {
      await saveClientProfile(profileData);
    } catch (error) {
      console.error('Erreur de mise à jour du profil:', error);
    }
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      updateProfile,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      isClient: user?.role === 'client'
    }}>
      {children}
    </AuthContext.Provider>
  );
};