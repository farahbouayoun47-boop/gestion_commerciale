import React, { createContext, useContext, useState, useEffect } from 'react';
import { updateClientProfile as saveClientProfile } from '../services/clientService';

const AuthContext = createContext();
const REGISTERED_CLIENTS_KEY = 'registered_clients';

const loadRegisteredClients = () => {
  const stored = localStorage.getItem(REGISTERED_CLIENTS_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveRegisteredClients = (clients) => {
  localStorage.setItem(REGISTERED_CLIENTS_KEY, JSON.stringify(clients));
};

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
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    if (credentials.role === 'admin') {
      if (credentials.password === 'RitaFer@2026') {
        const userData = { id: 1, name: credentials.username || 'Administrateur', role: 'admin', email: 'admin@gestion.com' };
        setUser(userData);
        localStorage.setItem('token', 'admin-token');
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true };
      }
      return { success: false, message: 'Email ou mot de passe administrateur incorrect.' };
    }

    const clients = loadRegisteredClients();
    const loginName = (credentials.username || credentials.name || '').trim().toLowerCase();
    const client = clients.find((item) => {
      const normalizedName = item.name?.trim().toLowerCase();
      const normalizedEmail = item.email?.trim().toLowerCase();
      const nameParts = normalizedName ? normalizedName.split(/\s+/) : [];
      return (
        (normalizedName === loginName ||
          normalizedEmail === loginName ||
          nameParts.includes(loginName)) &&
        item.password === credentials.password
      );
    });

    if (!client) {
      return { success: false, message: 'Compte client introuvable. Inscrivez-vous d’abord.' };
    }

    const userData = { id: client.id, name: client.name, role: 'client', email: client.email };
    setUser(userData);
    localStorage.setItem('token', 'client-token');
    localStorage.setItem('user', JSON.stringify(userData));
    return { success: true };
  };

  const signup = async (userData) => {
    const clients = loadRegisteredClients();
    const normalizedEmail = userData.email.trim().toLowerCase();

    if (clients.some((client) => client.email.toLowerCase() === normalizedEmail)) {
      return { success: false, message: 'Cet email est déjà utilisé. Veuillez vous connecter.' };
    }

    const newClient = {
      id: Date.now(),
      role: 'client',
      name: userData.name.trim(),
      email: normalizedEmail,
      password: userData.password,
      company: 'Nouveau client',
      phone: '',
      address: '',
    };

    saveRegisteredClients([newClient, ...clients]);
    return { success: true, message: 'Inscription réussie. Connectez-vous maintenant.' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateProfile = async (profileData) => {
    const updatedUser = { ...user, ...profileData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
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
      signup,
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