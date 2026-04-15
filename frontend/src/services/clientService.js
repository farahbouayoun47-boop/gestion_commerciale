import { supportTickets, clients as defaultClients } from '../data';

const PROFILE_KEY = 'gestion_profile';
const NOTIFICATIONS_KEY = 'gestion_notifications';
const SUPPORT_KEY = 'gestion_support';
const CLIENTS_KEY = 'gestion_clients';

const getStoredProfile = () => {
  const stored = localStorage.getItem(PROFILE_KEY);
  if (stored) return JSON.parse(stored);
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

const saveProfile = (profile) => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  localStorage.setItem('user', JSON.stringify(profile));
};

const getStoredNotifications = () => {
  const stored = localStorage.getItem(NOTIFICATIONS_KEY);
  if (stored) return JSON.parse(stored);
  const defaultNotifications = supportTickets.map((ticket) => ({
    id: ticket.id,
    message: ticket.subject,
    type: ticket.status === 'Ouvert' ? 'warning' : 'info',
    createdAt: ticket.date,
    read: ticket.status !== 'Ouvert',
  }));
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(defaultNotifications));
  return defaultNotifications;
};

const saveNotifications = (notifications) => {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
};

const getStoredClients = () => {
  const stored = localStorage.getItem(CLIENTS_KEY);
  return stored ? JSON.parse(stored) : [...defaultClients];
};

const saveClients = (clients) => {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
};

const getCurrentUser = () => {
  const stored = localStorage.getItem('user');
  return stored ? JSON.parse(stored) : null;
};

export const getClientProfile = async () => {
  const user = getCurrentUser();
  if (!user) return null;
  const clients = getStoredClients();
  const client = clients.find((item) => item.id === user.id || item.email === user.email || item.name === user.name);
  const profileSource = client || user;
  const [firstName = '', ...restName] = (profileSource.name || '').split(' ');
  const lastName = restName.join(' ');

  return {
    firstName,
    lastName,
    email: profileSource.email || '',
    phone: profileSource.phone || '',
  };
};

export const updateClientProfile = async (profileData) => {
  const user = getCurrentUser();
  if (!user) throw new Error('Profil introuvable');

  const profileName = [profileData.firstName, profileData.lastName].filter(Boolean).join(' ') || user.name;
  const clients = getStoredClients();
  const updatedClients = clients.map((client) =>
    client.id === user.id
      ? {
          ...client,
          name: profileName,
          email: profileData.email?.trim().toLowerCase() || client.email,
          phone: profileData.phone || client.phone || '',
        }
      : client
  );
  saveClients(updatedClients);

  const updatedUser = {
    ...user,
    name: profileName,
    email: profileData.email?.trim().toLowerCase() || user.email,
  };
  localStorage.setItem('user', JSON.stringify(updatedUser));
  saveProfile(updatedUser);

  return updatedUser;
};

export const changePassword = async (passwordData) => {
  const user = getCurrentUser();
  if (!user) throw new Error('Profil introuvable');

  const clients = getStoredClients();
  const clientIndex = clients.findIndex((client) => client.id === user.id);
  if (clientIndex === -1) throw new Error('Profil introuvable');
  if (clients[clientIndex].password !== passwordData.oldPassword) {
    throw new Error('Ancien mot de passe incorrect');
  }

  clients[clientIndex] = {
    ...clients[clientIndex],
    password: passwordData.newPassword,
  };
  saveClients(clients);

  return { success: true };
};

export const submitSupportForm = async (supportData) => {
  const stored = JSON.parse(localStorage.getItem(SUPPORT_KEY) || '[]');
  const ticket = {
    id: `TKT-${Math.floor(100 + Math.random() * 900)}`,
    subject: supportData.subject,
    status: 'Ouvert',
    client: getStoredProfile()?.name || 'Client',
    date: new Date().toISOString().split('T')[0],
    message: supportData.message,
  };
  localStorage.setItem(SUPPORT_KEY, JSON.stringify([ticket, ...stored]));
  return ticket;
};

export const getNotifications = async () => {
  return getStoredNotifications();
};

export const markNotificationAsRead = async (id) => {
  const notifications = getStoredNotifications().map((notification) =>
    notification.id === id ? { ...notification, read: true } : notification
  );
  saveNotifications(notifications);
  return notifications.find((notification) => notification.id === id);
};

export const getClients = async () => {
  return getStoredClients();
};

export const createClient = async (clientData) => {
  const clients = getStoredClients();
  const newClient = {
    ...clientData,
    id: Date.now(),
    orders: 0,
    totalSpend: 0,
  };
  const updated = [newClient, ...clients];
  saveClients(updated);
  return newClient;
};

export const updateClient = async (id, clientData) => {
  const clients = getStoredClients();
  const updated = clients.map((client) =>
    client.id === id ? { ...client, ...clientData } : client
  );
  saveClients(updated);
  return updated.find((client) => client.id === id);
};

export const deleteClient = async (id) => {
  const clients = getStoredClients();
  const updated = clients.filter((client) => client.id !== id);
  saveClients(updated);
  return { success: true };
};